// frontend/app/actions/stripe.ts

'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { STRIPE_PRODUCTS, getBaseUrl, SUBSCRIPTION_PLANS } from '@/utils/stripe/config';
import { stripe } from '@/utils/stripe/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

const PACK_AMOUNTS = [100000, 250000, 500000, 1000000, 2000000];

// --- Helper: Find Plan ID from Price ID ---
const getPlanIdFromPrice = (priceId: string): string | null => {
  for (const [planId, config] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (config.prices.month === priceId || config.prices.year === priceId) {
      return planId;
    }
  }
  return null;
};

// --- Helper: Fetch and Map Prices (KEEP: Token system is untouched) ---
export async function getTokenPacks(modelKey: string, isEnterprise: boolean) {
  const products = STRIPE_PRODUCTS.TOKENS[modelKey as keyof typeof STRIPE_PRODUCTS.TOKENS];
  if (!products) return [];

  const productId = isEnterprise ? products.enterprise : products.standard;

  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 20,
    currency: 'eur',
  });

  const sortedPrices = prices.data.sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0));

  const packs = PACK_AMOUNTS.map((amount, index) => {
    if (isEnterprise && sortedPrices.length < 3 && sortedPrices.length > 0) {
      const refPrice = sortedPrices[0];
      const refAmount = refPrice.unit_amount || 0;
      const ratio = amount / 1000000;
      const calculatedCost = Math.round(refAmount * ratio);

      return {
        amount,
        priceId: null,
        unitAmount: calculatedCost,
        currency: refPrice.currency,
        displayPrice: (calculatedCost / 100).toFixed(2),
        isAdHoc: true,
        baseProductId: productId
      };
    }

    const priceObj = sortedPrices[index];
    if (priceObj) {
      return {
        amount,
        priceId: priceObj.id,
        unitAmount: priceObj.unit_amount || 0,
        currency: priceObj.currency,
        displayPrice: ((priceObj.unit_amount || 0) / 100).toFixed(2),
        isAdHoc: false,
        baseProductId: productId
      };
    }
    return null;
  }).filter(Boolean);

  return packs;
}

