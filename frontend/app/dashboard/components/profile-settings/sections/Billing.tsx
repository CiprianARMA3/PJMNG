// frontend/app/dashboard/components/profile-settings/sections/Billing.tsx

"use client";

import { useEffect, useState } from "react";
import { Download, CreditCard, Calendar, CheckCircle, XCircle, Loader2, Clock, TrendingUp, Info, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getUserBillingInfo, cancelUserSubscription } from "@/app/actions/stripe";

// Define the expected structure from getUserBillingInfo().subscription
interface SubscriptionDetail {
    id: string;
    planId: string | null;
    priceId: string | null;
    planName: string;
    amount: string; // Already formatted as string 'XX.XX'
    interval: 'month' | 'year';
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean; // Must be boolean, not boolean | undefined
    status: string; // e.g., 'active', 'trialing', 'canceled', 'past_due', 'unpaid'
}

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionDetail | null>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            console.log("📊 [BILLING] Loading billing information from Stripe...");

            // Use the single comprehensive action to fetch all data from Stripe
            const billingInfo = await getUserBillingInfo();
            const sub = billingInfo.subscription as SubscriptionDetail | null;

            if (sub) {
                console.log("✅ [BILLING] Subscription status:", sub.status);
                setSubscriptionData(sub);
            } else {
                console.log("⚠️ [BILLING] No active subscription found");
                setSubscriptionData(null);
            }

            console.log("✅ [BILLING] Invoices loaded:", billingInfo.invoices?.length || 0);
            setInvoices(billingInfo.invoices || []);

        } catch (error) {
            console.error("❌ [BILLING] Failed to load billing data:", error);
            setError("Failed to load billing information.");
            setSubscriptionData(null);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Function to handle cancellation (setting cancel_at_period_end = true)
    const handleCancel = async () => {
        if (!subscriptionData?.id) return;

        if (!confirm("Are you sure you want to cancel auto-renewal? Your subscription will remain active until the end of the current billing period.")) {
            return;
        }

        setCancelling(true);
        setError(null);

        try {
            console.log(`📝 [BILLING] Setting subscription to cancel at period end: ${subscriptionData.id}`);
            // Pass true to set cancel_at_period_end = true
            const res = await cancelUserSubscription(subscriptionData.id, true);

            if (res.success) {
                console.log("✅ [BILLING] Subscription cancellation scheduled successfully");
                // FIX: Use non-null assertion (!) to satisfy TypeScript that res.cancelAtPeriodEnd is boolean here.
                setSubscriptionData(prev => prev ? ({ ...prev, cancelAtPeriodEnd: res.cancelAtPeriodEnd! }) : null);
            } else {
                console.error("❌ [BILLING] Failed to schedule cancellation:", res.error);
                setError("Error scheduling cancellation: " + res.error);
            }
        } catch (err) {
            console.error("❌ [BILLING] Cancel error:", err);
            setError("Failed to process subscription cancellation.");
        } finally {
            setCancelling(false);
        }
    };
    
    // Function to handle reactivation (setting cancel_at_period_end = false)
    const handleReactivate = async () => {
        if (!subscriptionData?.id) return;

        if (!confirm("Are you sure you want to re-enable auto-renewal? Your subscription will continue automatically and bill on the next renewal date.")) {
            return;
        }

        setCancelling(true);
        setError(null);
        try {
            console.log(`📝 [BILLING] Re-enabling auto-renewal for: ${subscriptionData.id}`);
            // Pass false to set cancel_at_period_end = false (re-enables renewal)
            const res = await cancelUserSubscription(subscriptionData.id, false); 

            if (res.success) {
                console.log("✅ [BILLING] Auto-renewal successfully re-enabled");
                // FIX: Use non-null assertion (!) to satisfy TypeScript that res.cancelAtPeriodEnd is boolean here.
                setSubscriptionData(prev => prev ? ({ ...prev, cancelAtPeriodEnd: res.cancelAtPeriodEnd! }) : null);
            } else {
                console.error("❌ [BILLING] Failed to reactivate:", res.error);
                setError("Error re-enabling subscription: " + res.error);
            }
        } catch (err) {
            console.error("❌ [BILLING] Reactivate error:", err);
            setError("Failed to re-enable subscription renewal.");
        } finally {
            setCancelling(false);
        }
    }


    // Calculate days until expiration
    const getDaysUntilExpiration = () => {
        if (!subscriptionData?.currentPeriodEnd) return null;

        const endDate = new Date(subscriptionData.currentPeriodEnd);
        const now = new Date();
        // Check if the subscription is already expired
        if (endDate.getTime() < now.getTime()) return -1; 
        
        const diff = endDate.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    // Format date
    const formatDate = (date: Date | string | null) => {
        if (!date) return 'Unknown';

        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return 'Invalid Date';

        return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get price display
    const getPriceDisplay = (sub: SubscriptionDetail | null) => {
        if (!sub?.amount || !sub?.interval) return 'N/A';
        // Amount is already a formatted string like '9.99'
        const amountInEuro = sub.amount; 
        const intervalLabel = sub.interval === 'year' ? 'year' : 'month';
        return `€${amountInEuro}/${intervalLabel}`;
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin text-white w-8 h-8" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
                    <p className="text-white/60">Manage your subscription plan, view payment history, and billing information.</p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
                    <p className="font-medium">{error}</p>
                </div>
            </div>
        );
    }

    const daysLeft = getDaysUntilExpiration();
    const hasActiveSubscription = subscriptionData && ['active', 'trialing', 'past_due', 'unpaid'].includes(subscriptionData.status);
    const isTrialing = subscriptionData && subscriptionData.status === 'trialing';
    const isCancelled = subscriptionData && subscriptionData.cancelAtPeriodEnd;
    const isPastDueOrUnpaid = subscriptionData && ['past_due', 'unpaid'].includes(subscriptionData.status);


    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
                <p className="text-white/60">Manage your subscription plan, view payment history, and billing information.</p>
            </div>

            {/* Warning for Past Due / Unpaid Status */}
            {isPastDueOrUnpaid && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-4 text-orange-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-white">Payment Issue Detected</p>
                        <p className="text-sm">Your subscription status is currently **{subscriptionData.status.toUpperCase().replace('_', ' ')}**. Please update your payment method immediately to prevent service interruption.</p>
                        <Link href="/pricing" className="text-blue-400 hover:underline text-sm mt-1 inline-block">Update Payment Details / Re-subscribe &rarr;</Link>
                    </div>
                </div>
            )}

            {/* Subscription Overview Grid */}
            {subscriptionData && hasActiveSubscription && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Plan */}
                    <div className="bg-[#141417] border border-[#1e1e22] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-purple-400 mb-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Current Plan</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{subscriptionData.planName || 'Unknown'}</h3>
                        <p className="text-white/60 text-sm">
                            {getPriceDisplay(subscriptionData)}
                        </p>
                    </div>

                    {/* Subscription Status */}
                    <div className="bg-[#141417] border border-[#1e1e22] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Info className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Status</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1 capitalize">
                            {isTrialing ? 'Trialing' : isPastDueOrUnpaid ? subscriptionData.status.replace('_', ' ') : 'Active'}
                        </h3>
                        <p className="text-white/60 text-sm">
                            {isCancelled ? 'Cancelling at period end' : 'Auto-renewal is active'}
                        </p>
                    </div>

                    {/* Expiration/Renewal */}
                    <div className="bg-[#141417] border border-[#1e1e22] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">
                                {isCancelled ? 'Expires On' : 'Renews On'}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                            {formatDate(subscriptionData.currentPeriodEnd)}
                        </h3>
                        {daysLeft !== null && daysLeft > 0 && (
                            <p className={`text-sm font-medium ${daysLeft <= 7 ? 'text-orange-400' : 'text-white/60'}`}>
                                {daysLeft} days remaining
                            </p>
                        )}
                        {daysLeft === -1 && (
                            <p className="text-sm font-medium text-red-400">Period Ended. Update Plan.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Active Subscription Card */}
            <div className="bg-[#141417] border border-[#1e1e22] rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-[#1e1e22]">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" /> Subscription Details
                    </h2>
                </div>

                {subscriptionData && hasActiveSubscription ? (
                    <div className="p-6 space-y-6">
                        {/* Main Subscription Info */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 rounded-xl p-6 border border-white/5">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-2xl font-bold text-white">{subscriptionData.planName || 'Unknown Plan'}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${isCancelled
                                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        : isTrialing
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                                        }`}>
                                        {isCancelled ? 'Cancelling Soon' : isTrialing ? 'Trialing' : 'Active'}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Calendar className="w-4 h-4" />
                                        <span>Plan: {subscriptionData.planName} ({subscriptionData.interval}ly)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Clock className="w-4 h-4" />
                                        <span>{isCancelled ? 'Expires' : 'Renews'}: {formatDate(subscriptionData.currentPeriodEnd)}</span>
                                    </div>
                                    {daysLeft !== null && daysLeft > 0 && (
                                        <div className={`flex items-center gap-2 font-medium ${daysLeft <= 7 ? 'text-orange-400' : 'text-white/80'}`}>
                                            <AlertCircle className="w-4 h-4" />
                                            <span>{daysLeft} days remaining in period</span>
                                        </div>
                                    )}
                                </div>

                                {/* Display current charge */}
                                {subscriptionData.amount && subscriptionData.interval && (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <p className="text-white/80 font-semibold text-lg">
                                            {getPriceDisplay(subscriptionData)} <span className="text-white/50 font-normal text-sm">/ {subscriptionData.interval}</span>
                                            {isPastDueOrUnpaid && <span className="text-red-400 ml-2">(Payment Required)</span>}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                {!isCancelled && !isPastDueOrUnpaid && (
                                    <button
                                        onClick={handleCancel}
                                        disabled={cancelling}
                                        className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {cancelling ? "Processing..." : "Cancel Auto-Renewal"}
                                    </button>
                                )}
                                {isCancelled && !isPastDueOrUnpaid && (
                                    <button
                                        onClick={handleReactivate}
                                        disabled={cancelling}
                                        className="px-5 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {cancelling ? "Processing..." : "Re-enable Auto-Renewal"}
                                    </button>
                                )}
                                <Link
                                    href="/pricing"
                                    className="text-center px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Upgrade / Change Plan
                                </Link>
                            </div>
                        </div>

                        {/* Plan Details */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                            <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4 text-purple-400" />
                                Plan Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-white/50 mb-1">Plan Name</p>
                                    <p className="text-white font-medium">{subscriptionData.planName}</p>
                                </div>
                                <div>
                                    <p className="text-white/50 mb-1">Billing Interval</p>
                                    <p className="text-white font-medium capitalize">{subscriptionData.interval}</p>
                                </div>
                                <div>
                                    <p className="text-white/50 mb-1">Subscription ID</p>
                                    <p className="text-white font-medium text-xs truncate">{subscriptionData.id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-white/50 mb-1">{isCancelled ? 'Period End' : 'Renewal Date'}</p>
                                    <p className="text-white font-medium">{formatDate(subscriptionData.currentPeriodEnd)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-white/50 bg-white/5 border-t border-white/5 border-dashed">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                            <CreditCard className="w-8 h-8 text-white/30" />
                        </div>
                        <p className="font-medium">No active subscription found.</p>
                        <p className="text-sm mt-2">Subscribe to a plan to access premium features.</p>
                        <Link href="/pricing" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            View Pricing
                        </Link>
                    </div>
                )}
            </div>

            {/* Payment History */}
            <div className="bg-[#141417] border border-[#1e1e22] rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-[#1e1e22]">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Download className="w-5 h-5 text-purple-400" />
                        Payment History
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-white/5 text-white font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e1e22]">
                            {invoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">{inv.date}</td>
                                    <td className="px-6 py-4 font-medium text-white">
                                        {inv.currency === 'EUR' ? '€' : '$'}{inv.amount}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${inv.status === 'paid'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {inv.status === 'paid' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                            <span className="capitalize">{inv.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {inv.pdfUrl && (
                                            <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium">
                                                <Download size={14} />
                                                PDF
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-white/40">No invoices found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}