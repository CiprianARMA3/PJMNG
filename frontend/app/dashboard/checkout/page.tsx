"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createSubscriptionCheckout } from "@/app/actions/stripe";
import { Loader2, CheckCircle2, ShieldCheck, ArrowLeft, CreditCard } from "lucide-react";
import { PLAN_UUIDS } from "@/utils/stripe/config";
import { getUserSubscriptionData } from "@/app/actions/getUserSubscriptionData";

interface Plan {
    id: string;
    name: string;
    monthly_price: number;
    yearly_price: number;
    features: string[];
}

// Map Plan Names to Config UUIDs (Reverse of what we usually do, but needed for checkout action)
const PLAN_MAPPING: Record<string, string> = {
    'Individual': PLAN_UUIDS.INDIVIDUAL,
    'Developers': PLAN_UUIDS.DEVELOPERS,
    'Enterprise': PLAN_UUIDS.ENTERPRISE
};

const PLAN_ORDER = ["Individual", "Developers", "Enterprise"];

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
    const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlan = async () => {
            if (!planId) {
                setError("No plan specified");
                setLoading(false);
                return;
            }

            try {
                // Fetch Plan Details
                const { data, error } = await supabase
                    .from("plans")
                    .select("*")
                    .eq("id", planId)
                    .single();

                if (error) throw error;
                setPlan(data);

                // Fetch Current Subscription
                const subData = await getUserSubscriptionData();
                if (subData?.planName && subData.subscription_status === 'active') {
                    setCurrentPlanName(subData.planName);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load details");
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
                await createSubscriptionCheckout(plan.id, interval);
            } catch (err) {
                console.error("Checkout error:", err);
                setError("Failed to initiate checkout. Please try again.");
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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

    // Determine Upgrade/Downgrade
    let isDowngrade = false;
    let isUpgrade = false;

    if (currentPlanName && plan) {
        const currentRank = PLAN_ORDER.indexOf(currentPlanName);
        const newRank = PLAN_ORDER.indexOf(plan.name);
        if (newRank < currentRank) isDowngrade = true;
        if (newRank > currentRank) isUpgrade = true;
    }

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
                                <h2 className="text-xl font-bold text-white">
                                    {isDowngrade ? 'Downgrade Summary' : isUpgrade ? 'Upgrade Summary' : 'Order Summary'}
                                </h2>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{plan.name} Plan</h3>
                                        <p className="text-zinc-400 text-sm mt-1">Billed {billingPeriod.toLowerCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-white">€{price}</p>
                                        <p className="text-zinc-400 text-sm">/{interval}</p>
                                    </div>
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

                            <div className="bg-white/5 p-6 border-t border-white/5">
                                {isDowngrade ? (
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-zinc-400">Due Today</span>
                                            <span className="font-medium text-white">€0.00</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-2">
                                            Your new rate of €{price}/{interval} will apply starting from your next billing cycle.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-zinc-400">Subtotal</span>
                                            <span className="font-medium text-white">€{price}</span>
                                        </div>
                                        {isUpgrade && (
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-zinc-400">Proration Credit</span>
                                                <span className="font-medium text-green-400">Calculated at checkout</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                            <span className="text-lg font-bold text-white">
                                                {isUpgrade ? 'Estimated due today' : 'Total due today'}
                                            </span>
                                            <span className="text-2xl font-bold text-purple-400">
                                                {isUpgrade ? `~€${price}` : `€${price}`}
                                            </span>
                                        </div>
                                        {isUpgrade && (
                                            <p className="text-xs text-zinc-500 mt-2">
                                                You will only be charged the difference between your current plan and the new plan for the remainder of the billing period.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Checkout Action */}
                    <div className="md:col-span-1">
                        <div className="bg-[#141417] rounded-2xl border border-white/10 p-6 sticky top-8">
                            <h3 className="font-semibold text-white mb-4">
                                {isDowngrade ? 'Confirm Change' : 'Complete Purchase'}
                            </h3>

                            <div className="space-y-4">
                                {!isDowngrade && (
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                        <div className="w-8 h-8 bg-[#1a1a1d] rounded-full flex items-center justify-center border border-white/10 text-zinc-400">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Secure Payment</p>
                                            <p className="text-xs text-zinc-400">Processed by Stripe</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleConfirm}
                                    disabled={isPending}
                                    className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isDowngrade
                                            ? 'bg-zinc-700 hover:bg-zinc-600 text-white shadow-zinc-900/20'
                                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
                                        }`}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        isDowngrade ? "Confirm Downgrade" : (isUpgrade ? "Confirm Upgrade" : "Confirm & Pay")
                                    )}
                                </button>

                                <p className="text-xs text-center text-zinc-500 mt-4">
                                    By confirming, you agree to our Terms of Service. {isDowngrade ? 'Your plan will change at the end of the billing cycle.' : 'You can cancel your subscription at any time.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
