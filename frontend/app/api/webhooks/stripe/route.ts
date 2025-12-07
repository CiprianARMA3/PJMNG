import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import {SUBSCRIPTION_PLANS } from '@/utils/stripe/config';
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
    const status = subscription.status; // active, past_due, etc.
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

    const planId = findPlanByPriceId(priceId);

    if (planId) {
      console.log(`🔄 Updating subscription for customer ${customerId} to plan ${planId}`);
      
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          plan_id: planId,
          subscription_id: subscription.id,
          subscription_status: status,
          current_period_end: currentPeriodEnd,
          // We assume stripe_customer_id is already linked via checkout.session.completed
        })
        .eq('stripe_customer_id', customerId);

      if (error) console.error("❌ Error updating user subscription:", error);
      else console.log("✅ Subscription updated in DB");
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = session;
    const customerId = subscription.customer;

    console.log(`⚠️ Subscription deleted for customer ${customerId}`);

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'canceled',
        plan_id: null, // Optional: revert to free plan ID if you have one
      })
      .eq('stripe_customer_id', customerId);

    if (error) console.error("❌ Error cancelling subscription:", error);
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

        // Check if a pack already exists
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
            // Update Existing Wallet
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
            // Create New Wallet
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

      console.log(`🔗 Linking Stripe Customer ${stripeCustomerId} to User ${userId}`);
      
      const { error } = await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);

      if (error) console.error("❌ Failed to link customer ID:", error);
    }
  }

  return new NextResponse(null, { status: 200 });
}