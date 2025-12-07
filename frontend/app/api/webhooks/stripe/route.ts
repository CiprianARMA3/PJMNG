import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/utils/stripe/config';
import { createAdminClient } from '@/utils/supabase/admin';
import { stripe } from '@/utils/stripe/server';

// Helper to match Stripe Price ID to your Plan IDs
const findPlanByPriceId = (priceId: string) => {
  for (const [planId, config] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (config.prices.month === priceId || config.prices.year === priceId) {
      return planId;
    }
  }
  return null;
};

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get('Stripe-Signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const session = event.data.object as any;

  console.log(`🔔 Webhook received: ${event.type} | ID: ${session.id}`);

  // Common function to update user subscription in DB
  const updateUserSubscription = async (
    stripeCustomerId: string, 
    priceId: string | null,
    status: string, 
    currentPeriodEnd: number | null | undefined, // Allow undefined
    metadata: any
  ) => {
    
    // 1. Determine User ID
    let userId = metadata?.userId || metadata?.supabase_user_id;

    // Fallback: Fetch from Customer if not in session metadata
    if (!userId) {
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId) as any;
        if (!customer.deleted && customer.metadata?.supabase_user_id) {
            userId = customer.metadata.supabase_user_id;
        } else if (!customer.deleted && customer.email) {
             // Fallback by Email
             const { data: userByEmail } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', customer.email)
                .single();
             if (userByEmail) userId = userByEmail.id;
        }
      } catch (e) {
        console.error("Error fetching customer:", e);
      }
    }

    // Fallback: Search in DB by Stripe Customer ID
    if (!userId) {
       const { data: users } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();
       if (users) userId = users.id;
    }

    if (!userId) {
        console.error(`❌ Fatal: Could not find User for Customer ${stripeCustomerId}`);
        return false;
    }

    // 2. Determine Plan ID
    let planId = metadata?.targetPlanId;
    if (!planId && priceId) {
        planId = findPlanByPriceId(priceId);
    }

    // 3. Prepare Update Data
    let endIso: string;
    
    // Safety check for date
    if (typeof currentPeriodEnd === 'number' && !isNaN(currentPeriodEnd)) {
        endIso = new Date(currentPeriodEnd * 1000).toISOString();
    } else {
        console.warn(`⚠️ Invalid currentPeriodEnd (${currentPeriodEnd}) for User ${userId}. Defaulting to +30 days.`);
        // Default to 30 days from now to keep the account active if we missed the date
        endIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    const updateData: any = {
        subscription_status: status,
        current_period_end: endIso,
        stripe_customer_id: stripeCustomerId
    };

    if (planId) updateData.plan_id = planId;

    if (session.object === 'subscription') {
        updateData.subscription_id = session.id;
    } else if (session.subscription) {
        updateData.subscription_id = session.subscription;
    }

    console.log(`🔄 Updating User ${userId}: Status=${status}, Plan=${planId || 'Keep Existing'}, Ends=${endIso}`);

    const { error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId);

    if (error) {
        console.error("❌ DB Update Error:", error);
        return false;
    }
    return true;
  };

  // --- HANDLERS ---

  if (
    event.type === 'customer.subscription.created' || 
    event.type === 'customer.subscription.updated'
  ) {
    const subscription = session;
    const priceId = subscription.items.data[0]?.price.id;
    
    await updateUserSubscription(
        subscription.customer,
        priceId,
        subscription.status,
        subscription.current_period_end,
        subscription.metadata
    );
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = session;
    if (invoice.subscription) {
        const priceId = invoice.lines.data[0]?.price?.id;
        // Robust check for period end
        const periodEnd = invoice.lines.data[0]?.period?.end || invoice.period_end;
        
        await updateUserSubscription(
            invoice.customer,
            priceId,
            'active', 
            periodEnd,
            invoice.metadata 
        );
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = session;
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('stripe_customer_id', subscription.customer)
        .single();

    if (user) {
        await supabaseAdmin.from('users').update({
            subscription_status: 'canceled',
            plan_id: null,
            subscription_id: null
        }).eq('id', user.id);
        console.log(`🚫 Subscription fully deleted for User ${user.id}`);
    }
  }

  if (event.type === 'checkout.session.completed') {
    const metadata = session.metadata;

    if (metadata?.type === 'token_refill') {
       try {
        const projectId = metadata.projectId;
        const newTokens = JSON.parse(metadata.purchased_tokens || '{}');
        const amountPaid = session.amount_total / 100;

        const { data: existingPack } = await supabaseAdmin
            .from('token_packs')
            .select('*')
            .eq('project_id', projectId)
            .single();

        if (existingPack) {
            const oldPurchased = existingPack.tokens_purchased || {};
            const oldRemaining = existingPack.remaining_tokens || {};
            const sumTokens = (key: string, oldObj: any, newObj: any) => (Number(oldObj[key]) || 0) + (Number(newObj[key]) || 0);

            await supabaseAdmin.from('token_packs').update({
                tokens_purchased: {
                    "gemini-2.5-pro": sumTokens("gemini-2.5-pro", oldPurchased, newTokens),
                    "gemini-2.5-flash": sumTokens("gemini-2.5-flash", oldPurchased, newTokens),
                    "gemini-3-pro-preview": sumTokens("gemini-3-pro-preview", oldPurchased, newTokens)
                },
                remaining_tokens: {
                    "gemini-2.5-pro": sumTokens("gemini-2.5-pro", oldRemaining, newTokens),
                    "gemini-2.5-flash": sumTokens("gemini-2.5-flash", oldRemaining, newTokens),
                    "gemini-3-pro-preview": sumTokens("gemini-3-pro-preview", oldRemaining, newTokens)
                },
                price_paid: Number(existingPack.price_paid) + amountPaid,
                updated_at: new Date().toISOString(),
                expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            }).eq('id', existingPack.id);
        } else {
             const fullTokenSet = {
                "gemini-2.5-pro": newTokens["gemini-2.5-pro"] || 0,
                "gemini-2.5-flash": newTokens["gemini-2.5-flash"] || 0,
                "gemini-3-pro-preview": newTokens["gemini-3-pro-preview"] || 0
            };
            await supabaseAdmin.from('token_packs').insert({
                user_id: metadata.userId,
                project_id: projectId,
                price_paid: amountPaid,
                purchased_at: new Date().toISOString(),
                expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                tokens_purchased: fullTokenSet,
                remaining_tokens: fullTokenSet,
                metadata: { stripe_session_id: session.id }
            });
        }
        console.log("✅ Token wallet updated!");
       } catch(e) { console.error("Token refill error", e); }
    }
    
    // B. Handle New Subscription (Force Update from Session Metadata)
    if (metadata?.type === 'subscription_update') {
        const subscriptionId = session.subscription;
        
        // Default to 30 days from now if fetch fails
        let currentPeriodEnd = Math.floor(Date.now() / 1000) + 2592000;

        try {
            // ✅ FIX: Verify string + Cast 'sub' to any to avoid TS error on 'Response<Subscription>'
            if (subscriptionId && typeof subscriptionId === 'string') {
                const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
                if (sub.current_period_end) {
                    currentPeriodEnd = sub.current_period_end;
                }
            }
        } catch(e) { 
            console.error("Sub fetch failed, using default date:", e); 
        }
        
        await updateUserSubscription(
            session.customer,
            null, 
            'active',
            currentPeriodEnd,
            metadata 
        );
    }
  }

  return new NextResponse(null, { status: 200 });
}