"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createSubscriptionCheckout } from "@/app/actions/stripe";
import { Loader2, CheckCircle2, ShieldCheck, ArrowLeft, CreditCard } from "lucide-react";
import { PLAN_UUIDS } from "@/utils/stripe/config";

interface Plan {
    id: string;
    name: string;
    monthly_price: number;
    yearly_price: number;
    features: string[];
}

const PLAN_MAPPING: Record<string, string> = {
    'Individual': PLAN_UUIDS.INDIVIDUAL,
    'Developers': PLAN_UUIDS.DEVELOPERS,
    'Enterprise': PLAN_UUIDS.ENTERPRISE
};

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();

    const planId = searchParams.get("planId");
    const interval = searchParams.get("interval") as "month" | "year" || "month";

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlan = async () => {
            if (!planId) {
                setError("No plan specified");
                setLoading(false);
                return;
            }

            try {
                const { data: planData, error: planError } = await supabase
                    .from("plans")
                    .select("*")
                    .eq("id", planId)
                    .single();

                if (planError) throw planError;
                setPlan(planData);
                console.log(`✅ [CHECKOUT] Plan loaded: ${planData.name}`);

            } catch (err) {
                console.error("Error fetching plan:", err);
                setError("Failed to load plan details");
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [planId, supabase]);

    const handleConfirm = () => {
        if (!plan) return;

        startTransition(async () => {
            try {
                console.log(`📝 [CHECKOUT] Initiating subscription for ${plan.name}...`);
                await createSubscriptionCheckout(PLAN_MAPPING[plan.name], interval);
            } catch (err) {
                console.error("Checkout error:", err);
                setError("Failed to initiate checkout. Please try again.");
            }
        });
    };

    if (loading) {
        return (
            <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
                <svg aria-hidden="true" className="inline w-8 h-8 text-neutral-400 animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    if (error || !plan) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
                <div className="bg-[#141417] p-8 rounded-2xl border border-white/10 text-center max-w-md w-full">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                    <p className="text-zinc-400 mb-6">{error || "Plan not found"}</p>
                    <button
                        onClick={() => router.back()}
                        className="w-full py-2.5 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const price = interval === "month" ? plan.monthly_price : plan.yearly_price;
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
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Plan Info */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{plan.name} Plan</h3>
                                        <p className="text-zinc-400 text-sm mt-1">Billed {billingPeriod.toLowerCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-white">
                                            €{price.toFixed(2)}
                                        </p>
                                        <p className="text-zinc-400 text-sm">per {billingPeriod.toLowerCase()}</p>
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                                    <p className="text-sm text-blue-300">
                                        ✓ Subscription will renew automatically every {billingPeriod.toLowerCase()}.
                                    </p>
                                </div>

                                <div className="border-t border-white/5 pt-6">
                                    <h4 className="text-sm font-medium text-white mb-4">Plan Features</h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-center text-zinc-300 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                            <span>Full access to {plan.name} features</span>
                                        </li>
                                        <li className="flex items-center text-zinc-300 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                            <span>Priority support</span>
                                        </li>
                                        <li className="flex items-center text-zinc-300 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                            <span>Cancel anytime</span>
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
                                        €{price.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Action */}
                    <div className="md:col-span-1">
                        <div className="bg-[#141417] rounded-2xl border border-white/10 p-6 sticky top-8">
                            <h3 className="font-semibold text-white mb-4">Complete Purchase</h3>

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
                                            Processing...
                                        </>
                                    ) : (
                                        "Confirm & Pay"
                                    )}
                                </button>

                                <p className="text-xs text-center text-zinc-500 mt-4">
                                    By confirming, you agree to our Terms of Service. You can cancel your subscription at any time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}