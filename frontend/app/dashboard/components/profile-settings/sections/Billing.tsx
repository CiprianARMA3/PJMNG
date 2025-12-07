"use client";

import { useEffect, useState } from "react";
import { Download, CreditCard, Calendar, CheckCircle, XCircle, Loader2 } from "lucide-react";
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
    if(!confirm("Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.")) return;
    
    setCancelling(true);
    const res = await cancelUserSubscription(subId);
    if(res.success) {
        // Refresh local state
        const updated = await getUserBillingInfo();
        setData(updated);
    } else {
        alert("Error cancelling subscription: " + res.error);
    }
    setCancelling(false);
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white w-8 h-8" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Financial & Payments</h1>
        <p className="text-white/60">Manage your subscription plan and view payment history.</p>
      </div>

      {/* Active Subscription Card */}
      <div className="bg-[#141417] border border-[#1e1e22] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" /> Current Subscription
        </h2>

        {data?.subscription ? (
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 rounded-xl p-6 border border-white/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-white">{data.subscription.planName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${data.subscription.cancelAtPeriodEnd ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                            {data.subscription.cancelAtPeriodEnd ? 'Cancels soon' : 'Active'}
                        </span>
                    </div>
                    <p className="text-white/60 text-sm flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Renews on {data.subscription.currentPeriodEnd}
                    </p>
                    <p className="text-white/80 font-medium mt-2">
                        €{data.subscription.amount} / {data.subscription.interval}
                    </p>
                </div>
                
                {!data.subscription.cancelAtPeriodEnd && (
                    <button 
                        onClick={() => handleCancel(data.subscription.id)}
                        disabled={cancelling}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors"
                    >
                        {cancelling ? "Processing..." : "Cancel Subscription"}
                    </button>
                )}
             </div>
        ) : (
            <div className="text-center py-8 text-white/50 bg-white/5 rounded-xl border border-white/5 border-dashed">
                <p>No active subscription found.</p>
            </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-[#141417] border border-[#1e1e22] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1e1e22]">
            <h2 className="text-xl font-semibold text-white">Payment History</h2>
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
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    inv.status === 'paid' 
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                    {inv.status === 'paid' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                    <span className="capitalize">{inv.status}</span>
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {inv.pdfUrl && (
                                    <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
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