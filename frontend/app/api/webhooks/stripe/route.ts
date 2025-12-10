// frontend/app/api/webhooks/stripe/route.ts

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

  // Helper: Find user by Stripe customer ID (Kept for token processing)
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

  // Helper: Map Stripe Price ID to Internal Plan UUID (Kept for logging/reference)
  const getPlanIdFromPrice = (priceId: string) => {
    for (const [planId, config] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (config.prices.month === priceId || config.prices.year === priceId) {
        return planId;
      }
    }
    return null;
  };

  // --- TOKEN PURCHASES (checkout.session.completed) (KEEP: Token system is untouched) ---
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

  // --- SUBSCRIPTION CREATED / UPDATED / DELETED (DB updates REMOVED) ---
  // Subscription status is now fetched on demand from Stripe.
  
  if (event.type === 'customer.subscription.created') {
    console.log(`\n📝 [STRIPE-WEBHOOK] Subscription CREATED: ${data.id}. Status will be fetched on demand.`);
    return new NextResponse(null, { status: 200 });
  }

  if (event.type === 'customer.subscription.updated') {
    console.log(`\n🔄 [STRIPE-WEBHOOK] Subscription UPDATED: ${data.id}. Status will be fetched on demand.`);
    return new NextResponse(null, { status: 200 });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = data;
    console.log(`\n🗑️ [STRIPE-WEBHOOK] Subscription DELETED: ${subscription.id}. Status will be fetched on demand.`);
    return new NextResponse(null, { status: 200 });
  }

  // --- PAYMENT EVENTS (Payment Confirmed/Rejected mirror) ---
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