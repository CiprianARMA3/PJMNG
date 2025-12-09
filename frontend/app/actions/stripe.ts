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

  // Check for existing subscription
  const activeSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1
  });

  let previousSubscriptionId = null;
  if (activeSubs.data.length > 0) {
    previousSubscriptionId = activeSubs.data[0].id;
    console.log(`[STRIPE-ACTION] Found existing subscription ${previousSubscriptionId}. Will replace via Checkout.`);
  }

  // --- ALWAYS CREATE CHECKOUT SESSION (Redirects User) ---
  console.log(`[STRIPE-ACTION] Creating checkout session for ${targetPlanId}...`);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${getBaseUrl()}/dashboard?subscription_success=true`,
    cancel_url: `${getBaseUrl()}/dashboard/checkout?planId=${targetPlanId}&interval=${interval}&canceled=true`,
    metadata: {
      userId: user.id,
      targetPlanId: targetPlanId,
      type: 'subscription_update',
      priceId: priceId,
      // IMPORTANT: Pass the old subscription ID so the webhook can cancel it
      previous_subscription_id: previousSubscriptionId || ''
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        targetPlanId: targetPlanId,
        priceId: priceId
      }
    }
  });

  // ✅ OPTIMISTIC DB UPDATE
  // We explicitly calculate the date based on the interval to fix the "Annual counts as Monthly" bug.
  console.log(`[STRIPE-ACTION] Performing optimistic DB update...`);

  const supabaseAdmin = createAdminClient();
  const futureEndDate = new Date();
  
  if (interval === 'year') {
    futureEndDate.setFullYear(futureEndDate.getFullYear() + 1);
  } else {
    futureEndDate.setMonth(futureEndDate.getMonth() + 1);
  }
  
  const endIsoString = futureEndDate.toISOString();

  const { error: optimisticError } = await supabaseAdmin.from('users').update({
    plan_id: targetPlanId,
    // We set status to 'active' optimistically, but the real status comes from webhook
    subscription_status: 'active', 
    subscription_id: session.subscription as string || 'pending',
    current_period_end: endIsoString,
    stripe_customer_id: customerId as string
  }).eq('id', user.id);

  if (optimisticError) {
    console.error(`[STRIPE-ACTION] Optimistic update failed:`, optimisticError);
  } else {
    console.log(`✅ [STRIPE-ACTION] Optimistically updated User ${user.id} to plan ${targetPlanId}. End date: ${endIsoString}`);
  }

  if (session.url) redirect(session.url);
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

// --- Subscription Session ---
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

// --- Billing & Invoices ---
export async function getUserBillingInfo() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id, subscription_id, plan_id, current_period_end, subscription_status')
    .eq('id', user.id)
    .single();

  if (!userData?.stripe_customer_id) {
    return { invoices: [], subscription: null, planDetails: null };
  }

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

  let subscriptionDetails = null;
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

    const renewalDate = userData.current_period_end;

    subscriptionDetails = {
      id: sub.id,
      planName: productName,
      amount: amount,
      interval: interval,
      currentPeriodEnd: renewalDate,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      status: sub.status,
    };
  }
  else if (userData.subscription_id && userData.subscription_status && userData.current_period_end) {
    subscriptionDetails = {
      id: userData.subscription_id,
      planName: dbPlanDetails?.name || 'Unknown',
      amount: 'N/A',
      interval: 'N/A',
      currentPeriodEnd: userData.current_period_end,
      cancelAtPeriodEnd: userData.subscription_status === 'canceled',
      status: userData.subscription_status,
      currentPeriodStart: null
    };
  }

  return {
    invoices: formattedInvoices,
    subscription: subscriptionDetails,
    planDetails: dbPlanDetails
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

  return invoices.data.map(inv => ({
    id: inv.id,
    date: new Date(inv.created * 1000).toLocaleDateString(),
    amount: (inv.amount_paid / 100).toFixed(2),
    currency: inv.currency.toUpperCase(),
    pdfUrl: inv.invoice_pdf,
    status: inv.status
  }));
}

// --- UPDATED: Get Upcoming Invoice (Preview) ---
export async function getUpcomingInvoice(targetPlanId: string, targetInterval: 'month' | 'year') {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!userData?.stripe_customer_id) return null;

  const targetPlanConfig = SUBSCRIPTION_PLANS[targetPlanId];
  if (!targetPlanConfig) throw new Error('Invalid Plan');
  const targetPriceId = targetPlanConfig.prices[targetInterval];

  try {
    // We create a preview of a NEW subscription to show the user what they will be charged
    // in the subsequent Checkout flow.
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

export async function getProjectTokenTopUpHistory(projectId: string): Promise<TokenTransaction[]> {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    console.error('Project authorization failed:', projectError);
    return [];
  }

  const { data: transactions, error: transactionsError } = await supabase
    .from('token_transactions')
    .select('id, created_at, model_key, tokens_added, source')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (transactionsError) {
    console.error('Error fetching token transactions:', transactionsError);
    return [];
  }

  return transactions.map(t => ({
    id: t.id,
    transaction_date: new Date(t.created_at).toISOString(),
    model_key: t.model_key || 'Unknown Model',
    tokens_added: t.tokens_added || 0,
    source: t.source || 'Stripe Payment',
  })) as TokenTransaction[];
}

export async function verifyUserSubscription() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const supabaseAdmin = createAdminClient();

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_customer_id) {
      return { success: false, error: 'No Stripe customer found' };
    }

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

    let planId: string | null = null;
    const findPlanByPriceId = (pId: string) => {
      for (const [pIdKey, config] of Object.entries(SUBSCRIPTION_PLANS)) {
        if (config.prices.month === pId || config.prices.year === pId) {
          return pIdKey;
        }
      }
      return null;
    };

    planId = findPlanByPriceId(priceId);

    if (!planId && sub.metadata?.targetPlanId) {
      planId = sub.metadata.targetPlanId;
    }

    if (!planId && sub.items.data[0]?.price?.id) {
      planId = findPlanByPriceId(sub.items.data[0].price.id);
    }

    const endIso = (sub as any).current_period_end
      ? new Date((sub as any).current_period_end * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const updateData: any = {
      subscription_status: sub.status,
      current_period_end: endIso,
      subscription_id: sub.id,
      stripe_customer_id: userData.stripe_customer_id
    };

    if (planId) {
      updateData.plan_id = planId;
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, planId };

  } catch (error: any) {
    console.error('Error verifying subscription:', error);
    return { success: false, error: error.message };
  }
}