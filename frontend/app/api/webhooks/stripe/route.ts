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

  console.log(`🔔 Webhook received: ${event.type}`);

  // --- 1. HANDLE SUBSCRIPTION CHANGES (Created / Updated) ---
  if (
    event.type === 'customer.subscription.created' || 
    event.type === 'customer.subscription.updated'
  ) {
    const subscription = session;
    const priceId = subscription.items.data[0].price.id;
    const customerId = subscription.customer;
    const status = subscription.status;
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

    // Strategy 1: Try to get info from Metadata (Most Reliable)
    let planId = subscription.metadata?.targetPlanId;
    let userId = subscription.metadata?.userId;

    // Strategy 2: Fallback to Price ID mapping if metadata is missing
    if (!planId) {
        planId = findPlanByPriceId(priceId);
    }

    // Strategy 3: Find User by Customer ID if userId missing in metadata
    if (!userId) {
        const { data: users, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId);

        if (!fetchError && users && users.length > 0) {
            userId = users[0].id;
        }
    }

    if (planId && userId) {
      console.log(`🔄 Updating subscription for User ${userId} to Plan ${planId}`);

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          plan_id: planId,
          subscription_id: subscription.id,
          subscription_status: status,
          current_period_end: currentPeriodEnd,
        })
        .eq('id', userId);

      if (updateError) {
        console.error("❌ Error updating user subscription:", updateError);
        return new NextResponse('Update failed', { status: 500 });
      }
      
      console.log("✅ Subscription updated in DB via Subscription Event");
    } else {
      console.warn(`⚠️ Could not update subscription. PlanId: ${planId}, UserId: ${userId}, PriceId: ${priceId}`);
    }
  }

  // --- 2. HANDLE SUBSCRIPTION DELETION ---
  if (event.type === 'customer.subscription.deleted') {
    const subscription = session;
    const customerId = subscription.customer;

    console.log(`⚠️ Subscription deleted for customer ${customerId}`);

    // Find user by stripe_customer_id
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId);

    if (fetchError || !users || users.length === 0) {
      console.error("❌ User not found for customer:", customerId);
      return new NextResponse('User not found', { status: 400 });
    }

    const userId = users[0].id;

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'canceled',
        plan_id: null,
        subscription_id: null,
      })
      .eq('id', userId);

    if (error) {
      console.error("❌ Error cancelling subscription:", error);
      return new NextResponse('Update failed', { status: 500 });
    }

    console.log("✅ Subscription canceled for user:", userId);
  }

  // --- 3. HANDLE CHECKOUT COMPLETION (Primary for New Subs) ---
  if (event.type === 'checkout.session.completed') {
    const metadata = session.metadata;

    // A. Handle Token Refill
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
            // ... Update Logic ...
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
            // ... Insert Logic ...
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
      } catch (err) {
        console.error('❌ Error processing token refill:', err);
      }
    }

    // B. Handle New Subscription (Force Update from Session Metadata)
    if (metadata?.type === 'subscription_update') {
      const userId = metadata.userId;
      const stripeCustomerId = session.customer;
      const planId = metadata.targetPlanId;
      
      console.log(`🔗 Checkout Completed: User ${userId}, Plan ${planId}`);

      // Attempt to fetch fresh expiry
      let currentPeriodEnd: string | null = null;
      try {
        const subscription = await stripe.subscriptions.list({ customer: stripeCustomerId, limit: 1 });
        if (subscription.data.length > 0) {
            // ✅ FIX: Cast to 'any' to avoid TS error on 'current_period_end'
            const sub = subscription.data[0] as any;
            currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
        }
      } catch (e) { console.error("Could not fetch fresh expiry", e); }

      // Update DB
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          stripe_customer_id: stripeCustomerId,
          plan_id: planId,
          subscription_status: 'active',
          ...(currentPeriodEnd && { current_period_end: currentPeriodEnd }) 
        })
        .eq('id', userId);

      if (error) {
        console.error("❌ Failed to update user from checkout session:", error);
        return new NextResponse('Update failed', { status: 500 });
      }

      console.log("✅ Subscription updated in DB via Checkout Session");
    }
  }

  return new NextResponse(null, { status: 200 });
}