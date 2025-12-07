// frontend/app/api/webhooks/stripe/route.ts
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

  // --- 1. HANDLE SUBSCRIPTION CHANGES ---
  if (
    event.type === 'customer.subscription.created' || 
    event.type === 'customer.subscription.updated'
  ) {
    const subscription = session;
    const priceId = subscription.items.data[0].price.id;
    const customerId = subscription.customer;
    const status = subscription.status;
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

    const planId = findPlanByPriceId(priceId);

    if (planId) {
      console.log(`🔄 Updating subscription for customer ${customerId} to plan ${planId}`);
      
      // ✅ FIX: Use stripe_customer_id to find the user, then update plan_id
      const { data: users, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId);

      if (fetchError || !users || users.length === 0) {
        console.error("❌ User not found for customer:", customerId, fetchError);
        return new NextResponse('User not found', { status: 400 });
      }

      const userId = users[0].id;

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          plan_id: planId,
          subscription_id: subscription.id,
          subscription_status: status,
          current_period_end: currentPeriodEnd,  // ✅ LOGS EXPIRY DATE
        })
        .eq('id', userId);

      if (updateError) {
        console.error("❌ Error updating user subscription:", updateError);
        return new NextResponse('Update failed', { status: 500 });
      }
      
      console.log("✅ Subscription updated in DB for user:", userId);
    } else {
      console.warn("⚠️ Price ID not found in SUBSCRIPTION_PLANS:", priceId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = session;
    const customerId = subscription.customer;

    console.log(`⚠️ Subscription deleted for customer ${customerId}`);

    // ✅ FIX: Find user by stripe_customer_id first
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId);

    if (fetchError || !users || users.length === 0) {
      console.error("❌ User not found for customer:", customerId, fetchError);
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

  // --- 2. HANDLE CHECKOUT COMPLETION ---
  if (event.type === 'checkout.session.completed') {
    const metadata = session.metadata;

    // A. Handle Token Refill
    if (metadata?.type === 'token_refill') {
      try {
        const projectId = metadata.projectId;
        const newTokens = JSON.parse(metadata.purchased_tokens || '{}');
        const amountPaid = session.amount_total / 100;

        const { data: existingPack, error: fetchError } = await supabaseAdmin
            .from('token_packs')
            .select('*')
            .eq('project_id', projectId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("Error checking existing packs:", fetchError);
            return new NextResponse('Database Error', { status: 500 });
        }

        if (existingPack) {
            console.log("🔄 Updating existing token wallet...");

            const oldPurchased = existingPack.tokens_purchased || {};
            const oldRemaining = existingPack.remaining_tokens || {};

            const sumTokens = (key: string, oldObj: any, newObj: any) => 
                (Number(oldObj[key]) || 0) + (Number(newObj[key]) || 0);

            const updatedPurchased = {
                "gemini-2.5-pro": sumTokens("gemini-2.5-pro", oldPurchased, newTokens),
                "gemini-2.5-flash": sumTokens("gemini-2.5-flash", oldPurchased, newTokens),
                "gemini-3-pro-preview": sumTokens("gemini-3-pro-preview", oldPurchased, newTokens)
            };

            const updatedRemaining = {
                "gemini-2.5-pro": sumTokens("gemini-2.5-pro", oldRemaining, newTokens),
                "gemini-2.5-flash": sumTokens("gemini-2.5-flash", oldRemaining, newTokens),
                "gemini-3-pro-preview": sumTokens("gemini-3-pro-preview", oldRemaining, newTokens)
            };

            await supabaseAdmin.from('token_packs').update({
                tokens_purchased: updatedPurchased,
                remaining_tokens: updatedRemaining,
                price_paid: Number(existingPack.price_paid) + amountPaid,
                updated_at: new Date().toISOString(),
                expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            }).eq('id', existingPack.id);
            
            console.log("✅ Token wallet updated!");

        } else {
            console.log("✨ Creating new token wallet...");
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
            console.log("✅ New token wallet created!");
        }
      } catch (err) {
        console.error('❌ Error processing token refill:', err);
        return new NextResponse('Processing Error', { status: 500 });
      }
    }

    // B. Handle New Subscription (Link Stripe ID)
    if (metadata?.type === 'subscription_update') {
      const userId = metadata.userId;
      const stripeCustomerId = session.customer;
      const planId = metadata.targetPlanId;

      console.log(`🔗 Processing subscription for User ${userId}, Customer ${stripeCustomerId}, Plan ${planId}`);
      
      // ✅ Fetch subscription to get current_period_end
      let currentPeriodEnd: string | null = null;
      try {
        const subscription = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 1,
        });

        console.log('🔍 DEBUG - Subscription list response:', JSON.stringify(subscription.data[0], null, 2));

        if (subscription.data.length > 0) {
          const sub = subscription.data[0] as any;
          const timestampSeconds = sub.current_period_end;
          const dateObj = new Date(timestampSeconds * 1000);
          currentPeriodEnd = dateObj.toISOString();
          
          console.log(`⏱️ Raw timestamp from Stripe: ${timestampSeconds}`);
          console.log(`📅 Converted to ISO string: ${currentPeriodEnd}`);
          console.log(`✅ Will be logged to DB as: ${currentPeriodEnd}`);
        } else {
          console.warn('⚠️ No subscription found for customer');
        }
      } catch (err) {
        console.error('❌ Error fetching subscription expiry:', err);
      }

      // ✅ Update BOTH stripe_customer_id AND plan_id in one operation
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          stripe_customer_id: stripeCustomerId,
          plan_id: planId,
          subscription_status: 'active',
          current_period_end: currentPeriodEnd,  // ✅ LOG EXPIRY IMMEDIATELY
        })
        .eq('id', userId);

      if (error) {
        console.error("❌ Failed to update subscription:", error);
        return new NextResponse('Update failed', { status: 500 });
      }

      console.log("✅ Subscription updated for user:", userId);
    }
  }

  return new NextResponse(null, { status: 200 });
}