// frontend/utils/subscription-expiry.ts
// 
// Usage in your middleware/pages:
// 
// import { isSubscriptionExpired, handleSubscriptionExpired } from '@/utils/subscription-expiry';
// 
// // In a server component or API route:
// const expired = await isSubscriptionExpired(userId);
// if (expired) {
//   await handleSubscriptionExpired(userId);
//   redirect('/dashboard/subscription-expired');
// }

import { createAdminClient } from '@/utils/supabase/admin';
import Stripe from 'stripe';

/**
 * Check if a user's subscription has expired
 * Returns: true if expired, false if still active
 */
export async function isSubscriptionExpired(userId: string): Promise<boolean> {
  const supabaseAdmin = createAdminClient();

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('subscription_status, current_period_end')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ Error fetching user subscription:', error);
    return false;
  }

  // If subscription is already marked as canceled/inactive, it's expired
  if (user?.subscription_status !== 'active' && user?.subscription_status !== 'trialing') {
    return true;
  }

  // Check if current_period_end has passed
  if (!user?.current_period_end) {
    return true;
  }

  const expiryDate = new Date(user.current_period_end);
  const now = new Date();

  return now > expiryDate;
}

/**
 * Handle subscription expiration (call this when you detect expiration)
 */
export async function handleSubscriptionExpired(userId: string) {
  const supabaseAdmin = createAdminClient();

  console.log(`⚠️ Subscription expired for user: ${userId}`);

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'expired',
      plan_id: null, // Revert to free plan
    })
    .eq('id', userId);

  if (error) {
    console.error('❌ Error marking subscription as expired:', error);
  } else {
    console.log('✅ Subscription marked as expired');
  }
}

/**
 * Sync subscription status with Stripe (recommended to run periodically)
 * This fetches the latest subscription status from Stripe
 */
export async function syncSubscriptionWithStripe(userId: string) {
  const supabaseAdmin = createAdminClient();
  const { stripe } = await import('@/utils/stripe/server');

  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id, subscription_id')
    .eq('id', userId)
    .single();

  if (fetchError || !user?.subscription_id) {
    console.warn(`No subscription found for user: ${userId}`);
    return;
  }

  try {
    // Fetch latest subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id);

    const status = subscription.status;
    const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();

    // Update local DB with latest Stripe data
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        subscription_status: status,
        current_period_end: currentPeriodEnd,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error syncing subscription:', updateError);
    } else {
      console.log('✅ Subscription synced with Stripe');
    }
  } catch (err) {
    console.error('❌ Stripe API error:', err);
  }
}

/**
 * Batch check all users' subscriptions for expiration
 * Run this as a cron job (e.g., daily)
 */
export async function checkAllExpiredSubscriptions() {
  const supabaseAdmin = createAdminClient();

  console.log('🔍 Checking for expired subscriptions...');

  // Get all users with active subscriptions
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, subscription_status, current_period_end')
    .in('subscription_status', ['active', 'trialing']);

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  const now = new Date();
  const expiredUsers = [];

  for (const user of users || []) {
    if (user.current_period_end) {
      const expiryDate = new Date(user.current_period_end);
      if (now > expiryDate) {
        expiredUsers.push(user.id);
      }
    }
  }

  if (expiredUsers.length === 0) {
    console.log('✅ No expired subscriptions found');
    return;
  }

  // Mark all expired users
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'expired',
      plan_id: null,
    })
    .in('id', expiredUsers);

  if (updateError) {
    console.error('❌ Error updating expired subscriptions:', updateError);
  } else {
    console.log(`✅ Marked ${expiredUsers.length} subscriptions as expired`);
  }
}