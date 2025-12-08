'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { STRIPE_PRODUCTS, getBaseUrl, SUBSCRIPTION_PLANS } from '@/utils/stripe/config';
import { stripe } from '@/utils/stripe/server';
import Stripe from 'stripe';

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

  // Create Customer if missing
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id }
    });
    customerId = customer.id;
    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  // --- 4. CHECK FOR EXISTING SUBSCRIPTION (Upgrade/Downgrade Logic) ---
  // Instead of creating a new checkout, we check if they already have a sub to update.
  const activeSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1
  });

  if (activeSubs.data.length > 0) {
    // USER HAS A SUBSCRIPTION -> SWAP IT
    const currentSub = activeSubs.data[0];
    const currentItemId = currentSub.items.data[0].id;

    // Direct Update via Stripe API (No Checkout UI needed)
    await stripe.subscriptions.update(currentSub.id, {
      items: [{
        id: currentItemId,
        price: priceId, // Swap to new price
      }],
      metadata: {
        userId: user.id,
        targetPlanId: targetPlanId,
        type: 'subscription_update'
      },
      // 'always_invoice' calculates proration and charges/credits immediately
      proration_behavior: 'always_invoice',
    });

    // Redirect back to dashboard immediately (Webhook will handle DB sync)
    redirect(`${getBaseUrl()}/dashboard?updated=true`);
    return;
  }

  // --- 5. NO EXISTING SUBSCRIPTION -> CREATE CHECKOUT ---
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${getBaseUrl()}/dashboard?subscription_success=true`,
    cancel_url: `${getBaseUrl()}/dashboard/components/subscriptionFolder?canceled=true`,
    metadata: {
      userId: user.id,
      targetPlanId: targetPlanId,
      type: 'subscription_update'
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        targetPlanId: targetPlanId
      }
    }
  });

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
        product_data: {
          name: `${pack.modelKey} Tokens`,
          description: `${(pack.amount / 1000).toFixed(0)}k Token Pack (Enterprise Rate)`,
          metadata: { modelKey: pack.modelKey }
        }
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

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [lineItem],
    mode: 'payment',
    success_url: `${getBaseUrl()}/dashboard/projects/${projectId}/payments/completed`,
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
    .select('stripe_customer_id, subscription_id, plan_id')
    .eq('id', user.id)
    .single();

  if (!userData?.stripe_customer_id) {
    return { invoices: [], subscription: null, planDetails: null };
  }

  // Fetch plan details from database if plan_id exists
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

  // 2. Fetch Active Subscription
  let subscriptionDetails = null;
  const subscriptions = await stripe.subscriptions.list({
    customer: userData.stripe_customer_id,
    status: 'active',
    limit: 1,
    expand: ['data.plan.product']
  });

  if (subscriptions.data.length > 0) {
    const sub = subscriptions.data[0] as any;

    // Robust Product Name & Price Fetching
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

    let formattedDate = 'Unknown';
    let expirationTimestamp = null;
    if (sub.current_period_end) {
      const dateObj = new Date(sub.current_period_end * 1000);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        expirationTimestamp = dateObj.getTime();
      }
    }

    subscriptionDetails = {
      id: sub.id,
      planName: productName,
      amount: amount,
      interval: interval,
      currentPeriodEnd: formattedDate,
      expirationTimestamp: expirationTimestamp,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      status: sub.status,
      currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : 'Unknown'
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