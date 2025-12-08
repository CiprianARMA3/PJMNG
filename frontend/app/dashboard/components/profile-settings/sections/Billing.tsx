"use client";

import { useEffect, useState } from "react";
import { Download, CreditCard, Calendar, CheckCircle, XCircle, Loader2, Clock, TrendingUp, Info, AlertCircle } from "lucide-react";
import { getUserBillingInfo, cancelUserSubscription } from "@/app/actions/stripe";

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const billingData = await getUserBillingInfo();
                setData(billingData);
            } catch (error) {
                console.error("Failed to load billing", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleCancel = async (subId: string) => {
        if (!confirm("Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.")) return;

        setCancelling(true);
        const res = await cancelUserSubscription(subId);
        if (res.success) {
            // Refresh local state
            const updated = await getUserBillingInfo();
            setData(updated);
        } else {
            alert("Error cancelling subscription: " + res.error);
        }
        setCancelling(false);
    };

    // Calculate days until expiration
    const getDaysUntilExpiration = () => {
        if (!data?.subscription?.expirationTimestamp) return null;
        const now = Date.now();
        const diff = data.subscription.expirationTimestamp - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white w-8 h-8" /></div>;

    const daysLeft = getDaysUntilExpiration();

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
                <p className="text-white/60">Manage your subscription plan, view payment history, and billing information.</p>
            </div>

            {/* Subscription Overview Grid */}
            {data?.subscription && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Plan */}
                    <div className="bg-[#141417] border border-[#1e1e22] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-purple-400 mb-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Current Plan</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{data.subscription.planName}</h3>
                        <p className="text-white/60 text-sm">€{data.subscription.amount}/{data.subscription.interval}</p>
                    </div>

                    {/* Billing Period */}
                    <div className="bg-[#141417] border border-[#1e1e22] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Billing Period</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                            {data.subscription.currentPeriodStart}
                        </h3>
                        <p className="text-white/60 text-sm">to {data.subscription.currentPeriodEnd}</p>
                    </div>

                    {/* Next Renewal */}
                    <div className="bg-[#141417] border border-[#1e1e22] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">
                                {data.subscription.cancelAtPeriodEnd ? 'Expires On' : 'Renews On'}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                            {data.subscription.currentPeriodEnd}
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

                {data?.subscription ? (
                    <div className="p-6 space-y-6">
                        {/* Main Subscription Info */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 rounded-xl p-6 border border-white/5">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-2xl font-bold text-white">{data.subscription.planName}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${data.subscription.cancelAtPeriodEnd
                                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                                        }`}>
                                        {data.subscription.cancelAtPeriodEnd ? 'Cancels Soon' : 'Active'}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Calendar className="w-4 h-4" />
                                        <span>Started: {data.subscription.currentPeriodStart}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Clock className="w-4 h-4" />
                                        <span>{data.subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews'}: {data.subscription.currentPeriodEnd}</span>
                                    </div>
                                    {daysLeft !== null && (
                                        <div className={`flex items-center gap-2 font-medium ${daysLeft <= 7 ? 'text-orange-400' : 'text-white/80'}`}>
                                            <AlertCircle className="w-4 h-4" />
                                            <span>{daysLeft > 0 ? `${daysLeft} days remaining in period` : 'Billing period ended'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-white/80 font-semibold text-lg">
                                        €{data.subscription.amount} <span className="text-white/50 font-normal text-sm">per {data.subscription.interval}</span>
                                    </p>
                                </div>
                            </div>

                            {!data.subscription.cancelAtPeriodEnd && (
                                <button
                                    onClick={() => handleCancel(data.subscription.id)}
                                    disabled={cancelling}
                                    className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {cancelling ? "Processing..." : "Cancel Subscription"}
                                </button>
                            )}
                        </div>

                        {/* Plan Features from Database */}
                        {data?.planDetails && (
                            <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                                <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-purple-400" />
                                    Plan Features & Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-white/50 mb-1">Plan Name</p>
                                        <p className="text-white font-medium">{data.planDetails.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/50 mb-1">Monthly Price</p>
                                        <p className="text-white font-medium">€{data.planDetails.monthly_price}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/50 mb-1">Yearly Price</p>
                                        <p className="text-white font-medium">€{data.planDetails.yearly_price}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/50 mb-1">Subscription Status</p>
                                        <p className="text-white font-medium capitalize">{data.subscription.status}</p>
                                    </div>
                                </div>
                            </div>
                        )}
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

            {/* Invoices Table */}
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
                            {data?.invoices.map((inv: any) => (
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
                            {data?.invoices.length === 0 && (
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