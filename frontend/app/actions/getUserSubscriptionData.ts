// frontend/app/actions/getUserSubscriptionData.ts

'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { SUBSCRIPTION_PLANS } from '@/utils/stripe/config';
// Import the updated action that fetches data from Stripe
import { getUserBillingInfo } from '@/app/actions/stripe'; 

export interface UserSubscriptionData {
    plan_id: string | null;
    subscription_status: string | null;
    current_period_end: string | null;
    subscription_id: string | null;
    planName: string | null;
    planConfig: any;
    // These fields are crucial for fetching from Stripe (via getUserBillingInfo)
    interval: 'month' | 'year' | null; 
    cancelAtPeriodEnd: boolean | null; 
}

/**
 * Fetch complete user subscription data exclusively from Stripe via API action.
 * Returns plan_id, subscription_status, current_period_end, and mapped plan info.
 */
export async function getUserSubscriptionData(): Promise<UserSubscriptionData | null> {
    try {
        // Fetch data from Stripe via the server action
        const billingInfo = await getUserBillingInfo();
        const sub = billingInfo.subscription;
        const planConfig = billingInfo.planDetails;
        
        if (!sub) {
            return {
                plan_id: null,
                subscription_status: null,
                current_period_end: null,
                subscription_id: null,
                planName: null,
                planConfig: null,
                interval: null,
                cancelAtPeriodEnd: null,
            };
        }

        // Return the mapped data structure from Stripe's response
        return {
            plan_id: sub.planId,
            subscription_status: sub.status,
            current_period_end: sub.currentPeriodEnd,
            subscription_id: sub.id,
            planName: sub.planName,
            planConfig: planConfig,
            interval: sub.interval as 'month' | 'year',
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        };
    } catch (error) {
        console.error('Error in getUserSubscriptionData:', error);
        return null;
    }
}