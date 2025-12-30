"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSubscriptionCheckout, getCheckoutPreview } from "@/app/actions/stripe";
import {
    Loader2,
    CheckCircle2,
    ShieldCheck,
    ArrowLeft,
    CreditCard,
    Info,
    Lock,
    AlertCircle
} from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/utils/stripe/config";

// --- Types ---
interface PlanConfig {
    name: string;
    prices: {
        month: string;
        year: string;
    };
    limits: { projects: number };
}

interface PriceDetails {
    amount: number;
    currency: string;
    mode: string;
    details?: string;
    message?: string;
}

function CheckoutContent() {
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
                if (err?.digest?.startsWith('NEXT_REDIRECT')) {
                    throw err;
                }
                console.error("Checkout error:", err);
                setError(err.message || "Failed to initiate secure checkout session.");
            }
        });
    };

    if (loading) {
        return (
            <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a] light:bg-white">
                <svg
                    aria-hidden="true"
                    className="inline w-8 h-8 text-neutral-400 animate-spin fill-white"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                    />
                    <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                    />
                </svg>
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    if (error || !planConfig || !priceDetails) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] light:bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-[#111111] light:bg-white p-8 rounded-xl border border-[#222] light:border-gray-200 text-center max-w-md w-full shadow-2xl light:shadow-lg">
                    <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-medium text-white light:text-black mb-2">Checkout Error</h2>
                    <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                        {error || "Unable to load checkout details."}
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-2.5 bg-white light:bg-black text-black light:text-white rounded-lg text-sm font-semibold hover:bg-neutral-200 light:hover:bg-neutral-800 transition-colors"
                    >
                        Return to Plans
                    </button>
                </div>
            </div>
        );
    }

    const billingPeriod = interval === "month" ? "Monthly" : "Yearly";

    const formattedPrice = new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: priceDetails.currency
    }).format(priceDetails.amount);

    return (
        <div className="min-h-screen bg-[#0a0a0a] light:bg-gray-50 text-sans py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-neutral-500 light:text-neutral-600 hover:text-white light:hover:text-black mb-8 transition-colors text-sm font-medium group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Plans
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Order Summary */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl overflow-hidden shadow-lg light:shadow-md">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-[#222] light:border-gray-200 bg-[#141414] light:bg-gray-50 flex items-center justify-between">
                                <h2 className="text-sm font-medium text-white light:text-black tracking-wide">Order Summary</h2>
                                <div className="flex items-center gap-2 px-2 py-1 bg-[#1a1a1a] light:bg-white border border-[#2a2a2a] light:border-gray-200 rounded text-[10px] text-neutral-400 light:text-neutral-500 uppercase tracking-wider font-semibold">
                                    <ShieldCheck size={12} />
                                    <span>Encrypted</span>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Plan Details */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-medium text-white light:text-black mb-1">{planConfig.name} Plan</h3>
                                        <p className="text-neutral-500 light:text-neutral-600 text-sm">Billed {billingPeriod.toLowerCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-medium text-white light:text-black tracking-tight">
                                            {formattedPrice}
                                        </p>
                                        <p className="text-neutral-500 text-xs mt-1">
                                            {priceDetails.mode === 'update' ? 'due today (prorated)' : `per ${billingPeriod.toLowerCase()}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Proration Notice */}
                                {priceDetails.mode === 'update' && (
                                    <div className="flex gap-3 text-blue-400 bg-blue-500/5 border border-blue-500/10 p-4 rounded-lg text-sm">
                                        <Info className="w-5 h-5 mt-0.5 flex-shrink-0 opacity-80" />
                                        <p className="leading-relaxed text-blue-300/90 text-xs light:font-bold light:text-blue-950">
                                            This is a prorated amount. You are paying the difference between your old plan and the new one for the remainder of this billing cycle.
                                        </p>
                                    </div>
                                )}

                                {/* Auto-renewal Notice */}
                                <div className="bg-[#161616] light:bg-gray-50 rounded-lg p-4 border border-[#222] light:border-gray-200">
                                    <p className="text-xs text-neutral-400 light:text-neutral-600 leading-relaxed flex gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-neutral-600 light:text-neutral-500 flex-shrink-0 mt-0.5" />
                                        <span>
                                            Subscription will renew automatically every {billingPeriod.toLowerCase()}. You can cancel or disable auto-renewal at any time in your settings.
                                        </span>
                                    </p>
                                </div>

                                {/* Features List */}
                                <div className="border-t border-[#222] light:border-gray-200 pt-6">
                                    <h4 className="text-xs font-semibold text-neutral-500 light:text-neutral-600 uppercase tracking-wider mb-4">Included in plan</h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-center text-neutral-300 light:text-neutral-700 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center mr-3 border border-green-500/20">
                                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                            </div>
                                            <span>Project Limit: <span className="text-white light:text-black font-medium">{planConfig.limits.projects}</span></span>
                                        </li>
                                        <li className="flex items-center text-neutral-300 light:text-neutral-700 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center mr-3 border border-green-500/20">
                                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                            </div>
                                            <span>Full access to {planConfig.name} features</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Total Bar */}
                            <div className="bg-[#141414] light:bg-gray-50 p-6 border-t border-[#222] light:border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-neutral-300 light:text-neutral-700">
                                        Total due today
                                    </span>
                                    <span className="text-xl font-semibold text-white light:text-black">
                                        {formattedPrice}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Action */}
                    <div className="md:col-span-1">
                        <div className="bg-[#111111] light:bg-white rounded-xl border border-[#222] light:border-gray-200 p-6 sticky top-8 shadow-lg light:shadow-md">
                            <h3 className="text-sm font-medium text-white light:text-black mb-6">Payment Method</h3>

                            <div className="space-y-6">
                                {/* Secure Payment Badge */}
                                <div className="flex items-center gap-3 p-3 bg-[#161616] light:bg-gray-50 rounded-lg border border-[#222] light:border-gray-200">
                                    <div className="w-8 h-8 bg-[#1a1a1a] light:bg-white rounded-full flex items-center justify-center border border-[#2a2a2a] light:border-gray-200 text-neutral-400 light:text-neutral-500">
                                        <Lock className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-white light:text-black">Secure Transaction</p>
                                        <p className="text-[10px] text-neutral-500">Provided by Stripe</p>
                                    </div>
                                </div>

                                {/* Info Text */}
                                <div className="text-xs text-neutral-500 space-y-2">
                                    <p>You will be redirected to Stripe to securely complete your payment.</p>
                                </div>

                                {/* Confirm Button */}
                                <button
                                    onClick={handleConfirm}
                                    disabled={isPending || priceDetails.mode === 'no_change'}
                                    className="w-full py-3 rounded-lg text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-white light:bg-black hover:bg-neutral-200 light:hover:bg-neutral-800 text-black light:text-white shadow-black/20"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        priceDetails.mode === 'no_change' ? "Current Plan" : "Confirm & Pay"
                                    )}
                                </button>

                                {priceDetails.message && (
                                    <p className="text-xs text-center text-yellow-500/90 mt-2 bg-yellow-500/5 p-2 rounded border border-yellow-500/10">
                                        For payment issues contact both Stripe and Kapry DEV Administration.
                                    </p>
                                )}

                                <p className="text-[10px] text-center text-neutral-600 mt-4 leading-normal">
                                    By confirming, you agree to our <a href="#" className="underline hover:text-neutral-400">Terms of Service</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a] light:bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}