'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { STRIPE_PRODUCTS, getBaseUrl, SUBSCRIPTION_PLANS } from '@/utils/stripe/config';
import { stripe } from '@/utils/stripe/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

const PACK_AMOUNTS = [100000, 250000, 500000, 1000000, 2000000];

// --- Helper: Fetch and Map Prices (Token System) ---
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

// --- MAIN: Create Subscription Checkout (New / Upgrade / Downgrade) ---
export async function createSubscriptionCheckout(
  targetPlanId: string,
  interval: 'month' | 'year'
) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  console.log(`\n🎯 [STRIPE-ACTION] User ${user.id} initiating subscription for ${targetPlanId} (${interval})`);

  // 1. Get Plan Config & Price
  const targetPlanConfig = SUBSCRIPTION_PLANS[targetPlanId as keyof typeof SUBSCRIPTION_PLANS];
  if (!targetPlanConfig) throw new Error('Invalid Plan selected');

  const targetPriceId = targetPlanConfig.prices[interval];
  if (!targetPriceId) throw new Error('Price not found for this interval');

  console.log(`✅ [STRIPE-ACTION] Plan found: ${targetPlanConfig.name}, Price ID: ${targetPriceId}`);

  // 2. Get or Create Stripe Customer (ONLY store customer_id in DB)
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

    // Store ONLY the customer ID in DB (no subscription data)
    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
    console.log(`✅ [STRIPE-ACTION] Stored stripe_customer_id in DB`);
  } else {
    console.log(`✅ [STRIPE-ACTION] Using existing Stripe customer: ${customerId}`);
  }

  // 3. Check for existing active subscriptions in Stripe
  console.log(`\n🔍 [STRIPE-ACTION] Checking for existing active subscriptions...`);
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all', 
    limit: 10
  });

  // Filter for subscriptions that can be updated
  const activeSubs = subscriptions.data.filter(s => ['active', 'trialing', 'past_due'].includes(s.status));
  const existingSub = activeSubs.length > 0 ? activeSubs[0] : null;

  if (existingSub) {
    console.log(`🔄 [STRIPE-ACTION] User has active subscription: ${existingSub.id}. Creating upgrade/downgrade session...`);
    
    try {
        const subscriptionItem = existingSub.items.data[0];
        const currentPriceId = subscriptionItem?.price.id;

        if (currentPriceId === targetPriceId) {
            console.log(`⚠️ [STRIPE-ACTION] Same plan selected. Redirecting to dashboard.`);
            redirect(`${getBaseUrl()}/dashboard`);
        }

        // Create Checkout Session for Subscription Update
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [
                {
                    price: targetPriceId,
                    quantity: 1,
                },
            ],
            subscription: existingSub.id, 
            success_url: `${getBaseUrl()}/dashboard/checkout?subscription_success=true`,
            cancel_url: `${getBaseUrl()}/dashboard/checkout?subscription_success=false`,
            metadata: {
                userId: user.id,
                targetPlanId: targetPlanId,
                is_upgrade_flow: 'true',
            }
        } as any);

        console.log(`✅ [STRIPE-ACTION] Upgrade/Downgrade Checkout session created: ${session.id}`);

        if (session.url) redirect(session.url);
        
    } catch (err: any) {
        console.error(`❌ [STRIPE-ACTION] Failed to create update session:`, err.message);
        redirect(`${getBaseUrl()}/dashboard/checkout?subscription_success=false`);
    }
  }

  // 4. NEW SUBSCRIPTION: Create Checkout Session
  console.log(`\n💳 [STRIPE-ACTION] Creating new subscription checkout session...`);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: targetPriceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${getBaseUrl()}/dashboard/checkout?subscription_success=true`,
    cancel_url: `${getBaseUrl()}/dashboard/checkout?subscription_success=false`,
    metadata: {
      userId: user.id,
      targetPlanId: targetPlanId,
    }
  });

  console.log(`✅ [STRIPE-ACTION] New Checkout session created: ${session.id}`);

  if (session.url) redirect(session.url);
  
  throw new Error("Could not create Stripe checkout session.");
}

// --- New Action: Create Billing Portal Session ---
export async function createBillingPortalSession(): Promise<string> {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!userData?.stripe_customer_id) {
    throw new Error('No Stripe customer record found. Please purchase a plan first.');
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${getBaseUrl()}/dashboard`, 
    });
    return session.url;
  } catch (error) {
    console.error('Error creating Billing Portal session:', error);
    throw new Error('Failed to open billing portal.');
  }
}

// --- Action: Create Checkout for Tokens ---
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

// --- Verification Action (Fallback for Webhooks) ---
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

    // Note: We do NOT store token packs in the database anymore
    // All token tracking is done through token_transactions table only

    return { success: true, message: 'Token transaction recorded successfully' };

  } catch (error: any) {
    console.error("❌ [STRIPE-VERIFY] Error:", error);
    return { success: false, message: error.message };
  }
}

// --- Billing & Invoices (Fetch from Stripe only, no subscription data in DB) ---
export async function getUserBillingInfo() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Get customer_id from DB (the only thing we store)
  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!userData?.stripe_customer_id) {
    return { invoices: [], subscription: null };
  }

  const customerId = userData.stripe_customer_id;

  // Get invoices directly from Stripe
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 10,
    status: 'paid'
  });

  const formattedInvoices = invoices.data.map(inv => ({
    id: inv.id,
    date: new Date(inv.created * 1000).toLocaleDateString(),
    amount: (inv.amount_paid / 100).toFixed(2),
    currency: inv.currency.toUpperCase(),
    pdfUrl: inv.invoice_pdf,
    status: inv.status
  }));

  // Get subscription data directly from Stripe (not from DB)
  let subscriptionDetails = null;
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    const sub = subscriptions.data[0] as any;

    let productName = 'Unknown Plan';
    let amount = '0';
    let interval = 'month';

    if (sub.items && sub.items.data.length > 0) {
      const item = sub.items.data[0];
      if (item.price) {
        amount = ((item.price.unit_amount || 0) / 100).toFixed(2);
        interval = item.price.recurring?.interval || 'month';
        
        // Find the matching plan name using the price ID
        const priceId = item.price.id;
        for (const [planUuid, config] of Object.entries(SUBSCRIPTION_PLANS)) {
             if (config.prices.month === priceId || config.prices.year === priceId) {
                productName = config.name;
                break;
             }
        }
      }
    }

    const itemPeriodEnd = sub.items?.data?.[0]?.current_period_end;
    const subPeriodEnd = (sub as any).current_period_end;
    const finalPeriodEnd = itemPeriodEnd ?? subPeriodEnd;

    const periodEnd = finalPeriodEnd
      ? new Date(finalPeriodEnd * 1000) 
      : null;
    
    const periodEndIso = (periodEnd && !isNaN(periodEnd.getTime())) 
      ? periodEnd.toISOString() 
      : null;

    subscriptionDetails = {
      id: sub.id,
      planName: productName,
      amount: amount,
      interval: interval,
      currentPeriodEnd: periodEndIso,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      status: sub.status,
    };
  }

  return {
    invoices: formattedInvoices,
    subscription: subscriptionDetails,
  };
}

export async function cancelUserSubscription(subscriptionId: string) {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Get User Invoices (Simplified, uses getUserBillingInfo data) ---
export async function getUserInvoices() {
  const billingInfo = await getUserBillingInfo();
  return billingInfo.invoices || [];
}