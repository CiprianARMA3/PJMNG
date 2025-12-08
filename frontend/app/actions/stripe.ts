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

  // 3. Check for existing subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: userData.stripe_customer_id,
    status: 'active',
    limit: 1,
  });

  try {
    let upcoming;
    
    if (subscriptions.data.length > 0) {
      // PRORATION MODE: Preview update to existing subscription
      const currentSub = subscriptions.data[0];
      const currentItemId = currentSub.items.data[0].id;

      // UPDATED: Use createPreview with subscription_details
      upcoming = await stripe.invoices.createPreview({
        customer: userData.stripe_customer_id,
        subscription: currentSub.id,
        subscription_details: {
            items: [{
                id: currentItemId,
                price: targetPriceId, 
            }],
            proration_behavior: 'always_invoice',
        }
      });
    } else {
      // NEW SUBSCRIPTION MODE: Preview new subscription
      upcoming = await stripe.invoices.createPreview({
        customer: userData.stripe_customer_id,
        subscription_details: {
            items: [{
                price: targetPriceId,
                quantity: 1,
            }],
        }
      });
    }

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