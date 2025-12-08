'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { SUBSCRIPTION_PLANS } from '@/utils/stripe/config';

export interface UserSubscriptionData {
    plan_id: string | null;
    subscription_status: string | null;
    current_period_end: string | null;
    subscription_id: string | null;
    planName: string | null;
    planConfig: any;
}

/**
 * Fetch complete user subscription data from Supabase
 * Returns plan_id, subscription_status, current_period_end, and mapped plan info
 */
export async function getUserSubscriptionData(): Promise<UserSubscriptionData | null> {
    try {
        const supabase = createClient(cookies());
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error('No authenticated user');
            return null;
        }

        const { data: userData, error } = await supabase
            .from('users')
            .select('plan_id, subscription_status, current_period_end, subscription_id')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching user subscription data:', error);
            return null;
        }

        // Map plan_id to plan name and config
        let planName: string | null = null;
        let planConfig: any = null;

        if (userData.plan_id && SUBSCRIPTION_PLANS[userData.plan_id]) {
            planConfig = { ...SUBSCRIPTION_PLANS[userData.plan_id] };
            planName = planConfig.name;

            // Fetch price from database to ensure accuracy
            const { data: planDbData } = await supabase
                .from('plans')
                .select('monthly_price, yearly_price')
                .eq('id', userData.plan_id)
                .single();

            if (planDbData) {
                // Merge DB prices into planConfig.prices
                planConfig.prices = {
                    ...planConfig.prices,
                    monthly_price: planDbData.monthly_price,
                    yearly_price: planDbData.yearly_price
                };
            }
        }

        return {
            plan_id: userData.plan_id,
            subscription_status: userData.subscription_status,
            current_period_end: userData.current_period_end,
            subscription_id: userData.subscription_id,
            planName,
            planConfig,
        };
    } catch (error) {
        console.error('Error in getUserSubscriptionData:', error);
        return null;
    }
}
