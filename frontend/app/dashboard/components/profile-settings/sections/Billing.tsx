// frontend/app/dashboard/components/profile-settings/sections/Billing.tsx

"use client";

import { useEffect, useState } from "react";
import { Download, CreditCard, Calendar, CheckCircle, XCircle, Loader2, Clock, TrendingUp, Info, AlertCircle } from "lucide-react";
import { getUserBillingInfo, cancelUserSubscription } from "@/app/actions/stripe"; 
// Removed redundant import of getUserSubscriptionData, as the data is now merged inside getUserBillingInfo

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [billingInfo, setBillingInfo] = useState<any>(null); 
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch combined Stripe/DB data
                const info = await getUserBillingInfo();
                setBillingInfo(info);
            } catch (error) {
                console.error("Failed to load billing", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleCancel = async () => {
        if (!billingInfo?.subscription?.id) return;
        if (!confirm("Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.")) return;

        setCancelling(true);
        const res = await cancelUserSubscription(billingInfo.subscription.id);
        if (res.success) {
            // Re-fetch data on success
            const updated = await getUserBillingInfo();
            setBillingInfo(updated);
        } else {
            alert("Error cancelling subscription: " + res.error);
        }
        setCancelling(false);
    };

    const subscriptionData = billingInfo?.subscription;
    
    // Calculate days until expiration - relies on the accurate ISO string from the server
    const getDaysUntilExpiration = () => {
        if (!subscriptionData?.currentPeriodEnd) return null;
        
        const endDate = new Date(subscriptionData.currentPeriodEnd); 
        const now = new Date();
        
        const diff = endDate.getTime() - now.getTime();
        // Use Math.ceil to round up, correctly showing days left until the period ends
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); 
        return days;
    };

    // Format date - uses the accurate ISO string from the server
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date'; // Safety check
        // The date is formatted correctly here regardless of the input ISO string
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };
    
    // Helper to get correct plan price display using Stripe data
    const getPriceDisplay = (sub: any) => {
        if (!sub?.amount || !sub?.interval) return 'N/A';
        const intervalLabel = sub.interval === 'year' ? 'year' : 'month';
        return `€${sub.amount}/${intervalLabel}`;
    };


    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white w-8 h-8" /></div>;

    const dbPlanDetails = billingInfo?.planDetails; // DB details for monthly/yearly breakdown
    const invoices = billingInfo?.invoices || [];
    const daysLeft = getDaysUntilExpiration();
    
    // Status check relies on Stripe subscription status
    const hasActiveSubscription = subscriptionData && (
        subscriptionData.status === 'active' ||
        subscriptionData.status === 'trialing' ||
        (subscriptionData.status === 'canceled' && daysLeft !== null && daysLeft > 0)
    );
    const isSubscriptionCancelled = subscriptionData?.cancelAtPeriodEnd || subscriptionData?.status === 'canceled'; 

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
                <p className="text-white/60">Manage your subscription plan, view payment history, and billing information.</p>
            </div>

            {/* Subscription Overview Grid */}
            {hasActiveSubscription && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Plan */}
                    <div className="bg-[#141417] border border-[#1e1e22] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-purple-400 mb-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Current Plan</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{subscriptionData.planName || 'Unknown'}</h3>
                        <p className="text-white/60 text-sm">
                            {subscriptionData ? getPriceDisplay(subscriptionData) : 'N/A'}
                        </p>
                    </div>

                    {/* Subscription Status */}
                    <div className="bg-[#141417] border border-[#1e1e22] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Info className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Status</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1 capitalize">
                            {subscriptionData.status}
                        </h3>
                        <p className="text-white/60 text-sm">
                            {isSubscriptionCancelled ? 'Subscription cancelled' : 'Active subscription'}
                        </p>
                    </div>

                    {/* Expiration */}
                    <div className="bg-[#141417] border border-[#1e1e22] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">
                                {isSubscriptionCancelled ? 'Expires On' : 'Renews On'}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                            {formatDate(subscriptionData.currentPeriodEnd)}
                        </h3>
                        {daysLeft !== null && (
                            <p className={`text-sm font-medium ${daysLeft <= 7 ? 'text-orange-400' : 'text-white/60'}`}>
                                {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                            </p>
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

                {hasActiveSubscription ? (
                    <div className="p-6 space-y-6">
                        {/* Main Subscription Info */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 rounded-xl p-6 border border-white/5">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-2xl font-bold text-white">{subscriptionData.planName || 'Unknown Plan'}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${isSubscriptionCancelled
                                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                                        }`}>
                                        {isSubscriptionCancelled ? 'Cancels Soon' : 'Active'}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Calendar className="w-4 h-4" />
                                        <span>Plan Name: {subscriptionData.planName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Clock className="w-4 h-4" />
                                        <span>{isSubscriptionCancelled ? 'Expires' : 'Renews'}: {formatDate(subscriptionData.currentPeriodEnd)}</span>
                                    </div>
                                    {daysLeft !== null && (
                                        <div className={`flex items-center gap-2 font-medium ${daysLeft <= 7 ? 'text-orange-400' : 'text-white/80'}`}>
                                            <AlertCircle className="w-4 h-4" />
                                            <span>{daysLeft > 0 ? `${daysLeft} days remaining in period` : 'Billing period ended'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Display the actual current charge and interval */}
                                {subscriptionData.amount && subscriptionData.interval && (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <p className="text-white/80 font-semibold text-lg">
                                            €{subscriptionData.amount} <span className="text-white/50 font-normal text-sm">per {subscriptionData.interval}</span>
                                        </p>
                                        {/* Display the alternative price from DB if available */}
                                        {dbPlanDetails && (
                                            <p className="text-white/60 text-sm mt-1">
                                                {/* FIX: Use the OPPOSITE price and ensure toFixed(2) */}
                                                {subscriptionData.interval === 'month' 
                                                    ? `Billed €${(dbPlanDetails.yearly_price * 1).toFixed(2)} if paid yearly`
                                                    : `Billed €${(dbPlanDetails.monthly_price * 1).toFixed(2)} if paid monthly`
                                                }
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!isSubscriptionCancelled && (
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {cancelling ? "Processing..." : "Cancel Subscription"}
                                </button>
                            )}
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
                                    <p className="text-white/50 mb-1">Period End</p>
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