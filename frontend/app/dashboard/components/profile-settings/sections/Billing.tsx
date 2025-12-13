// frontend/app/dashboard/components/profile-settings/sections/Billing.tsx

"use client";

import { useEffect, useState } from "react";
import { 
  Download, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  TrendingUp, 
  Info, 
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { getUserBillingInfo, cancelUserSubscription } from "@/app/actions/stripe"; 

// --- Types ---
interface SubscriptionDetail {
    id: string;
    planId: string | null;
    priceId: string | null;
    planName: string;
    amount: string; 
    interval: 'month' | 'year';
    currentPeriodEnd: string | null; 
    cancelAtPeriodEnd: boolean; 
    status: string; 
}

interface InvoiceDetail {
    id: string;
    date: string | null; 
    amount: string; 
    currency: string;
    pdfUrl: string | null;
    status: string; 
}

// --- Shared Component: Page Widget (From CreateProjectPage) ---
const PageWidget = ({ title, icon: Icon, children, action }: any) => (
  <div className="relative z-10 w-full bg-[#111111] border border-[#222] rounded-xl flex flex-col overflow-visible shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] hover:border-[#333] transition-colors">
    <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between bg-[#141414] rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-[#1a1a1a] rounded-md border border-[#2a2a2a]">
           <Icon size={14} className="text-neutral-400" />
        </div>
        <h3 className="text-sm font-medium text-neutral-300 tracking-wide">{title}</h3>
      </div>
      {action || <MoreHorizontal size={16} className="text-neutral-600" />}
    </div>
    <div className="flex-1 p-6 bg-[#111111] min-h-0 relative flex flex-col rounded-b-xl text-neutral-300">
      {children}
    </div>
  </div>
);

// --- Stat Card Component ---
const StatCard = ({ icon: Icon, label, value, subtext, colorClass }: any) => (
  <div className="bg-[#111111] border border-[#222] rounded-xl p-5 hover:border-[#333] transition-colors shadow-sm">
      <div className={`flex items-center gap-2 mb-3 ${colorClass}`}>
          <Icon className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</span>
      </div>
      <h3 className="text-xl font-medium text-white/90 mb-1">{value}</h3>
      <p className="text-neutral-500 text-xs font-medium">
          {subtext}
      </p>
  </div>
);

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionDetail | null>(null);
    const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const billingInfo = await getUserBillingInfo();
            const sub = billingInfo.subscription as SubscriptionDetail | null; 
            
            if (sub) {
                setSubscriptionData(sub);
            } else {
                setSubscriptionData(null);
            }
            setInvoices(billingInfo.invoices as InvoiceDetail[] || []); 
        } catch (error) {
            console.error("Failed to load billing data:", error);
            setError("Failed to load billing information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCancel = async () => {
        if (!subscriptionData?.id) return;
        if (!confirm("Are you sure you want to cancel auto-renewal?")) return;

        setCancelling(true);
        setError(null);

        try {
            const res = await cancelUserSubscription(subscriptionData.id, true);
            if (res.success) {
                setSubscriptionData(prev => prev ? ({ ...prev, cancelAtPeriodEnd: res.cancelAtPeriodEnd! }) : null);
            } else {
                setError("Error scheduling cancellation: " + res.error);
            }
        } catch (err) {
            setError("Failed to process subscription cancellation.");
        } finally {
            setCancelling(false);
        }
    };
    
    const handleReactivate = async () => {
        if (!subscriptionData?.id) return;
        if (!confirm("Are you sure you want to re-enable auto-renewal?")) return;

        setCancelling(true);
        setError(null);
        try {
            const res = await cancelUserSubscription(subscriptionData.id, false); 
            if (res.success) {
                setSubscriptionData(prev => prev ? ({ ...prev, cancelAtPeriodEnd: res.cancelAtPeriodEnd! }) : null);
            } else {
                setError("Error re-enabling subscription: " + res.error);
            }
        } catch (err) {
            setError("Failed to re-enable subscription renewal.");
        } finally {
            setCancelling(false);
        }
    }

    const getDaysUntilExpiration = () => {
        if (!subscriptionData?.currentPeriodEnd) return null;
        const endDate = new Date(subscriptionData.currentPeriodEnd);
        const now = new Date();
        if (isNaN(endDate.getTime())) return null;
        if (endDate.getTime() < now.getTime()) return -1; 
        const diff = endDate.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'N/A';
        const dateObj = typeof date === 'string' ? new Date(date) : date; 
        if (isNaN(dateObj.getTime())) return 'N/A';
        return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const getPriceDisplay = (sub: SubscriptionDetail | null) => {
        if (!sub?.amount || !sub?.interval) return 'N/A';
        return `€${sub.amount}/${sub.interval === 'year' ? 'yr' : 'mo'}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-neutral-700 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
             <div className="p-4 bg-red-900/10 border border-red-900/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="inline w-4 h-4 mr-2" />
                {error}
             </div>
        );
    }

    const daysLeft = getDaysUntilExpiration();
    const formattedNextDate = formatDate(subscriptionData?.currentPeriodEnd || null);
    const hasRelevantSubscription = subscriptionData && !['canceled', 'incomplete', 'trialing_expired'].includes(subscriptionData.status);
    const isTrialing = subscriptionData && subscriptionData.status === 'trialing';
    const isCancelled = subscriptionData && subscriptionData.cancelAtPeriodEnd;
    const isPastDueOrUnpaid = subscriptionData && ['past_due', 'unpaid'].includes(subscriptionData.status);
    const isSubscriptionActive = subscriptionData && subscriptionData.status === 'active';

    return (
        <div className="max-w-5xl mx-auto space-y-8 font-sans">
            
            {/* Header */}
            <div>
                <h1 className="text-xl font-medium text-white/90 mb-1">Billing & Subscription</h1>
                <p className="text-sm text-neutral-500">Manage your plan, payments, and billing details.</p>
            </div>

            {/* Warning for Past Due */}
            {isPastDueOrUnpaid && subscriptionData && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex gap-4 text-orange-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                        <p className="font-medium text-sm text-orange-200">Payment Issue Detected</p>
                        <p className="text-xs mt-1 text-orange-400/80">Your subscription is <strong>{subscriptionData.status.replace('_', ' ')}</strong>. Update your payment method to avoid service interruption.</p>
                        <Link href="/pricing" className="text-orange-300 hover:text-orange-200 underline text-xs mt-2 inline-block">Update Payment Method &rarr;</Link>
                    </div>
                </div>
            )}

            {/* Subscription Overview Stats */}
            {subscriptionData && hasRelevantSubscription && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                        icon={CreditCard} 
                        label="Current Plan" 
                        value={subscriptionData.planName || 'Unknown'} 
                        subtext={getPriceDisplay(subscriptionData)}
                        colorClass="text-neutral-400"
                    />
                    <StatCard 
                        icon={Info} 
                        label="Status" 
                        value={isTrialing ? 'Trialing' : isPastDueOrUnpaid ? 'Past Due' : isSubscriptionActive ? 'Active' : 'Inactive'} 
                        subtext={isCancelled ? 'Cancels at period end' : 'Auto-renews'}
                        colorClass={isPastDueOrUnpaid ? "text-red-400" : isCancelled ? "text-yellow-400" : "text-blue-400"}
                    />
                    <StatCard 
                        icon={Clock} 
                        label={isCancelled ? 'Expires On' : 'Renews On'} 
                        value={formattedNextDate} 
                        subtext={daysLeft !== null && daysLeft > 0 ? `${daysLeft} days remaining` : (daysLeft === -1 ? "Expired" : "")}
                        colorClass="text-green-500"
                    />
                </div>
            )}

            {/* Main Subscription Widget */}
            <PageWidget title="Subscription Management" icon={TrendingUp}>
                {subscriptionData && hasRelevantSubscription ? (
                    <div className="space-y-8">
                        {/* Plan Info Row */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-4 rounded-lg bg-[#161616] border border-[#222]">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-medium text-white/90">{subscriptionData.planName}</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border tracking-wide ${
                                        isCancelled ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                        isPastDueOrUnpaid ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        'bg-green-500/10 text-green-500 border-green-500/20'
                                    }`}>
                                        {subscriptionData.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-sm text-neutral-500">
                                    {getPriceDisplay(subscriptionData)} billed {subscriptionData.interval}ly
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                {!isCancelled && !isPastDueOrUnpaid && (
                                    <button
                                        onClick={handleCancel}
                                        disabled={cancelling}
                                        className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#333] rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {cancelling ? "Processing..." : "Cancel Auto-Renewal"}
                                    </button>
                                )}
                                {isCancelled && !isPastDueOrUnpaid && (
                                    <button
                                        onClick={handleReactivate}
                                        disabled={cancelling}
                                        className="px-4 py-2 text-xs font-medium text-green-400 hover:text-green-300 bg-green-900/10 border border-green-900/20 hover:border-green-900/30 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {cancelling ? "Processing..." : "Re-enable Auto-Renewal"}
                                    </button>
                                )}
                                <Link
                                    href="/pricing"
                                    className="px-4 py-2 text-xs font-semibold bg-neutral-200 hover:bg-white text-black rounded-lg transition-colors shadow-lg"
                                >
                                    Change Plan
                                </Link>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10 text-sm">
                            <div className="space-y-1">
                                <span className="text-neutral-500 text-xs uppercase tracking-wide">Billing Cycle</span>
                                <div className="flex items-center gap-2 text-neutral-300">
                                    <Calendar className="w-4 h-4 text-neutral-500" />
                                    <span>{subscriptionData.interval === 'month' ? 'Monthly' : 'Yearly'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-neutral-500 text-xs uppercase tracking-wide">Next Invoice</span>
                                <div className="flex items-center gap-2 text-neutral-300">
                                    <Clock className="w-4 h-4 text-neutral-500" />
                                    <span>{formattedNextDate}</span>
                                </div>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <span className="text-neutral-500 text-xs uppercase tracking-wide">Subscription ID</span>
                                <p className="font-mono text-xs text-neutral-400 bg-[#161616] py-1.5 px-3 rounded border border-[#222] inline-block ml-5">
                                    {subscriptionData.id}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-[#161616] rounded-full flex items-center justify-center mb-4 border border-[#222]">
                            <CreditCard className="w-5 h-5 text-neutral-500" />
                        </div>
                        <h3 className="text-neutral-300 font-medium mb-1">No Active Plan</h3>
                        <p className="text-neutral-500 text-sm max-w-xs mx-auto mb-6">
                            Subscribe to a plan to unlock projects, collaborators, and advanced analytics.
                        </p>
                        <Link href="/pricing" className="px-5 py-2 text-sm font-semibold bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors">
                            View Plans
                        </Link>
                    </div>
                )}
            </PageWidget>

            {/* Invoice History Widget */}
            <PageWidget title="Invoice History" icon={Download}>
                <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#141414] text-neutral-500 font-medium uppercase text-[10px] tracking-wider border-y border-[#222]">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th> 
                                <th className="px-6 py-3 font-medium">Amount</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222] text-sm">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="group hover:bg-[#161616] transition-colors">
                                    <td className="px-6 py-4 text-neutral-300">{inv.date || 'N/A'}</td>
                                    <td className="px-6 py-4 text-white font-medium">
                                        {inv.currency === 'EUR' ? '€' : inv.currency === 'USD' ? '$' : inv.currency}{inv.amount}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${
                                            inv.status === 'paid'
                                            ? 'bg-green-500/5 text-green-500 border-green-500/10'
                                            : 'bg-red-500/5 text-red-500 border-red-500/10'
                                        }`}>
                                            {inv.status === 'paid' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                            <span>{inv.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {inv.pdfUrl ? (
                                            <div className="flex justify-end items-center"> 
                                                <a 
                                                    href={inv.pdfUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="text-neutral-400 hover:text-white transition-colors p-1" 
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-700">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-600 text-sm">
                                        No invoices found on this account.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </PageWidget>
        </div>
    );
}