// --- MAIN: Create Subscription Checkout (Updated for autoRenew & redirects) ---
export async function createSubscriptionCheckout(
  targetPlanId: string,
  interval: 'month' | 'year',
  autoRenew: boolean = true // New parameter: true to auto-renew (cancel_at_period_end=false)
) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  console.log(`\n🎯 [STRIPE-ACTION] User ${user.id} initiating subscription for ${targetPlanId} (${interval}) with autoRenew: ${autoRenew}`);

  // 1. Get Plan Config & Price
  const targetPlanConfig = SUBSCRIPTION_PLANS[targetPlanId];
  if (!targetPlanConfig) throw new Error('Invalid Plan selected');

  const targetPriceId = targetPlanConfig.prices[interval];
  if (!targetPriceId) throw new Error('Price not found for this interval');

  console.log(`✅ [STRIPE-ACTION] Plan found: ${targetPlanConfig.name}, Price ID: ${targetPriceId}`);

  // 2. Get or Create Stripe Customer (KEEPING: Only customer_id stored)
  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  let customerId = userData?.stripe_customer_id;

  if (!customerId) {
    console.log(`📝 [STRIPE-ACTION] No Stripe customer found. Creating new one...`);
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id }
    });
    customerId = customer.id;
    console.log(`✅ [STRIPE-ACTION] Created Stripe customer: ${customerId}`);

    // Store the customer ID (This is the only subscription-related thing stored in the DB)
    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
    console.log(`✅ [STRIPE-ACTION] Stored stripe_customer_id in DB`);
  } else {
    console.log(`✅ [STRIPE-ACTION] Using existing Stripe customer: ${customerId}`);
  }

  // 3. Check for existing subscriptions in Stripe (Handling Upgrade/Downgrade/Renewal Toggle)
  console.log(`\n🔍 [STRIPE-ACTION] Checking for existing subscriptions...`);
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all', 
    limit: 10
  });

  console.log(`📊 [STRIPE-ACTION] Found ${subscriptions.data.length} subscription(s)`);

  const relevantSubs = subscriptions.data.filter(s => ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status));
  
  if (relevantSubs.length > 0) {
    console.log(`🔄 [STRIPE-ACTION] User has ${relevantSubs.length} relevant subscription(s). Attempting upgrade/downgrade/config update...`);
    
    try {
      // Prioritize the subscription that is not canceled for immediate updates
      const existingSub = relevantSubs.sort((a, b) => (b.cancel_at_period_end ? 0 : 1) - (a.cancel_at_period_end ? 0 : 1))[0]; 

      if (!existingSub || !existingSub.items.data.length) {
         throw new Error("No valid subscription item found for update.");
      }

      const currentPriceId = existingSub.items.data[0]?.price.id;
      
      console.log(`📌 [STRIPE-ACTION] Current price: ${currentPriceId}, Target price: ${targetPriceId}`);

      // Set the desired renewal state
      const targetCancelAtPeriodEnd = !autoRenew;

      if (currentPriceId === targetPriceId && existingSub.cancel_at_period_end === targetCancelAtPeriodEnd) {
        console.log(`⚠️ [STRIPE-ACTION] Same plan and renewal setting selected. Redirecting to dashboard.`);
        redirect(`${getBaseUrl()}/dashboard/settings?tab=billing`); // Redirect to billing if no effective change
      }

      // --- Update subscription (Stripe handles prorations) ---
      const updateParams: Stripe.SubscriptionUpdateParams = {
          cancel_at_period_end: targetCancelAtPeriodEnd, // Set renewal preference
      };
      
      if (currentPriceId !== targetPriceId) {
          updateParams.items = [
              {
                  id: existingSub.items.data[0].id,
                  price: targetPriceId,
              }
          ];
          // Prorate immediately for price changes
          updateParams.proration_behavior = 'always_invoice'; 
          console.log(`📝 [STRIPE-ACTION] Plan change detected. Setting proration behavior.`);
      } else {
           console.log(`📝 [STRIPE-ACTION] Only renewal preference or status update.`);
      }

      const updatedSub = await stripe.subscriptions.update(existingSub.id, updateParams);

      console.log(`✅ [STRIPE-ACTION] Subscription updated: ${updatedSub.id}`);
      // Redirect to a specific confirmation page for updates
      redirect(`${getBaseUrl()}/dashboard/checkout?subscription_update_success=true&planId=${targetPlanId}&interval=${interval}`);

    } catch (err: any) {
      console.error(`❌ [STRIPE-ACTION] Failed to update subscription:`, err.message);
      // Redirect to a rejection page for updates
      redirect(`${getBaseUrl()}/dashboard/checkout?subscription_update_success=false&error=true`);
    }
  }

  // 4. NEW SUBSCRIPTION: Create Checkout Session
  console.log(`\n💳 [STRIPE-ACTION] Creating new subscription checkout session...`);
  
  // Use clear success/cancel URLs to mirror token purchase flow
  const successUrl = `${getBaseUrl()}/dashboard/checkout?subscription_success=true&session_id={CHECKOUT_SESSION_ID}&planId=${targetPlanId}&interval=${interval}`;
  const cancelUrl = `${getBaseUrl()}/dashboard/checkout?subscription_success=false&canceled=true`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: targetPriceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Subscription will default to auto-renew (cancel_at_period_end: false).
    metadata: {
      userId: user.id,
      targetPlanId: targetPlanId,
      interval: interval, 
      autoRenew: String(autoRenew),
    }
  });

  console.log(`✅ [STRIPE-ACTION] Checkout session created: ${session.id}`);

  if (session.url) redirect(session.url);
}

// --- Action: Create Checkout for Tokens (KEEP: Token system is untouched) ---
export async function createTokenPackCheckout(
  projectId: string,
  pack: {
    modelKey: string;
    amount: number;
    priceId?: string;
    unitAmount?: number;
    baseProductId?: string;
    isAdHoc?: boolean;
  }
) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  if (!projectId || typeof projectId !== 'string') {
    throw new Error("Invalid Project ID");
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (error || !project) {
    throw new Error(`Project not found or access denied.`);
  }

  let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;

  if (pack.isAdHoc && pack.unitAmount && pack.baseProductId) {
    lineItem = {
      price_data: {
        currency: 'eur',
        product: pack.baseProductId,
        unit_amount: pack.unitAmount,
        tax_behavior: 'exclusive' as const,
      },
      quantity: 1,
    };
  } else if (pack.priceId) {
    lineItem = {
      price: pack.priceId,
      quantity: 1,
    };
  } else {
    throw new Error('Invalid pack configuration');
  }

  console.log(`[STRIPE-TOKEN] Creating token pack checkout for Project ${projectId}`);

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [lineItem],
    mode: 'payment',
    success_url: `${getBaseUrl()}/dashboard/projects/${projectId}/payments/completed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getBaseUrl()}/dashboard/projects/${projectId}/payments/failed`,
    metadata: {
      projectId,
      userId: user.id,
      type: 'token_refill',
      purchased_tokens: JSON.stringify({
        [pack.modelKey]: pack.amount
      })
    },
  });

  if (session.url) redirect(session.url);
}

