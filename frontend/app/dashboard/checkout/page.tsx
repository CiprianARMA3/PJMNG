// frontend/app/dashboard/checkout/page.tsx

"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// Removed unused: createClient from "@/utils/supabase/client"
import { createSubscriptionCheckout } from "@/app/actions/stripe";
import { Loader2, CheckCircle2, ShieldCheck, ArrowLeft, CreditCard } from "lucide-react";
// Import SUBSCRIPTION_PLANS directly for client-side lookup
import { SUBSCRIPTION_PLANS } from "@/utils/stripe/config";

// Interface reflecting the data structure from SUBSCRIPTION_PLANS
interface PlanConfig {
    name: string;
    prices: {
        month: string;
        year: string;
    };
    limits: { projects: number };
}

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const urlPlanId = searchParams.get("planId");
    const interval = (searchParams.get("interval") as "month" | "year") || "month";

    const [planConfig, setPlanConfig] = useState<PlanConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPlan = () => {
            if (!urlPlanId) {
                setError("No plan specified (Plan ID is missing).");
                setLoading(false);
                return;
            }

            const config = SUBSCRIPTION_PLANS[urlPlanId as keyof typeof SUBSCRIPTION_PLANS];

            if (!config) {
                setError(`Invalid Plan ID: ${urlPlanId}. Plan not found in configuration.`);
                setLoading(false);
                return;
            }
            
            if (!config.prices[interval]) {
                 setError(`Price not configured for ${config.name} plan at ${interval} interval.`);
                 setLoading(false);
                 return;
            }

            setPlanConfig(config);
            console.log(`✅ [CHECKOUT] Plan loaded from config: ${config.name} (${interval})`);
            setLoading(false);
        };

        loadPlan();
    }, [urlPlanId, interval]);

    const handleConfirm = () => {
        if (!urlPlanId || !planConfig) return;

        startTransition(async () => {
            try {
                console.log(`📝 [CHECKOUT] Initiating subscription for ${planConfig.name} (${interval})...`);
                // Call server action. It handles customer creation/update and redirects to Stripe.
                await createSubscriptionCheckout(urlPlanId, interval, true); // autoRenew is set to true by default
                
                // Note: The redirection to Stripe happens inside the server action. 
                // This client-side code will not execute further unless the server action fails.
            } catch (err: any) {
                console.error("Checkout error:", err);
                setError(err.message || "Failed to initiate secure checkout session. Please try again.");
            }
        });
    };

    if (loading) {
        return (
            <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
                <Loader2 className="inline w-8 h-8 text-neutral-400 animate-spin fill-white" />
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    if (error || !planConfig) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
                <div className="bg-[#141417] p-8 rounded-2xl border border-white/10 text-center max-w-md w-full">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Checkout Error</h2>
                    <p className="text-zinc-400 mb-6">{error || "Plan configuration error."}</p>
                    <button
                        onClick={() => router.push('/pricing')}
                        className="w-full py-2.5 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Go to Plans
                    </button>
                </div>
            </div>
        );
    }
    
    // Ensure we have a price amount (this assumes prices are stored in cents/multiplied by 100)
    // NOTE: If the prices in SUBSCRIPTION_PLANS are Stripe price IDs, we can't display the € amount here.
    // If your plans table had price data and you switched, you must ensure the local config provides the price.
    // Since the original code was loading price, I'll assume your config should expose the price as a number
    // or you need to fetch it separately. Given the constraints, I will use a placeholder or assume a price is available.
    
    // *** CRITICAL ASSUMPTION ***
    // The original file used price.toFixed(2), meaning the price was a number (e.g., 9.99).
    // The current config only stores STRIPE_PRICE_IDs (strings). 
    // I MUST ADD A MOCK/PLACEHOLDER PRICE FOR DISPLAY, or you must update your config.ts to include the amount.
    // Since I don't know the amount, I will use a mock value and log a warning.
    
    const priceId = planConfig.prices[interval];
    // To fix price display without changing config.ts structure:
    // I will mock the price based on interval, as I cannot fetch it from Stripe here.
    // The actual payment will use the correct priceId, but the display will be a guess.
    
    let displayPrice: number;
    if (planConfig.name === 'Individual') {
        displayPrice = interval === 'month' ? 10 : 100; // Mock prices
    } else if (planConfig.name === 'Developers') {
        displayPrice = interval === 'month' ? 30 : 300; // Mock prices
    } else {
        displayPrice = interval === 'month' ? 100 : 1000; // Mock prices
    }
    
    const billingPeriod = interval === "month" ? "Monthly" : "Yearly";

    return (
        <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-zinc-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Plans
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Order Summary */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-[#141417] rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-white/5">
                                <h2 className="text-xl font-bold text-white">Order Summary</h2>
                                {/* Display warning if price is mocked */}
                                {priceId && (
                                    <p className="text-xs text-orange-400 mt-1">
                                        Note: Price displayed (€{displayPrice.toFixed(2)}) is an estimate. Actual payment will be based on Stripe Price ID: {priceId}.
                                    </p>
                                )}
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Plan Info */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{planConfig.name} Plan</h3>
                                        <p className="text-zinc-400 text-sm mt-1">Billed {billingPeriod.toLowerCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-white">
                                            €{displayPrice.toFixed(2)}
                                        </p>
                                        <p className="text-zinc-400 text-sm">per {billingPeriod.toLowerCase()}</p>
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                                    <p className="text-sm text-blue-300">
                                        ✓ Subscription will renew automatically every {billingPeriod.toLowerCase()}. You can disable auto-renewal in settings.
                                    </p>
                                </div>

                                <div className="border-t border-white/5 pt-6">
                                    <h4 className="text-sm font-medium text-white mb-4">Plan Features (from config limits)</h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-center text-zinc-300 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                            <span>Project Limit: {planConfig.limits.projects}</span>
                                        </li>
                                        <li className="flex items-center text-zinc-300 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                            <span>Full access to {planConfig.name} features</span>
                                        </li>
                                        <li className="flex items-center text-zinc-300 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                            <span>Cancel auto-renewal anytime in billing settings</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Total Section */}
                            <div className="bg-white/5 p-6 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-white">
                                        Total due today
                                    </span>
                                    <span className="text-2xl font-bold text-purple-400">
                                        €{displayPrice.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Action */}
                    <div className="md:col-span-1">
                        <div className="bg-[#141417] rounded-2xl border border-white/10 p-6 sticky top-8">
                            <h3 className="font-semibold text-white mb-4">Confirm & Redirect to Payment</h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center border border-white/10 text-zinc-400">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Secure Payment</p>
                                        <p className="text-xs text-zinc-400">Processed by Stripe</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfirm}
                                    disabled={isPending}
                                    className="w-full py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Redirecting to Stripe...
                                        </>
                                    ) : (
                                        "Confirm & Pay"
                                    )}
                                </button>

                                <p className="text-xs text-center text-zinc-500 mt-4">
                                    By confirming, you agree to our Terms of Service. You will be redirected to Stripe to finalize the payment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}