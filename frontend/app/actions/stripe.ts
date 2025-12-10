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

// --- MAIN: Create Subscription Checkout ---
export async function createSubscriptionCheckout(
  targetPlanId: string,
  interval: 'month' | 'year'
) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  console.log(`\n🎯 [STRIPE-ACTION] User ${user.id} initiating subscription for ${targetPlanId} (${interval})`);

  // 1. Get Plan Config & Price
  const targetPlanConfig = SUBSCRIPTION_PLANS[targetPlanId];
  if (!targetPlanConfig) throw new Error('Invalid Plan selected');

  const targetPriceId = targetPlanConfig.prices[interval];
  if (!targetPriceId) throw new Error('Price not found for this interval');

  console.log(`✅ [STRIPE-ACTION] Plan found: ${targetPlanConfig.name}, Price ID: ${targetPriceId}`);

  // 2. Get or Create Stripe Customer
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

    // Store the customer ID (this is the ONLY subscription-related thing we store)
    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
    console.log(`✅ [STRIPE-ACTION] Stored stripe_customer_id in DB`);
  } else {
    console.log(`✅ [STRIPE-ACTION] Using existing Stripe customer: ${customerId}`);
  }

  // 3. Check for existing subscriptions in Stripe
  console.log(`\n🔍 [STRIPE-ACTION] Checking for existing subscriptions...`);
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 10
  });

  console.log(`📊 [STRIPE-ACTION] Found ${subscriptions.data.length} subscription(s)`);

  if (subscriptions.data.length > 0) {
    const activeSubs = subscriptions.data.filter(s => ['active', 'trialing'].includes(s.status));
    
    if (activeSubs.length > 0) {
      console.log(`🔄 [STRIPE-ACTION] User has ${activeSubs.length} active subscription(s). Attempting upgrade/downgrade...`);
      
      try {
        const existingSub = activeSubs[0];
        const currentPriceId = existingSub.items.data[0]?.price.id;
        
        console.log(`📌 [STRIPE-ACTION] Current price: ${currentPriceId}, Target price: ${targetPriceId}`);

        if (currentPriceId === targetPriceId) {
          console.log(`⚠️ [STRIPE-ACTION] Same plan selected. Redirecting to dashboard.`);
          redirect(`${getBaseUrl()}/dashboard`);
        }

        // Update subscription (Stripe handles prorations)
        const updatedSub = await stripe.subscriptions.update(existingSub.id, {
          items: [
            {
              id: existingSub.items.data[0].id,
              price: targetPriceId,
            }
          ],
          proration_behavior: 'always_invoice' // Charge/credit immediately for any difference
        });

        console.log(`✅ [STRIPE-ACTION] Subscription updated: ${updatedSub.id}`);
        console.log(`   Status: ${updatedSub.status}`);
        
        // SAFE LOGGING: Prevent crash if current_period_end is missing
        const updatedEnd = (updatedSub as any).current_period_end 
          ? new Date((updatedSub as any).current_period_end * 1000).toISOString() 
          : 'N/A';
        console.log(`   Current Period End: ${updatedEnd}`);
        
        redirect(`${getBaseUrl()}/dashboard?subscription_success=true`);
      } catch (err: any) {
        console.error(`❌ [STRIPE-ACTION] Failed to update subscription:`, err.message);
        throw new Error(`Failed to update subscription: ${err.message}`);
      }
    }
  }

  // 4. NEW SUBSCRIPTION: Create Checkout Session
  console.log(`\n💳 [STRIPE-ACTION] Creating new subscription checkout session...`);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: targetPriceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${getBaseUrl()}/dashboard?subscription_success=true`,
    cancel_url: `${getBaseUrl()}/dashboard/checkout?planId=${targetPlanId}&interval=${interval}&canceled=true`,
    metadata: {
      userId: user.id,
      targetPlanId: targetPlanId,
    }
  });

  console.log(`✅ [STRIPE-ACTION] Checkout session created: ${session.id}`);

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

// --- Billing & Invoices ---
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
      }
    }

    // SAFE DATE PARSING (Fixes RangeError)
    const periodEnd = (sub as any).current_period_end 
      ? new Date((sub as any).current_period_end * 1000) 
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
    planDetails: null
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