// --- Verification Action (Fallback for Webhooks) (KEEP: Token system is untouched) ---
export async function verifyTokenPurchase(sessionId: string) {
  const supabaseAdmin = createAdminClient();

  console.log(`🔍 [STRIPE-VERIFY] Verifying session: ${sessionId}`);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      console.log(`⚠️ [STRIPE-VERIFY] Session not paid yet.`);
      return { success: false, message: 'Payment not confirmed' };
    }

    const metadata = session.metadata;
    if (metadata?.type !== 'token_refill') {
      return { success: false, message: 'Invalid session type' };
    }

    const { data: existingTx } = await supabaseAdmin
      .from('token_transactions')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existingTx) {
      return { success: true, message: 'Already processed' };
    }

    const projectId = metadata.projectId;
    const userId = metadata.userId;
    const newTokens = JSON.parse(metadata.purchased_tokens || '{}');
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
    const currency = session.currency ? session.currency.toUpperCase() : 'EUR';

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
        source: 'Stripe Token Pack Purchase (Verified)',
        stripe_session_id: session.id,
        metadata: {
          checkout_session_id: session.id,
          token_pack_breakdown: newTokens
        }
      });
    }

    const { data: packs } = await supabaseAdmin
      .from('token_packs')
      .select('*')
      .eq('project_id', projectId);

    const existingPack = packs && packs.length > 0 ? packs[0] : null;

    if (existingPack) {
      const oldPurchased = existingPack.tokens_purchased || {};
      const oldRemaining = existingPack.remaining_tokens || {};
      const sumTokens = (key: string, oldObj: any, newObj: any) => {
        const oldVal = Number(oldObj?.[key]) || 0;
        const newVal = Number(newObj?.[key]) || 0;
        return oldVal + newVal;
      };

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
        user_id: userId,
        project_id: projectId,
        price_paid: amountPaid,
        purchased_at: new Date().toISOString(),
        expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        tokens_purchased: fullTokenSet,
        remaining_tokens: fullTokenSet,
        metadata: { stripe_session_id: session.id }
      });
    }

    return { success: true, message: 'Wallet updated successfully' };

  } catch (error: any) {
    console.error("❌ [STRIPE-VERIFY] Error:", error);
    return { success: false, message: error.message };
  }
}

