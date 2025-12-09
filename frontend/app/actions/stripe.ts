'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { STRIPE_PRODUCTS, getBaseUrl, SUBSCRIPTION_PLANS } from '@/utils/stripe/config';
import { stripe } from '@/utils/stripe/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

const PACK_AMOUNTS = [100000, 250000, 500000, 1000000, 2000000];

// --- Helper: Fetch and Map Prices ---
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
    // Enterprise Calculation
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

    // Standard Mapping
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

export async function createSubscriptionCheckout(
  targetPlanId: string,
  interval: 'month' | 'year'
) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // 1. Get Plan Config
  const targetPlanConfig = SUBSCRIPTION_PLANS[targetPlanId];
  if (!targetPlanConfig) throw new Error('Invalid Plan selected');

  // 2. Get Price ID
  const priceId = targetPlanConfig.prices[interval];
  if (!priceId) throw new Error('Price not found for this interval');

  // 3. Get User & Customer ID
  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id, subscription_id')
    .eq('id', user.id)
    .single();

  let customerId = userData?.stripe_customer_id;
  console.log(`[STRIPE-ACTION] User ${user.id} initiating checkout for ${targetPlanId} (${interval})`);

  // Create Customer if missing
  if (!customerId) {
    console.log(`[STRIPE-ACTION] Creating new Stripe customer for ${user.email}`);
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id }
    });
    customerId = customer.id;
    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const activeSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1
  });

  if (activeSubs.data.length > 0) {
    // USER HAS A SUBSCRIPTION -> SWAP IT
    const currentSub = activeSubs.data[0];
    const currentItemId = currentSub.items.data[0].id;

    console.log(`[STRIPE-ACTION] Found active subscription ${currentSub.id}. Upgrading/Downgrading...`);
    console.log(`[STRIPE-ACTION] Swapping item ${currentItemId} to price ${priceId}`);

    const updatedSub = await stripe.subscriptions.update(currentSub.id, {
      items: [{
        id: currentItemId,
        price: priceId,
      }],
      metadata: {
        userId: user.id,
        targetPlanId: targetPlanId,
        type: 'subscription_update'
      },
      proration_behavior: 'always_invoice',
      billing_cycle_anchor: 'now',
    });

    const subData = updatedSub as any;

    let endIsoString = new Date().toISOString();
    if (subData?.current_period_end) {
      endIsoString = new Date(subData.current_period_end * 1000).toISOString();
    } else if ((currentSub as any).current_period_end) {
      endIsoString = new Date((currentSub as any).current_period_end * 1000).toISOString();
    } else {
      endIsoString = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    console.log(`[STRIPE-ACTION] Stripe update successful. New period end: ${subData?.current_period_end} -> ${endIsoString}`);

    // ✅ OPTIMISTIC UPDATE
    const supabaseAdmin = createAdminClient();
    const { error: updateError } = await supabaseAdmin.from('users').update({
      plan_id: targetPlanId,
      subscription_status: subData?.status || 'active',
      subscription_id: subData?.id || currentSub.id,
      current_period_end: endIsoString,
      stripe_customer_id: customerId as string
    }).eq('id', user.id);

    if (updateError) {
      console.error(`[STRIPE-ACTION] Optimistic update failed:`, updateError);
    } else {
      console.log(`✅ [STRIPE-ACTION] Optimistically updated User ${user.id} to plan ${targetPlanId}`);
    }

    redirect(`${getBaseUrl()}/dashboard?updated=true`);
    return;
  }

  // --- 5. NO EXISTING SUBSCRIPTION -> CREATE CHECKOUT ---
  console.log(`[STRIPE-ACTION] No existing subscription. Creating new checkout session...`);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${getBaseUrl()}/dashboard?subscription_success=true`,
    cancel_url: `${getBaseUrl()}/dashboard/components/subscriptionFolder?canceled=true`,
    metadata: {
      userId: user.id,
      targetPlanId: targetPlanId,
      type: 'subscription_update',
      priceId: priceId
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        targetPlanId: targetPlanId,
        priceId: priceId
      }
    }
  });

  // ✅ CRITICAL FIX: Optimistic DB Update BEFORE redirecting to Stripe
  // This ensures the DB is updated even if webhook fails
  console.log(`[STRIPE-ACTION] Performing optimistic DB update for new subscription...`);

  const supabaseAdmin = createAdminClient();
  const futureEndDate = new Date();
  futureEndDate.setMonth(futureEndDate.getMonth() + (interval === 'year' ? 12 : 1));
  const endIsoString = futureEndDate.toISOString();

  const { error: optimisticError } = await supabaseAdmin.from('users').update({
    plan_id: targetPlanId,
    subscription_status: 'active',
    subscription_id: session.subscription as string || 'pending',
    current_period_end: endIsoString,
    stripe_customer_id: customerId as string
  }).eq('id', user.id);

  if (optimisticError) {
    console.error(`[STRIPE-ACTION] Optimistic update for new subscription failed:`, optimisticError);
    // Don't throw - still redirect to Stripe so webhook can fix it
  } else {
    console.log(`✅ [STRIPE-ACTION] Optimistically updated User ${user.id} for new subscription (Plan: ${targetPlanId})`);
  }

  if (session.url) redirect(session.url);
}

// --- Action: Create Checkout ---
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
    console.error("Invalid Project ID received:", projectId);
    throw new Error("Invalid Project ID");
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (error || !project) {
    console.error("Project fetch error:", error, "Project ID:", projectId);
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

  console.log(`[STRIPE-TOKEN] Creating token pack checkout for Project ${projectId}, User ${user.id}`);
  console.log(`[STRIPE-TOKEN] Pack details:`, JSON.stringify(pack, null, 2));

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

  console.log(`[STRIPE-TOKEN] Checkout session created: ${session.id}`);

  if (session.url) redirect(session.url);
}

// --- Verification Action (Fallback for Webhooks) ---
export async function verifyTokenPurchase(sessionId: string) {
  const supabaseAdmin = createAdminClient();

  console.log(`🔍 [STRIPE-VERIFY] Verifying session: ${sessionId}`);

  try {
    // 1. Retrieve Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      console.log(`⚠️ [STRIPE-VERIFY] Session not paid yet.`);
      return { success: false, message: 'Payment not confirmed' };
    }

    const metadata = session.metadata;
    if (metadata?.type !== 'token_refill') {
      return { success: false, message: 'Invalid session type' };
    }

    // 2. Check if already processed (Idempotency)
    const { data: existingTx } = await supabaseAdmin
      .from('token_transactions')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existingTx) {
      console.log(`✅ [STRIPE-VERIFY] Transaction already processed.`);
      return { success: true, message: 'Already processed' };
    }

    // 3. Process Update (Same logic as webhook)
    console.log(`🔄 [STRIPE-VERIFY] Processing manual update...`);

    const projectId = metadata.projectId;
    const userId = metadata.userId;
    const newTokens = JSON.parse(metadata.purchased_tokens || '{}');
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
    const currency = session.currency ? session.currency.toUpperCase() : 'EUR';

    // A. Log Transaction
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

    // B. Update Wallet
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

// --- Subscription ---
export async function createSubscriptionSession(priceId: string, projectId?: string) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${getBaseUrl()}/dashboard?subscription_success=true`,
    cancel_url: `${getBaseUrl()}/dashboard/components/subscriptionFolder?canceled=true`,
    metadata: { userId: user.id, projectId: projectId || '', type: 'subscription' },
  });

  if (session.url) redirect(session.url);
}

