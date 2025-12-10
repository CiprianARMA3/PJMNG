
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

    console.log(`\n🔍 [CHECK-SUB] Checking subscription for user ${user.id}`);

    // 1. Get stripe_customer_id from DB
    const { data: userData, error } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (error || !userData?.stripe_customer_id) {
      console.log(`[CHECK-SUB] User has no Stripe customer ID`);
      return { isValid: false, subscription: null, planName: null };
    }

    console.log(`✅ [CHECK-SUB] Found stripe_customer_id: ${userData.stripe_customer_id}`);

    // 2. Query Stripe for active/trialing subscriptions
    console.log(`🔍 [CHECK-SUB] Querying Stripe for active subscriptions...`);
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    console.log(`📊 [CHECK-SUB] Found ${subscriptions.data.length} active subscription(s)`);

    if (subscriptions.data.length === 0) {
      console.log(`[CHECK-SUB] No active subscriptions found in Stripe`);
      return { isValid: false, subscription: null, planName: null };
    }

    const subscription = subscriptions.data[0] as any;
    console.log(`✅ [CHECK-SUB] Subscription found: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Period End: ${new Date(subscription.current_period_end * 1000).toISOString()}`);

    // 3. Determine plan name from price
    let planName: string | null = null;
    if (subscription.items?.data?.[0]?.price?.id) {
      const priceId = subscription.items.data[0].price.id;
      console.log(`📌 [CHECK-SUB] Price ID: ${priceId}`);

      for (const [planId, config] of Object.entries(SUBSCRIPTION_PLANS)) {
        if (config.prices.month === priceId || config.prices.year === priceId) {
          planName = config.name;
          console.log(`✅ [CHECK-SUB] Mapped to plan: ${planName}`);
          break;
        }
      }
    }

    return {
      isValid: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        amount: subscription.items?.data?.[0]?.price?.unit_amount || 0,
        interval: subscription.items?.data?.[0]?.price?.recurring?.interval || 'month',
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
 * Use this in protected Server Components
 *
 * @param redirectTo - Where to redirect if no subscription
 */
export async function requireActiveSubscription(
  redirectTo: string = '/dashboard/missing-subscription'
): Promise<{ isValid: boolean; subscription: any; planName: string | null }> {
  const result = await checkSubscriptionStatus();

  console.log(`[REQUIRE-SUB] Subscription valid: ${result.isValid}`);

  if (!result.isValid) {
    console.log(`[REQUIRE-SUB] Redirecting to ${redirectTo}`);
    redirect(redirectTo);
  }

  return result;
}

/**
 * Check if a user is trialing (no payment method added yet)
 */
export async function checkTrialStatus() {
  try {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { isTrial: false };

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_customer_id) {
      return { isTrial: true };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripe_customer_id,
      status: 'trialing',
      limit: 1,
    });

    return { isTrial: subscriptions.data.length > 0 };

  } catch (error) {
    console.error('[CHECK-TRIAL] Error:', error);
    return { isTrial: false };
  }
}

/**
 * Get subscription status without redirecting
 * Returns detailed info or null if no valid subscription
 */
export async function getSubscriptionInfo() {
  const result = await checkSubscriptionStatus();
  return result.isValid ? result : null;
}