// --- Billing & Invoices (Updated to use Invoice date as fallback and log interval) ---
export async function getUserBillingInfo() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!userData?.stripe_customer_id) {
    return { invoices: [], subscription: null, planDetails: null };
  }

  console.log(`\n🐛 [DEBUG-START] Fetching billing info for customer: ${userData.stripe_customer_id}`);

  // --- 1. Fetch Invoices and Find Latest Period End (For Fallback) ---
  const invoices = await stripe.invoices.list({
    customer: userData.stripe_customer_id,
    limit: 10,
    status: 'paid'
  });

  const latestInvoice = invoices.data[0];
  const invoicePeriodEndFallback = 
    latestInvoice?.lines?.data?.[0]?.period?.end || null; 
    
  console.log(`🐛 [DEBUG] Latest Invoice Period End Fallback Timestamp: ${invoicePeriodEndFallback}`);

  const formattedInvoices = invoices.data.map(inv => {
    // FIX INTEGRATED: Read period end from the line item for the table display
    const periodEnd = inv.lines?.data?.[0]?.period?.end || null; 

    return {
      id: inv.id,
      date: periodEnd
        ? new Date(periodEnd * 1000).toLocaleDateString() 
        : null,
      amount: (inv.amount_paid / 100).toFixed(2),
      currency: inv.currency.toUpperCase(),
      pdfUrl: inv.invoice_pdf || null,
      status: inv.status
    };
  });

  // --- 2. Fetch Subscription Details ---
  let subscriptionDetails = null;
  let planDetails = null;
  const subscriptions = await stripe.subscriptions.list({
    customer: userData.stripe_customer_id,
    status: 'all', 
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    const sub = subscriptions.data[0] as any;
    const item = sub.items?.data?.[0]; // This is the Subscription Item object
    const price = item?.price;

    let priceId = price?.id || null;
    let planId: string | null = null;
    let productName = 'Unknown Plan';
    let amount = '0';
    let interval: 'month' | 'year' = 'month';
    
    if (priceId) {
        planId = getPlanIdFromPrice(priceId);
    }

    if (item && price) {
      amount = ((price.unit_amount || 0) / 100).toFixed(2);
      interval = price.recurring?.interval === 'year' ? 'year' : 'month';
      console.log(`🐛 [DEBUG] Extracted Price Interval: ${interval}`);
    }
    
    if (planId) {
        planDetails = SUBSCRIPTION_PLANS[planId];
        productName = planDetails.name;
    }

    // SAFE DATE PARSING (Subscription Renewal Date)
    // Primary Source: Subscription Item
    const rawItemPeriodEndTimestamp = item?.current_period_end; 
    // Secondary Sources: Main Subscription
    const rawSubPeriodEndTimestamp = sub.current_period_end;
    const rawTrialEndTimestamp = sub.trial_end; 

    let periodEndIso: string | null = null;
    
    // Determine the primary timestamp source
    let relevantTimestamp: number | null = null;

    if (rawItemPeriodEndTimestamp) {
        // *** PRIMARY FIX: Use the Item's period end, which is present ***
        relevantTimestamp = rawItemPeriodEndTimestamp;
        console.log(`🐛 [DEBUG-DATE] Primary source (Item) used: ${relevantTimestamp}`);

    } else if (sub.status === 'trialing' && rawTrialEndTimestamp) {
        relevantTimestamp = rawTrialEndTimestamp;
        console.log(`🐛 [DEBUG-DATE] Secondary source (Trial End) used: ${relevantTimestamp}`);

    } else if (rawSubPeriodEndTimestamp) {
        relevantTimestamp = rawSubPeriodEndTimestamp;
        console.log(`🐛 [DEBUG-DATE] Secondary source (Sub Period End) used: ${relevantTimestamp}`);

    } else if (sub.status === 'active' && invoicePeriodEndFallback) {
        // Fallback for active subs missing all fields
        relevantTimestamp = invoicePeriodEndFallback;
        console.log(`🐛 [DEBUG-DATE] Fallback source (Invoice Period End) used: ${relevantTimestamp}`);
    }


    // Check if the relevant timestamp is a number and greater than 0 before conversion
    if (typeof relevantTimestamp === 'number' && relevantTimestamp > 0) {
        const periodEnd = new Date(relevantTimestamp * 1000); 
        
        if (!isNaN(periodEnd.getTime())) {
             periodEndIso = periodEnd.toISOString();
             console.log(`🐛 [DEBUG-DATE] Final ISO Date: ${periodEndIso}`);
        } else {
             console.error(`❌ [STRIPE-DATE-ERR] Invalid date created from timestamp: ${relevantTimestamp}`);
        }
    } else {
        console.log(`🐛 [DEBUG-DATE] No valid date timestamp found. Sending null.`);
    }
    
    subscriptionDetails = {
      id: sub.id,
      planId: planId, 
      priceId: priceId, 
      planName: productName,
      amount: amount,
      interval: interval, 
      currentPeriodEnd: periodEndIso, // ISO string or null
      cancelAtPeriodEnd: sub.cancel_at_period_end, 
      status: sub.status,
    };
  }

  console.log(`🐛 [DEBUG-END] Billing Info ready. Subscription date sent to frontend: ${subscriptionDetails?.currentPeriodEnd}`);

  return {
    invoices: formattedInvoices,
    subscription: subscriptionDetails,
    planDetails: planDetails 
  };
}