// --- NEW: Billing & Invoices ---

export async function getUserBillingInfo() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    // ADDED current_period_end and subscription_status to the fetch from DB
    .select('stripe_customer_id, subscription_id, plan_id, current_period_end, subscription_status')
    .eq('id', user.id)
    .single();

  if (!userData?.stripe_customer_id) {
    return { invoices: [], subscription: null, planDetails: null };
  }

  // Fetch plan details from database if plan_id exists (for monthly/yearly price comparison)
  let dbPlanDetails = null;
  if (userData?.plan_id) {
    const { data: planData } = await supabase
      .from('plans')
      .select('id, name, monthly_price, yearly_price, features')
      .eq('id', userData.plan_id)
      .single();

    if (planData) {
      dbPlanDetails = planData;
    }
  }

  // 1. Fetch Invoices
  const invoices = await stripe.invoices.list({
    customer: userData.stripe_customer_id,
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

  // 2. Fetch Active Subscription from Stripe
  let subscriptionDetails = null;
  // Fetch status 'all' to include canceled subscriptions that are still active for the period
  const subscriptions = await stripe.subscriptions.list({
    customer: userData.stripe_customer_id,
    status: 'all',
    limit: 1,
    expand: ['data.plan.product']
  });

  if (subscriptions.data.length > 0) {
    const sub = subscriptions.data[0] as any;

    let productName = 'Unknown Plan';
    let amount = '0';
    let interval = 'month';

    if (sub.plan && sub.plan.product) {
      const product = sub.plan.product as Stripe.Product;
      productName = product.name;
      amount = (sub.plan.amount / 100).toFixed(2);
      interval = sub.plan.interval;
    } else if (sub.items && sub.items.data.length > 0) {
      const item = sub.items.data[0];
      if (item.price) {
        amount = ((item.price.unit_amount || 0) / 100).toFixed(2);
        interval = item.price.recurring?.interval || 'month';
      }
    }

    // Use the reliable current_period_end from the Supabase profile
    const renewalDate = userData.current_period_end;

    subscriptionDetails = {
      id: sub.id,
      planName: productName,
      amount: amount,
      interval: interval,
      currentPeriodEnd: renewalDate, // <-- FIXED: Directly use DB-synced date (ISO string)
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      status: sub.status,
    };
  }

  // Fallback if Stripe has no record but DB does (unlikely, but safe)
  else if (userData.subscription_id && userData.subscription_status && userData.current_period_end) {
    subscriptionDetails = {
      id: userData.subscription_id,
      planName: dbPlanDetails?.name || 'Unknown',
      amount: 'N/A',
      interval: 'N/A',
      currentPeriodEnd: userData.current_period_end,
      cancelAtPeriodEnd: userData.subscription_status === 'canceled',
      status: userData.subscription_status,
      currentPeriodStart: null // Default fallback value
    };
  }

  return {
    invoices: formattedInvoices,
    subscription: subscriptionDetails,
    planDetails: dbPlanDetails // Contains monthly_price and yearly_price from the 'plans' table
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

// Fetch user invoices from Stripe
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

  // Fetch Invoices from Stripe
  const invoices = await stripe.invoices.list({
    customer: userData.stripe_customer_id,
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

  return formattedInvoices;
}

// --- FIXED FUNCTION ---
export async function getUpcomingInvoice(targetPlanId: string, targetInterval: 'month' | 'year') {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // 1. Get User Data
  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id, subscription_id')
    .eq('id', user.id)
    .single();

  if (!userData?.stripe_customer_id) return null;

  // 2. Get Target Price ID
  const targetPlanConfig = SUBSCRIPTION_PLANS[targetPlanId];
  if (!targetPlanConfig) throw new Error('Invalid Plan');
  const targetPriceId = targetPlanConfig.prices[targetInterval];

  try {
    // ALWAYS PREVIEW AS NEW SUBSCRIPTION
    // We are using the "Cancel Old + Create New" strategy, so the user will see the full price of the new plan.
    // Proration credits will be applied to their customer balance by Stripe when we cancel the old sub.
    const upcoming = await stripe.invoices.createPreview({
      customer: userData.stripe_customer_id,
      subscription_details: {
        items: [{
          price: targetPriceId,
          quantity: 1,
        }],
      }
    });

    return {
      amountDue: upcoming.amount_due,
      subtotal: upcoming.subtotal,
      total: upcoming.total,
      currency: upcoming.currency,
      lines: upcoming.lines.data.map((l: any) => ({
        description: l.description,
        amount: l.amount,
        period: {
          start: new Date(l.period.start * 1000).toLocaleDateString(),
          end: new Date(l.period.end * 1000).toLocaleDateString()
        }
      }))
    };

  } catch (error) {
    console.error("Error fetching upcoming invoice:", error);
    return null;
  }
}


export interface TokenTransaction {
  id: number;
  transaction_date: string;
  model_key: string;
  tokens_added: number;
  source: string;
}

// --- NEW: Token Top-up History ---
export async function getProjectTokenTopUpHistory(projectId: string): Promise<TokenTransaction[]> {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Authorization check (optional, RLS should handle this, but good practice)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    console.error('Project authorization failed or project not found:', projectError);
    return [];
  }

  // Assuming a table named 'token_transactions' logs the top-up events
  const { data: transactions, error: transactionsError } = await supabase
    .from('token_transactions')
    .select('id, created_at, model_key, tokens_added, source') // assuming created_at is the timestamp
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (transactionsError) {
    console.error('Error fetching token transactions:', transactionsError);
    return [];
  }

  // Map the fetched data to the client-side interface
  return transactions.map(t => ({
    id: t.id,
    transaction_date: new Date(t.created_at).toISOString(),
    model_key: t.model_key || 'Unknown Model',
    tokens_added: t.tokens_added || 0,
    source: t.source || 'Stripe Payment',
  })) as TokenTransaction[];
}

// --- NEW: Verify Subscription (Fallback for Webhooks) ---
export async function verifyUserSubscription() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Get Customer ID
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_customer_id) {
      return { success: false, error: 'No Stripe customer found' };
    }

    // 2. Fetch Active Subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripe_customer_id,
      status: 'active',
      limit: 1,
      expand: ['data.plan.product']
    });

    if (subscriptions.data.length === 0) {
      return { success: false, error: 'No active subscription found in Stripe' };
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0].price.id;

    // 3. Find Plan ID
    let planId: string | null = null;

    // Helper to match Stripe Price ID to Plan IDs (duplicated from webhook for safety)
    const findPlanByPriceId = (pId: string) => {
      for (const [pIdKey, config] of Object.entries(SUBSCRIPTION_PLANS)) {
        if (config.prices.month === pId || config.prices.year === pId) {
          return pIdKey;
        }
      }
      return null;
    };

    planId = findPlanByPriceId(priceId);

    // Fallback: Check metadata if price lookup fails
    if (!planId && sub.metadata?.targetPlanId) {
      planId = sub.metadata.targetPlanId;
    }

    // Fallback: Check subscription items metadata
    if (!planId && sub.items.data[0]?.price?.id) {
      planId = findPlanByPriceId(sub.items.data[0].price.id);
    }

    if (!planId) {
      console.warn(`Could not identify plan for price ${priceId}`);
    }

    // 4. Update DB
    const endIso = (sub as any).current_period_end
      ? new Date((sub as any).current_period_end * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const updateData: any = {
      subscription_status: sub.status,
      current_period_end: endIso,
      subscription_id: sub.id,
      stripe_customer_id: userData.stripe_customer_id
    };

    // CRITICAL: Only update plan_id if we found it. 
    if (planId) {
      updateData.plan_id = planId;
      console.log(`📌 [STRIPE-VERIFY] Setting plan_id to: ${planId}`);
    } else {
      console.warn(`⚠️ [STRIPE-VERIFY] plan_id is NULL. DB might not update plan.`);
    }

    console.log(`🔄 [STRIPE-VERIFY] Updating User ${user.id} with data:`, JSON.stringify(updateData, null, 2));

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error(`❌ [STRIPE-VERIFY] DB Update Error:`, error);
      return { success: false, error: error.message };
    }

    // VERIFICATION
    const { data: verifyUser } = await supabaseAdmin.from('users').select('plan_id').eq('id', user.id).single();
    console.log(`✅ [STRIPE-VERIFY] User ${user.id} updated! Current DB plan_id: ${verifyUser?.plan_id}`);

    return { success: true, planId };

  } catch (error: any) {
    console.error('Error verifying subscription:', error);
    return { success: false, error: error.message };
  }
}