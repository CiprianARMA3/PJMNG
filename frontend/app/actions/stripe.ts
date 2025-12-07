'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { stripe, STRIPE_PRODUCTS, getBaseUrl } from '@/utils/stripe/config';
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

  // Validate projectId format (Basic check)
  if (!projectId || typeof projectId !== 'string') {
      console.error("Invalid Project ID received:", projectId);
      throw new Error("Invalid Project ID");
  }

  // Verify Project Existence
  const { data: project, error } = await supabase
    .from('projects')
    .select('id') // Select just ID to confirm existence/access
    .eq('id', projectId)
    .single();

  if (error || !project) {
    console.error("Project fetch error:", error, "Project ID:", projectId);
    throw new Error(`Project not found or access denied. Error: ${error?.message || 'Unknown'}`);
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
    // UPDATE THESE TWO LINES:
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