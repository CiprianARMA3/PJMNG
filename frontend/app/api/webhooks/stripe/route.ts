import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { stripe } from '@/utils/stripe/server';
import { SUBSCRIPTION_PLANS } from '@/utils/stripe/config';

export async function POST(req: Request) {
  console.log("\n🔥 [STRIPE-WEBHOOK] Webhook event received");
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
    console.log(`✅ [STRIPE-WEBHOOK] Event type: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ [STRIPE-WEBHOOK] Signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const data = event.data.object as any;

  // Helper: Find user by Stripe customer ID
  const findUserByCustomerId = async (customerId: string) => {
    console.log(`🔍 [STRIPE-WEBHOOK] Looking up user for customer ${customerId}`);
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !user) {
      console.error(`❌ [STRIPE-WEBHOOK] User not found for customer ${customerId}`);
      return null;
    }

    console.log(`✅ [STRIPE-WEBHOOK] Found user: ${user.id}`);
    return user.id;
  };

  // Helper: Map Stripe Price ID to Internal Plan UUID
  const getPlanIdFromPrice = (priceId: string) => {
    for (const [planId, config] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (config.prices.month === priceId || config.prices.year === priceId) {
        return planId;
      }
    }
    return null;
  };

  // --- TOKEN PURCHASES (checkout.session.completed) ---
  if (event.type === 'checkout.session.completed') {
    const session = data;
    const metadata = session.metadata;

    console.log(`\n💳 [STRIPE-WEBHOOK] Checkout session completed: ${session.id}`);

    if (metadata?.type === 'token_refill') {
      console.log(`[STRIPE-TOKEN] Processing token refill...`);

      try {
        const projectId = metadata.projectId;
        const userId = metadata.userId;
        const newTokens = JSON.parse(metadata.purchased_tokens || '{}');
        const amountPaid = (session.amount_total || 0) / 100;
        const currency = (session.currency || 'eur').toUpperCase();

        console.log(`[STRIPE-TOKEN] Project: ${projectId}, User: ${userId}`);
        
        // Log transactions
        const tokenEntries = Object.entries(newTokens).filter(([, tokens]) => Number(tokens) > 0);
        const totalTokensPurchased = tokenEntries.reduce((sum, [, tokens]) => sum + Number(tokens), 0);
        const pricePerToken = totalTokensPurchased > 0 ? amountPaid / totalTokensPurchased : 0;

        for (const [modelKey, tokensAdded] of tokenEntries) {
          const tokenAmount = Number(tokensAdded);
          const transactionAmount = tokenAmount * pricePerToken;

          await supabaseAdmin.from('token_transactions').insert({
            user_id: userId,
            project_id: projectId,
            model_key: modelKey,
            tokens_added: tokenAmount,
            amount_paid: parseFloat(transactionAmount.toFixed(2)),
            currency: currency,
            source: 'Stripe Token Pack Purchase',
            stripe_session_id: session.id,
            metadata: {
              checkout_session_id: session.id,
              token_pack_breakdown: newTokens
            }
          });
        }

        // Update token packs logic...
        const { data: packs } = await supabaseAdmin
          .from('token_packs')
          .select('*')
          .eq('project_id', projectId);

        const existingPack = packs?.length ? packs[0] : null;
        const sumTokens = (key: string, oldObj: any, newObj: any) => {
          const oldVal = Number(oldObj?.[key]) || 0;
          const newVal = Number(newObj?.[key]) || 0;
          return oldVal + newVal;
        };

        if (existingPack) {
            await supabaseAdmin.from('token_packs').update({
            tokens_purchased: {
              "gemini-2.5-pro": sumTokens("gemini-2.5-pro", existingPack.tokens_purchased, newTokens),
              "gemini-2.5-flash": sumTokens("gemini-2.5-flash", existingPack.tokens_purchased, newTokens),
              "gemini-3-pro-preview": sumTokens("gemini-3-pro-preview", existingPack.tokens_purchased, newTokens)
            },
            remaining_tokens: {
              "gemini-2.5-pro": sumTokens("gemini-2.5-pro", existingPack.remaining_tokens, newTokens),
              "gemini-2.5-flash": sumTokens("gemini-2.5-flash", existingPack.remaining_tokens, newTokens),
              "gemini-3-pro-preview": sumTokens("gemini-3-pro-preview", existingPack.remaining_tokens, newTokens)
            },
            price_paid: Number(existingPack.price_paid) + amountPaid,
            updated_at: new Date().toISOString(),
            expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          }).eq('id', existingPack.id);
        } else {
            await supabaseAdmin.from('token_packs').insert({
            user_id: userId,
            project_id: projectId,
            price_paid: amountPaid,
            purchased_at: new Date().toISOString(),
            expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            tokens_purchased: newTokens,
            remaining_tokens: newTokens,
            metadata: { stripe_session_id: session.id }
          });
        }
        console.log(`✅ [STRIPE-TOKEN] Token refill completed\n`);
      } catch (error: any) {
        console.error(`❌ [STRIPE-TOKEN] Error:`, error.message);
      }
    }

    return new NextResponse(null, { status: 200 });
  }

  // --- SUBSCRIPTION CREATED / UPDATED ---
  const handleSubscriptionChange = async (subscription: any) => {
    const userId = await findUserByCustomerId(subscription.customer);
    if (!userId) return;

    // 1. Determine Status
    // Active if 'active' or 'trialing'. Everything else (past_due, unpaid) is inactive.
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    
    // IMPORTANT: Your DB column "subscription_status" is TEXT, so we must save a string
    const statusString = isActive ? 'active' : 'inactive';

    // 2. Determine Plan ID
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const planId = priceId ? getPlanIdFromPrice(priceId) : null;

    console.log(`   Status: ${subscription.status} -> DB: ${statusString}`);
    console.log(`   Plan ID: ${planId}`);

    // 3. Update User
    const { error } = await supabaseAdmin.from('users').update({
        plan_id: planId, // Updates plan to correct ID (or null if not found)
        subscription_status: statusString, 
        updated_at: new Date().toISOString()
    }).eq('id', userId);

    if (error) console.error('❌ [STRIPE-WEBHOOK] Failed to update user:', error);
    else console.log(`✅ [STRIPE-WEBHOOK] User ${userId} updated successfully.`);
  };

  if (event.type === 'customer.subscription.created') {
    console.log(`\n📝 [STRIPE-WEBHOOK] Subscription CREATED: ${data.id}`);
    await handleSubscriptionChange(data);
    return new NextResponse(null, { status: 200 });
  }

  if (event.type === 'customer.subscription.updated') {
    console.log(`\n🔄 [STRIPE-WEBHOOK] Subscription UPDATED: ${data.id}`);
    await handleSubscriptionChange(data);
    return new NextResponse(null, { status: 200 });
  }

  // --- SUBSCRIPTION DELETED ---
  if (event.type === 'customer.subscription.deleted') {
    const subscription = data;
    console.log(`\n🗑️ [STRIPE-WEBHOOK] Subscription DELETED: ${subscription.id}`);

    const userId = await findUserByCustomerId(subscription.customer);
    if (userId) {
      // Set status to 'inactive' and remove plan_id
      const { error } = await supabaseAdmin.from('users').update({
          plan_id: null,
          subscription_status: 'inactive', // String value
          updated_at: new Date().toISOString()
      }).eq('id', userId);

      if (error) console.error('❌ [STRIPE-WEBHOOK] Failed to cancel user subscription:', error);
      else console.log(`✅ [STRIPE-WEBHOOK] User ${userId} subscription cancelled.`);
    }

    return new NextResponse(null, { status: 200 });
  }

  // --- PAYMENT EVENTS (Logging only) ---
  if (event.type === 'invoice.payment_failed') {
    console.log(`\n⚠️ [STRIPE-WEBHOOK] Payment FAILED: ${data.id}`);
    return new NextResponse(null, { status: 200 });
  }

  if (event.type === 'invoice.payment_succeeded') {
    console.log(`\n✅ [STRIPE-WEBHOOK] Payment SUCCEEDED: ${data.id}`);
    return new NextResponse(null, { status: 200 });
  }

  console.log(`[STRIPE-WEBHOOK] Event ignored: ${event.type}`);
  return new NextResponse(null, { status: 200 });
}