// frontend/app/dashboard/checkout/page.tsx

"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// Import the new preview action
import { createSubscriptionCheckout, getCheckoutPreview } from "@/app/actions/stripe";
import { Loader2, CheckCircle2, ShieldCheck, ArrowLeft, CreditCard, Info } from "lucide-react";
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

// Interface for the fetched price data
interface PriceDetails {
    amount: number;
    currency: string;
    mode: string;
    details?: string;
    message?: string;
}

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const urlPlanId = searchParams.get("planId");
    const interval = (searchParams.get("interval") as "month" | "year") || "month";

    const [planConfig, setPlanConfig] = useState<PlanConfig | null>(null);
    const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPlanAndPrice = async () => {
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

            try {
                // Fetch accurate pricing from Stripe (Handles both New & Upgrades)
                const data = await getCheckoutPreview(urlPlanId, interval);
                setPriceDetails({
                    amount: data.amount,
                    currency: data.currency.toUpperCase(),
                    mode: data.mode,
                    details: data.details,
                    message: data.message
                });
            } catch (err) {
                console.error("Failed to fetch price preview:", err);
                setError("Unable to calculate pricing details. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };

        loadPlanAndPrice();
    }, [urlPlanId, interval]);

    const handleConfirm = () => {
        if (!urlPlanId || !planConfig) return;

        startTransition(async () => {
            try {
                console.log(`📝 [CHECKOUT] Initiating subscription for ${planConfig.name} (${interval})...`);
                await createSubscriptionCheckout(urlPlanId, interval, true); 
            } catch (err: any) {
                console.error("Checkout error:", err);
                setError(err.message || "Failed to initiate secure checkout session.");
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

    if (error || !planConfig || !priceDetails) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
                <div className="bg-[#141417] p-8 rounded-2xl border border-white/10 text-center max-w-md w-full">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Checkout Error</h2>
                    <p className="text-zinc-400 mb-6">{error || "Unable to load checkout details."}</p>
                    <button
                        onClick={() => router.push('/pricing')} // Adjust route as needed
                        className="w-full py-2.5 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Return to Plans
                    </button>
                </div>
            </div>
        );
    }
    
    const billingPeriod = interval === "month" ? "Monthly" : "Yearly";
    
    // Formatting currency safely
    const formattedPrice = new Intl.NumberFormat('en-IE', { 
        style: 'currency', 
        currency: priceDetails.currency 
    }).format(priceDetails.amount);

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
                                {priceDetails.mode === 'update' && (
                                    <div className="mt-3 flex gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-lg text-sm">
                                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p>This is a prorated amount. You are only paying the difference between your old plan and the new one for the remainder of this billing cycle.</p>
                                    </div>
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
                                            {formattedPrice}
                                        </p>
                                        <p className="text-zinc-400 text-sm">
                                            {priceDetails.mode === 'update' ? 'due today' : `per ${billingPeriod.toLowerCase()}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                                    <p className="text-sm text-blue-300">
                                        ✓ Subscription will renew automatically every {billingPeriod.toLowerCase()}. You can disable auto-renewal in settings.
                                    </p>
                                </div>

                                <div className="border-t border-white/5 pt-6">
                                    <h4 className="text-sm font-medium text-white mb-4">Plan Features</h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-center text-zinc-300 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                            <span>Project Limit: {planConfig.limits.projects}</span>
                                        </li>
                                        <li className="flex items-center text-zinc-300 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                            <span>Full access to {planConfig.name} features</span>
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
                                        {formattedPrice}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Action */}
                    <div className="md:col-span-1">
                        <div className="bg-[#141417] rounded-2xl border border-white/10 p-6 sticky top-8">
                            <h3 className="font-semibold text-white mb-4">Confirm & Pay</h3>

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
                                    disabled={isPending || priceDetails.mode === 'no_change'}
                                    className="w-full py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        priceDetails.mode === 'no_change' ? "Current Plan" : "Confirm & Pay"
                                    )}
                                </button>
                                
                                {priceDetails.message && (
                                    <p className="text-xs text-center text-yellow-500 mt-2">
                                        {/* {priceDetails.message} */}
                                        For payment issues contact both Stripe and Kapry.DEV Administration.
                                    </p>
                                )}

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