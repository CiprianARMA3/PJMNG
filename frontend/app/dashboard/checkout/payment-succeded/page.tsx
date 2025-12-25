import { redirect } from "next/navigation";
import Link from "next/link";
import { stripe } from "@/utils/stripe/server";
import { getUserSubscriptionData } from "@/app/actions/getUserSubscriptionData";
import {
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Download,
  ShieldCheck,
  User,
  Package,
  MapPin,
  Mail,
  Clock,
  Zap,
  LayoutDashboard,
  AlertCircle,
  CalendarDays,
  Wallet
} from "lucide-react";
import AuroraBackground from "@/app/components/AuroraBackground";

interface PageProps {
  searchParams: Promise<{
    session_id?: string;
    subscription_update_success?: string;
    subscription_id?: string;
    planId?: string;
    interval?: string;
    error?: string;
  }>;
}

export default async function PaymentSucceededPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { session_id, subscription_update_success, error, planId, interval, subscription_id } = params;

  // ===========================================================================
  // SCENARIO 1: ERROR STATE
  // Handles redirects with ?error=true
  // ===========================================================================
  if (error === "true") {
    return (
      <main className="bg-white min-h-screen font-sans selection:bg-red-100 selection:text-red-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />

        <div className="relative z-10 max-w-md w-full bg-red-50 p-10 rounded-[40px] border-2 border-red-100 shadow-xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-white text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <AlertCircle size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-[#202124] mb-3">Action Failed</h1>
          <p className="text-[#5f6368] font-bold text-lg mb-8 leading-relaxed">
            We couldn't update your subscription or process the payment. Please try again.
          </p>
          <Link
            href="/dashboard"
            className="w-full inline-flex justify-center items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-red-700 hover:scale-105 transition-all duration-300 shadow-lg shadow-red-600/20"
          >
            Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // ===========================================================================
  // SCENARIO 2: SUBSCRIPTION UPDATE (Upgrade/Downgrade)
  // Handles redirects with ?subscription_update_success=true
  // ===========================================================================
  if (subscription_update_success === "true") {

    // --- 1. Fetch Subscription Data (Renews On & Plan Name) ---
    const subData = await getUserSubscriptionData();
    let nextPaymentDate = "N/A";

    // Default to formatted planId if name isn't found
    let displayPlanName = planId
      ? planId.split('_').pop()?.replace(/([A-Z])/g, ' $1').trim()
      : "Premium Plan";

    if (subData) {
      // Parse the ISO string (e.g. 2026-12-24T...) into a readable date
      if (subData.current_period_end) {
        const dateObj = new Date(subData.current_period_end);
        if (!isNaN(dateObj.getTime())) {
          nextPaymentDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      }
      // Use the plan name from your config if available
      if (subData.planName) {
        displayPlanName = subData.planName;
      }
    }

    // --- 2. Fetch Amount Paid Today (Proration) directly from Stripe ---
    let amountPaidToday = 0;
    let currency = "EUR";
    let prorationMessage = "Amount Paid";

    if (subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscription_id, {
          expand: ['latest_invoice']
        });

        // Fetch Latest Invoice for Amount Paid Today
        if (sub.latest_invoice) {
          const invoice = typeof sub.latest_invoice === 'string'
            ? await stripe.invoices.retrieve(sub.latest_invoice)
            : sub.latest_invoice;

          amountPaidToday = (invoice.amount_paid || 0) / 100;
          currency = invoice.currency?.toUpperCase() || "EUR";

          // Logic to describe the charge
          if (amountPaidToday > 0) prorationMessage = "Prorated Charge";
          else if (amountPaidToday === 0) prorationMessage = "No Charge Today";
        }
      } catch (e) {
        console.error("Failed to fetch invoice details:", e);
      }
    }

    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });

    return (
      <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased relative overflow-hidden">
        <AuroraBackground />
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />

        <section className="relative z-20 min-h-screen flex flex-col items-center justify-center p-6 md:p-12">

          {/* Header */}
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm mb-8">
              <Zap size={14} className="text-purple-600" fill="currentColor" />
              <span className="text-[10px] font-bold text-purple-700 tracking-widest uppercase">Update Complete</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#202124] mb-6">
              Plan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Updated.
              </span>
            </h1>
            <p className="text-lg text-[#5f6368] max-w-lg mx-auto leading-relaxed font-bold">
              Your subscription has been successfully changed.
            </p>
          </div>

          {/* Bento Grid for Updates */}
          <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">

            {/* Box 1: New Plan Info (Top Left - Spans 8 cols) */}
            <div className="lg:col-span-8 group relative p-10 rounded-[32px] bg-white border-2 border-purple-600 shadow-2xl shadow-purple-900/10 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
              <div className="relative z-10 flex-1">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">Active Plan</span>

                {/* Fetched Plan Name */}
                <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-[#202124] mb-1 capitalize">
                  {displayPlanName}
                </h3>

                {/* Plan ID displayed below */}
                <p className="text-zinc-400 text-xs font-mono font-medium mb-3 mt-5">
                  ID: {planId}
                </p>

                <div className="flex items-center gap-3">
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    Active Now
                  </p>
                  <span className="text-zinc-300">|</span>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">
                    {interval}ly Cycle
                  </p>
                </div>
              </div>
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-500">
                  <Zap size={40} strokeWidth={2.5} fill="currentColor" />
                </div>
              </div>
            </div>

            {/* Box 2: Amount Paid Today (Top Right - Spans 4 cols) */}
            <div className="lg:col-span-4 group relative p-8 rounded-[32px] bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-green-200 transition-all duration-500 flex flex-col justify-center">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <Wallet size={20} strokeWidth={2.5} />
              </div>
              <p className="text-green-600 font-black text-xs uppercase tracking-widest mb-1">{prorationMessage}</p>
              <p className="text-[#202124] text-3xl font-black">
                {currencyFormatter.format(amountPaidToday)}
              </p>
              <p className="text-[#9aa0a6] text-[10px] font-bold uppercase mt-2">Billed Immediately</p>
            </div>

            {/* Box 3: Next Payment Date (Bottom Left - Spans 6 cols) */}
            <div className="lg:col-span-6 group relative p-8 rounded-[32px] bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-indigo-200 transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <CalendarDays size={20} strokeWidth={2.5} />
              </div>
              <p className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-1">Next Payment Date</p>
              {/* Displaying the formatted date */}
              <p className="text-[#202124] text-2xl font-black capitalize">{nextPaymentDate}</p>
              <p className="text-[#5f6368] text-xs font-bold mt-2 leading-relaxed">
                Your card will be automatically charged on this date.
              </p>
            </div>

            {/* Box 4: Status (Bottom Right - Spans 6 cols) */}
            <div className="lg:col-span-6 group relative p-8 rounded-[32px] bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200 transition-all duration-500 flex flex-col justify-center">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 text-zinc-600 flex items-center justify-center mb-4">
                <ShieldCheck size={20} strokeWidth={2.5} />
              </div>
              <p className="text-zinc-500 font-black text-xs uppercase tracking-widest mb-1">Status</p>
              <p className="text-[#202124] text-2xl font-black">Confirmed</p>
              <p className="text-[#5f6368] text-xs font-bold mt-2">
                Your subscription is active.
              </p>
            </div>

          </div>

          {/* Action Button */}
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#202124] text-white rounded-full font-black uppercase tracking-widest hover:bg-purple-600 hover:scale-105 transition-all duration-300 shadow-xl shadow-zinc-900/20 group"
            >
              Return to Dashboard <LayoutDashboard size={18} strokeWidth={2.5} className="group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ===========================================================================
  // SCENARIO 3: CHECKOUT SUCCESS (Standard Purchase)
  // Handles redirects with ?session_id=...
  // ===========================================================================

  // Guard: If we reached here without a session ID, redirect home
  if (!session_id) {
    redirect("/dashboard");
  }

  // 1. Fetch extended data from Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ['line_items', 'payment_intent'],
  });

  if (session.payment_status !== 'paid' && session.mode === 'payment') {
    // Redirect to error state if payment isn't strictly 'paid'
    return redirect("?error=true");
  }

  // 2. Extract Data
  const { customer_details, amount_total, currency, created, id: txId, payment_method_types } = session;
  const amount = amount_total ? amount_total / 100 : 0;

  // 3. Get Receipt URL safely
  const paymentIntent = session.payment_intent as any;
  const receiptUrl = paymentIntent?.charges?.data?.[0]?.receipt_url || null;

  // 4. Formatters
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency?.toUpperCase() || 'USD',
  });

  const dateFormatter = new Date(created * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeFormatter = new Date(created * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased relative overflow-hidden">

      <AuroraBackground />
      <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />

      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center p-6 md:p-12">

        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 border border-green-100 rounded-full shadow-sm mb-8">
            <ShieldCheck size={14} className="text-green-600" />
            <span className="text-[10px] font-bold text-green-700 tracking-widest uppercase">Payment Verified</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#202124] mb-6">
            Payment <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
              Successful.
            </span>
          </h1>
          <p className="text-lg text-[#5f6368] max-w-lg mx-auto leading-relaxed font-bold">
            We have received your payment. A confirmation email has been sent to <span className="text-[#202124] underline decoration-green-300 decoration-2 underline-offset-2">{customer_details?.email}</span>.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">

          {/* Box 1: Total Amount */}
          <div className="lg:col-span-5 group relative p-10 rounded-[32px] bg-white border-2 border-green-600 shadow-2xl shadow-green-900/10 overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-500">
                  <CheckCircle2 size={28} strokeWidth={2.5} />
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">Paid</span>
              </div>

              <div>
                <p className="text-green-600 font-black text-xs uppercase tracking-widest mb-2">Total Paid</p>
                <h3 className="text-5xl font-black tracking-tighter text-[#202124] mb-2">
                  {currencyFormatter.format(amount)}
                </h3>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  {currency}
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-green-100 mt-auto">
              <p className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                TxID: {txId.slice(-16)}
              </p>
            </div>
          </div>

          {/* Box 2: Billing Details */}
          <div className="lg:col-span-7 group relative p-8 rounded-[32px] bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200 transition-all duration-500">
            <div className="mb-6 flex items-center gap-3 pb-6 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <User size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-black text-[#202124] uppercase tracking-wide">Billing Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
              <div>
                <p className="text-[#9aa0a6] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><User size={12} /> Customer</p>
                <p className="text-[#202124] font-bold text-base">{customer_details?.name || "Guest User"}</p>
              </div>
              <div>
                <p className="text-[#9aa0a6] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><Mail size={12} /> Email Address</p>
                <p className="text-[#202124] font-bold text-base break-all">{customer_details?.email}</p>
              </div>
              <div>
                <p className="text-[#9aa0a6] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><CreditCard size={12} /> Payment Method</p>
                <p className="text-[#202124] font-bold text-base capitalize">{payment_method_types?.[0] || "Credit Card"}</p>
              </div>
              <div>
                <p className="text-[#9aa0a6] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><Clock size={12} /> Date & Time</p>
                <p className="text-[#202124] font-bold text-base">{dateFormatter} <span className="text-zinc-400 text-xs ml-1">{timeFormatter}</span></p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[#9aa0a6] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin size={12} /> Billing Address</p>
                {customer_details?.address ? (
                  <p className="text-[#202124] font-bold text-base">
                    {customer_details.address.line1}, {customer_details.address.city}, {customer_details.address.country} {customer_details.address.postal_code}
                  </p>
                ) : (
                  <p className="text-[#202124] font-bold text-base text-zinc-400 italic">No physical address provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Box 3: Order Summary */}
          <div className="lg:col-span-12 group relative p-8 rounded-[32px] bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-indigo-200 transition-all duration-500">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Package size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-black text-[#202124] uppercase tracking-wide">Order Summary</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {session.line_items?.data.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between hover:bg-zinc-50 rounded-lg px-3 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#202124] text-base">{item.description}</span>
                    <span className="text-xs text-[#5f6368] font-bold uppercase tracking-wider mt-1">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-black text-[#202124]">{currencyFormatter.format(item.amount_total / 100)}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t-2 border-dashed border-zinc-100 flex flex-col items-end gap-2">
              <div className="flex justify-between items-center w-full sm:w-1/3">
                <span className="text-[#9aa0a6] font-bold text-sm">Subtotal</span>
                <span className="text-[#202124] font-bold text-base">{currencyFormatter.format(amount)}</span>
              </div>
              <div className="flex justify-between items-center w-full sm:w-1/3 mt-2">
                <span className="text-[#202124] font-black text-lg">Total</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 font-black text-2xl">
                  {currencyFormatter.format(amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 w-full max-w-[500px]">
          <Link
            href="/dashboard"
            className="w-full flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#202124] text-white rounded-full font-black uppercase tracking-widest hover:bg-purple-600 hover:scale-105 transition-all duration-300 shadow-xl shadow-zinc-900/20 group"
          >
            Dashboard <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#202124] border-2 border-zinc-200 rounded-full font-black uppercase tracking-widest hover:border-zinc-400 hover:bg-zinc-50 transition-all duration-300"
            >
              <Download size={18} strokeWidth={3} />
              Receipt
            </a>
          )}
        </div>
      </section>
    </main>
  );
}