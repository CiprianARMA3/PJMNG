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
  console.log("🔥 [STRIPE-WEBHOOK] Endpoint hit! Reading body...");
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
    console.log(`✅ [STRIPE-WEBHOOK] Event constructed: ${event.type}`);
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

    console.log(`\n🔔 [STRIPE-DEBUG] updateUserSubscription called:`);
    console.log(`   Customer: ${stripeCustomerId}`);
    console.log(`   Price ID: ${priceId}`);
    console.log(`   Status: ${status}`);
    console.log(`   Period End: ${currentPeriodEnd}`);
    console.log(`   Metadata:`, JSON.stringify(metadata, null, 2));

    // 1. Determine User ID
    let userId = metadata?.userId || metadata?.supabase_user_id;

    // Fallback: Fetch from Customer if not in session metadata
    if (!userId) {
      console.log(`⚠️ [STRIPE-DEBUG] No userId in metadata, attempting fallback lookup...`);
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId) as any;
        if (!customer.deleted && customer.metadata?.supabase_user_id) {
          userId = customer.metadata.supabase_user_id;
          console.log(`✅ [STRIPE-DEBUG] Found userId from Customer metadata: ${userId}`);
        } else if (!customer.deleted && customer.email) {
          // Fallback by Email
          console.log(`ℹ️ [STRIPE-DEBUG] Looking up user by email: ${customer.email}`);
          const { data: userByEmail } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', customer.email)
            .single();
          if (userByEmail) {
            userId = userByEmail.id;
            console.log(`✅ [STRIPE-DEBUG] Found userId by email: ${userId}`);
          }
        }
      } catch (e) {
        console.error("[STRIPE-DEBUG] Error fetching customer:", e);
      }
    }

    // Fallback: Search in DB by Stripe Customer ID
    if (!userId) {
      console.log(`ℹ️ [STRIPE-DEBUG] Looking up user by stripe_customer_id: ${stripeCustomerId}`);
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();
      if (users) {
        userId = users.id;
        console.log(`✅ [STRIPE-DEBUG] Found userId by stripe_customer_id: ${userId}`);
      }
    }

    if (!userId) {
      console.error(`❌ [STRIPE-DEBUG] Fatal: Could not find User for Customer ${stripeCustomerId}`);
      return false;
    }

    console.log(`✅ [STRIPE-DEBUG] Final User ID: ${userId}`);

    // 2. Determine Plan ID (PRIORITY: price_id lookup, then metadata)
    let planId: string | null = null;

    // First try: Look up from price_id (MOST RELIABLE)
    if (priceId) {
      planId = findPlanByPriceId(priceId);
      if (planId) {
        console.log(`✅ [STRIPE-DEBUG] Plan ID found from price lookup: ${planId} (${SUBSCRIPTION_PLANS[planId]?.name})`);
      } else {
        console.warn(`⚠️ [STRIPE-DEBUG] No plan found for price_id: ${priceId}`);
        console.log(`   [STRIPE-DEBUG] Available Plans:`, JSON.stringify(SUBSCRIPTION_PLANS, null, 2));
      }
    }

    // Second try: Get from metadata (fallback)
    if (!planId && metadata?.targetPlanId) {
      planId = metadata.targetPlanId;
      console.log(`📋 [STRIPE-DEBUG] Plan ID from metadata: ${planId}`);
    }

    // Third try: Check metadata.priceId
    if (!planId && metadata?.priceId) {
      planId = findPlanByPriceId(metadata.priceId);
      if (planId) {
        console.log(`✅ [STRIPE-DEBUG] Plan ID found from metadata.priceId: ${planId}`);
      }
    }

    if (!planId) {
      console.warn(`⚠️ [STRIPE-DEBUG] Could not determine plan_id for user ${userId}. Will update without changing plan_id.`);
    }

    // 3. Prepare Update Data
    let endIso: string;

    // Safety check for date
    if (typeof currentPeriodEnd === 'number' && !isNaN(currentPeriodEnd)) {
      endIso = new Date(currentPeriodEnd * 1000).toISOString();
    } else {
      console.warn(`⚠️ [STRIPE-DEBUG] Invalid currentPeriodEnd (${currentPeriodEnd}) for User ${userId}. Defaulting to +30 days.`);
      // Default to 30 days from now to keep the account active if we missed the date
      endIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const updateData: any = {
      subscription_status: status,
      current_period_end: endIso,
      stripe_customer_id: stripeCustomerId
    };

    // CRITICAL: Always set plan_id if we have one
    if (planId) {
      updateData.plan_id = planId;
      console.log(`📌 [STRIPE-DEBUG] Setting plan_id to: ${planId}`);
    }

    if (session.object === 'subscription') {
      updateData.subscription_id = session.id;
    } else if (session.subscription) {
      updateData.subscription_id = session.subscription;
    }

    console.log(`🔄 [STRIPE-DEBUG] Updating User ${userId} with data:`, JSON.stringify(updateData, null, 2));

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error("❌ [STRIPE-DEBUG] DB Update Error:", error);
      return false;
    }

    console.log(`✅ [STRIPE-DEBUG] User ${userId} updated successfully!`);
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
      let priceId = invoice.lines.data[0]?.price?.id;
      let periodEnd = invoice.lines.data[0]?.period?.end || invoice.period_end;
      let metadata = invoice.metadata;

      // ✅ ROBUSTNESS FIX: Fetch the subscription to get authoritative metadata & price
      try {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        if (sub) {
          console.log(`✅ Fetched subscription ${sub.id} for invoice ${invoice.id}`);
          // Prefer subscription metadata as it persists user/plan info
          metadata = { ...metadata, ...sub.metadata };

          // Ensure we have the correct price ID from the subscription items
          if ((sub as any).items?.data?.length > 0) {
            priceId = (sub as any).items.data[0].price.id;
          }

          // Ensure we have the correct period end
          if ((sub as any).current_period_end) {
            periodEnd = (sub as any).current_period_end;
          }
        }
      } catch (e) {
        console.error("⚠️ Could not fetch subscription for invoice:", e);
      }

      await updateUserSubscription(
        invoice.customer,
        priceId,
        'active',
        periodEnd,
        metadata
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
    console.log(`💳 [STRIPE-WEBHOOK] checkout.session.completed hit.`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Metadata:`, JSON.stringify(metadata, null, 2));

    console.log(`\n💳 checkout.session.completed: ${session.id}`);
    console.log(`   Type: ${metadata?.type}`);
    console.log(`   Subscription ID: ${session.subscription}`);

    if (metadata?.type === 'token_refill') {
      console.log(`[STRIPE-TOKEN] Processing token refill for session ${session.id}`);
      try {
        const projectId = metadata.projectId;
        const userId = metadata.userId; // User who initiated the checkout
        const newTokens = JSON.parse(metadata.purchased_tokens || '{}');
        const amountPaid = session.amount_total / 100;
        const currency = session.currency.toUpperCase() || 'EUR';

        console.log(`[STRIPE-TOKEN] Project: ${projectId}, User: ${userId}, Tokens:`, newTokens);

        // --- Log Transaction to token_transactions table ---
        const tokenEntries = Object.entries(newTokens).filter(([, tokens]) => Number(tokens) > 0);

        const totalTokensPurchased = tokenEntries.reduce((sum, [, tokens]) => sum + Number(tokens), 0);
        // Calculate price per token to split the total payment amount accurately across models
        const pricePerToken = totalTokensPurchased > 0 ? amountPaid / totalTokensPurchased : 0;

        for (const [modelKey, tokensAdded] of tokenEntries) {
          const tokenAmount = Number(tokensAdded);
          // Calculate the proportional cost for this specific model's tokens
          const transactionAmount = tokenAmount * pricePerToken;

          // Log the transaction
          const { error: transactionError } = await supabaseAdmin.from('token_transactions').insert({
            user_id: userId,
            project_id: projectId,
            model_key: modelKey,
            tokens_added: tokenAmount,
            amount_paid: parseFloat(transactionAmount.toFixed(2)), // Ensure DECIMAL precision for DB
            currency: currency,
            source: 'Stripe Token Pack Purchase',
            stripe_session_id: session.id,
            metadata: {
              checkout_session_id: session.id,
              token_pack_breakdown: newTokens // Log full breakdown for context
            }
          });

          if (transactionError) {
            console.error(`❌ [STRIPE-TOKEN] Error logging token transaction for model ${modelKey}:`, transactionError);
          } else {
            console.log(`✅ [STRIPE-TOKEN] Logged token transaction for Project ${projectId}, Model ${modelKey}.`);
          }
        }
        // --- End Transaction Logging ---


        // Fetch existing pack(s) - Use list to avoid .single() error if duplicates exist
        const { data: packs, error: fetchError } = await supabaseAdmin
          .from('token_packs')
          .select('*')
          .eq('project_id', projectId);

        if (fetchError) {
          console.error(`❌ [STRIPE-TOKEN] Error fetching token packs:`, fetchError);
        }

        const existingPack = packs && packs.length > 0 ? packs[0] : null;

        if (existingPack) {
          console.log(`[STRIPE-TOKEN] Updating existing token pack ${existingPack.id}`);
          const oldPurchased = existingPack.tokens_purchased || {};
          const oldRemaining = existingPack.remaining_tokens || {};

          // Hardened sum function to prevent NaN
          const sumTokens = (key: string, oldObj: any, newObj: any) => {
            const oldVal = Number(oldObj?.[key]) || 0;
            const newVal = Number(newObj?.[key]) || 0;
            return oldVal + newVal;
          };

          const { error: updateError } = await supabaseAdmin.from('token_packs').update({
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

          if (updateError) {
            console.error(`❌ [STRIPE-TOKEN] Error updating token pack:`, updateError);
          } else {
            console.log(`✅ [STRIPE-TOKEN] Successfully updated token pack ${existingPack.id}`);
          }

        } else {
          console.log(`[STRIPE-TOKEN] Creating new token pack for project ${projectId}`);
          const fullTokenSet = {
            "gemini-2.5-pro": newTokens["gemini-2.5-pro"] || 0,
            "gemini-2.5-flash": newTokens["gemini-2.5-flash"] || 0,
            "gemini-3-pro-preview": newTokens["gemini-3-pro-preview"] || 0
          };
          const { error: insertError } = await supabaseAdmin.from('token_packs').insert({
            user_id: metadata.userId,
            project_id: projectId,
            price_paid: amountPaid,
            purchased_at: new Date().toISOString(),
            expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            tokens_purchased: fullTokenSet,
            remaining_tokens: fullTokenSet,
            metadata: { stripe_session_id: session.id }
          });

          if (insertError) {
            console.error(`❌ [STRIPE-TOKEN] Error inserting token pack:`, insertError);
          } else {
            console.log(`✅ [STRIPE-TOKEN] Successfully created new token pack`);
          }
        }
        console.log("✅ [STRIPE-TOKEN] Token wallet process completed!");
      } catch (e) { console.error("[STRIPE-TOKEN] Token refill error", e); }
    }

    // B. Handle New Subscription (checkout.session.completed for subscriptions)
    if (metadata?.type === 'subscription_checkout' || metadata?.type === 'subscription_update' || metadata?.type === 'subscription') {
      const subscriptionId = session.subscription;

      console.log(`🔍 Fetching subscription details for: ${subscriptionId}`);

      let priceId: string | null = null;
      let currentPeriodEnd = Math.floor(Date.now() / 1000) + 2592000; // Default: 30 days

      try {
        // ✅ Fetch full subscription object to get price_id
        if (subscriptionId && typeof subscriptionId === 'string') {
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;

          if (sub.items?.data?.length > 0) {
            priceId = sub.items.data[0].price.id;
            console.log(`✅ Extracted price_id from subscription: ${priceId}`);
          }

          if (sub.current_period_end) {
            currentPeriodEnd = sub.current_period_end;
            console.log(`✅ Extracted period end: ${new Date(currentPeriodEnd * 1000).toISOString()}`);
          }
        }
      } catch (e) {
        console.error("❌ Subscription fetch failed:", e);
      }

      // Call update function with the extracted price_id
      await updateUserSubscription(
        session.customer,
        priceId, // Now we have the actual price_id
        'active',
        currentPeriodEnd,
        metadata
      );
    }
  }

  return new NextResponse(null, { status: 200 });
}