// frontend/app/actions/stripe.ts
export async function getCheckoutPreview(planId: string, interval: 'month' | 'year') {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // 1. Resolve Price ID
  const config = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
  if (!config || !config.prices[interval]) {
    throw new Error('Invalid plan configuration');
  }
  const targetPriceId = config.prices[interval];

  // 2. Get Customer
  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  const customerId = userData?.stripe_customer_id;

  // 3. Check for Existing Subscription
  let activeSub: Stripe.Subscription | null = null;
  if (customerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });
      activeSub = subscriptions.data[0] || null;
    } catch (e) {
      console.warn("Failed to list subscriptions via SDK:", e);
    }
  }

  // SCENARIO A: Upgrade/Downgrade (Proration Calculation)
  if (activeSub && customerId) {
    const currentItem = activeSub.items.data[0];
    
    // If they are already on this price
    if (currentItem?.price.id === targetPriceId) {
        return {
            amount: 0,
            currency: currentItem.price.currency,
            mode: 'no_change',
            message: 'You are already subscribed to this plan.'
        };
    }

    if (!currentItem) {
        // Edge case: Sub exists but has no items. Fallback to new sub logic (Scenario B).
    } else {
        try {
          // UPDATE: Using the new 'create_preview' endpoint via POST
          const params = new URLSearchParams();
          params.append('customer', customerId);
          params.append('subscription', activeSub.id);
          
          // New API structure: Nested under 'subscription_details'
          params.append('subscription_details[items][0][id]', currentItem.id);
          params.append('subscription_details[items][0][price]', targetPriceId);
          params.append('subscription_details[proration_behavior]', 'always_invoice');

          const response = await fetch(`https://api.stripe.com/v1/invoices/create_preview`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(), // Parameters must be in the body for POST
            cache: 'no-store'
          });

          if (!response.ok) {
             const errorBody = await response.text();
             console.error(`Stripe Preview Error (${response.status}):`, errorBody);
             throw new Error(`Stripe API error: ${response.status}`);
          }

          const preview = await response.json();

          return {
            amount: preview.amount_due / 100, // Stripe returns cents
            currency: preview.currency,
            mode: 'update',
            details: 'Prorated amount due today (New Plan Cost - Unused Current Plan)'
          };
        } catch (err: any) {
          console.error("Proration preview failed:", err);
          return {
            amount: 0,
            currency: 'eur',
            mode: 'error',
            message: 'Unable to calculate upgrade cost. Please try again.'
          };
        }
    }
  }

  // SCENARIO B: New Subscription OR Fallback
  try {
    const res = await fetch(`https://api.stripe.com/v1/prices/${targetPriceId}`, {
        headers: { 
            'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` 
        },
        cache: 'no-store' 
    });
    
    if (res.ok) {
        const price = await res.json();
        return {
            amount: (price.unit_amount || 0) / 100,
            currency: price.currency,
            mode: 'new',
            details: 'Standard subscription rate'
        };
    }
  } catch (e) {
      console.error("Price fetch failed:", e);
  }

  return {
    amount: 0,
    currency: 'eur',
    mode: 'error',
    message: 'Could not load pricing.'
  };
}

// --- Update cancelUserSubscription to include re-enabling auto-renew ---
export async function cancelUserSubscription(subscriptionId: string, cancel: boolean) {
  try {
    // cancel: true sets cancel_at_period_end: true (Disables auto-renew)
    // cancel: false sets cancel_at_period_end: false (Enables auto-renew)
    const updatedSub = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancel
    });
    return { success: true, cancelAtPeriodEnd: updatedSub.cancel_at_period_end };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
// --- getUserInvoices (Updated with FIX) ---
export async function getUserInvoices() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!userData?.stripe_customer_id) {
    return [];
  }

  const invoices = await stripe.invoices.list({
    customer: userData.stripe_customer_id,
    limit: 10,
    status: 'paid'
  });

  return invoices.data.map(inv => {
    // FIX APPLIED HERE: Read period end from the line item
    const periodEnd = inv.lines?.data?.[0]?.period?.end || null;

    return {
      id: inv.id,
      // Use the correctly sourced period end.
      date: periodEnd
        ? new Date(periodEnd * 1000).toLocaleDateString()
        : null, // Return null if date is not available
      amount: (inv.amount_paid / 100).toFixed(2),
      currency: inv.currency.toUpperCase(),
      pdfUrl: inv.invoice_pdf,
      status: inv.status
    };
  });
}

