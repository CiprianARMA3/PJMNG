'use server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { stripe } from '@/utils/stripe/server';
import { SUBSCRIPTION_PLANS } from '@/utils/stripe/config';

/**
 * Check subscription status by validating against Stripe
 * Stripe is the SOURCE OF TRUTH - we don't cache subscription data
 *
 * @returns {Promise<{isValid: boolean; subscription: any; planName: string | null}>}
 */
export async function checkSubscriptionStatus() {
  try {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[CHECK-SUB] No authenticated user');
      return { isValid: false, subscription: null, planName: null };
    }

    // 1. Get stripe_customer_id from DB
    const { data: userData, error } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (error || !userData?.stripe_customer_id) {
      return { isValid: false, subscription: null, planName: null };
    }

    // 2. Query Stripe for active/trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return { isValid: false, subscription: null, planName: null };
    }

    const subscription = subscriptions.data[0] as any;
    
    // FIX: Retrieve period end from the first subscription item
    // In API version 2025-11-17+, 'current_period_end' was moved from the subscription root to the items.
    const firstItem = subscription.items?.data?.[0];
    const currentPeriodEnd = firstItem?.current_period_end ?? subscription.current_period_end;

    console.log(`✅ [CHECK-SUB] Subscription found: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Period End (Item Level): ${currentPeriodEnd}`);

    let periodEndDate: Date;

    if (currentPeriodEnd) {
        // Handle standard Unix Timestamp (Seconds)
        periodEndDate = new Date(currentPeriodEnd * 1000);
    } else {
        // Fallback if still missing (should not happen with active sub)
        console.warn('⚠️ [CHECK-SUB] "current_period_end" missing on item. Defaulting to now + 30d.');
        const d = new Date();
        d.setDate(d.getDate() + 30);
        periodEndDate = d;
    }

    // 3. Determine plan name from price
    let planName: string | null = null;
    if (firstItem?.price?.id) {
      const priceId = firstItem.price.id;
      for (const [planId, config] of Object.entries(SUBSCRIPTION_PLANS)) {
        if (config.prices.month === priceId || config.prices.year === priceId) {
          planName = config.name;
          break;
        }
      }
    }

    return {
      isValid: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: periodEndDate,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        amount: firstItem?.price?.unit_amount || 0,
        interval: firstItem?.price?.recurring?.interval || 'month',
      },
      planName
    };

  } catch (error) {
    console.error('[CHECK-SUB] Unexpected error:', error);
    return { isValid: false, subscription: null, planName: null };
  }
}

/**
 * Require an active subscription or redirect
 */
export async function requireActiveSubscription(
  redirectTo: string = '/dashboard/missing-subscription'
): Promise<{ isValid: boolean; subscription: any; planName: string | null }> {
  const result = await checkSubscriptionStatus();

  if (!result.isValid) {
    redirect(redirectTo);
  }

  return result;
}

export async function getSubscriptionInfo() {
  const result = await checkSubscriptionStatus();
  return result.isValid ? result : null;
}