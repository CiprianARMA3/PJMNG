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
      console.warn('[CHECK-SUB] User has no Stripe Customer ID');
      return { isValid: false, subscription: null, planName: null };
    }

    // 2. Query Stripe for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.log(`[CHECK-SUB] No active subscription found for ${userData.stripe_customer_id}`);
      return { isValid: false, subscription: null, planName: null };
    }

    const subscription = subscriptions.data[0] as any;
    
    const firstItem = subscription.items?.data?.[0];

    // --- DEBUG LOGS START ---
    const itemPeriodEnd = firstItem?.current_period_end;
    const subPeriodEnd = subscription.current_period_end;
    
    console.log(`🐛 [CHECK-SUB-DEBUG] Subscription ID: ${subscription.id}, Status: ${subscription.status}`);
    console.log(`🐛 [CHECK-SUB-DEBUG] Raw Item Period End: ${itemPeriodEnd} (Type: ${typeof itemPeriodEnd})`);
    console.log(`🐛 [CHECK-SUB-DEBUG] Raw Sub Period End: ${subPeriodEnd} (Type: ${typeof subPeriodEnd})`);
    // --- DEBUG LOGS END ---


    // FIX INTEGRATED: Prioritize item's period end, falling back to top level.
    const currentPeriodEnd = itemPeriodEnd ?? subPeriodEnd;

    
    console.log(`✅ [CHECK-SUB] Subscription found: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Period End (Resolved Value): ${currentPeriodEnd}`);

    let periodEndDate: Date;
    let periodEndDateISO: string;

    if (currentPeriodEnd) {
        // Handle standard Unix Timestamp (Seconds)
        periodEndDate = new Date(currentPeriodEnd * 1000);
        
        if (isNaN(periodEndDate.getTime())) {
             // Handle case where conversion results in Invalid Date
             console.error(`❌ [CHECK-SUB] Failed to create date object from timestamp: ${currentPeriodEnd}`);
             const d = new Date();
             d.setDate(d.getDate() + 30);
             periodEndDate = d;
        }

        periodEndDateISO = periodEndDate.toISOString();
        console.log(`🐛 [CHECK-SUB-DEBUG] Final Period End ISO: ${periodEndDateISO}`);
        
    } else {
        // Fallback if still missing (should not happen with active sub)
        console.warn('⚠️ [CHECK-SUB] "current_period_end" missing. Defaulting to now + 30d.');
        const d = new Date();
        d.setDate(d.getDate() + 30);
        periodEndDate = d;
        periodEndDateISO = periodEndDate.toISOString();
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
        // Convert Date object to ISO string before sending to frontend
        currentPeriodEnd: periodEndDateISO, 
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
  // The default redirect path, suitable for protecting non-subscription pages.
  redirectTo: string = '/dashboard/missing-subscription' 
): Promise<{ isValid: boolean; subscription: any; planName: string | null }> {
  const result = await checkSubscriptionStatus();

  if (!result.isValid) {
    // Executes a Next.js redirect to the specified path
    redirect(redirectTo); 
  }

  return result;
}

export async function getSubscriptionInfo() {
  const result = await checkSubscriptionStatus();
  return result.isValid ? result : null;
}