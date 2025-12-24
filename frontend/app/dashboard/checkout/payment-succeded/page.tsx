import { redirect } from "next/navigation";
import Link from "next/link";
import { stripe } from "@/utils/stripe/server";
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
  Clock
} from "lucide-react";
import AuroraBackground from "@/app/components/AuroraBackground"; 

interface PageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function PaymentSucceededPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect("/dashboard");
  }

  // 1. Fetch extended data
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });

  if (session.payment_status !== 'paid' && session.mode === 'payment') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-[#202124]">
        <p className="text-xl font-bold">Payment verification is pending or failed.</p>
      </div>
    );
  }

  // 2. Extract Data
  const { customer_details, amount_total, currency, created, id, payment_method_types } = session;
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
      
      {/* --- Background Elements --- */}
      <AuroraBackground />
      <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />

      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
        
        {/* --- Header Section --- */}
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

        {/* --- Bento Grid Layout --- */}
        <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          
          {/* ==========================================
              BOX 1: TOTAL AMOUNT (Left Side)
          ========================================== */}
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
                    TxID: {id.slice(-16)}
                 </p>
             </div>
          </div>

          {/* ==========================================
              BOX 2: BILLING DETAILS (Right Side)
          ========================================== */}
          <div className="lg:col-span-7 group relative p-8 rounded-[32px] bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200 transition-all duration-500">
             <div className="mb-6 flex items-center gap-3 pb-6 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <User size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-[#202124] uppercase tracking-wide">Billing Details</h3>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
                
                {/* Detail: Customer Name */}
                <div>
                   <p className="text-[#9aa0a6] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                      <User size={12} /> Customer
                   </p>
                   <p className="text-[#202124] font-bold text-base">{customer_details?.name || "Guest User"}</p>
                </div>

                {/* Detail: Email */}
                <div>
                   <p className="text-[#9aa0a6] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Mail size={12} /> Email Address
                   </p>
                   <p className="text-[#202124] font-bold text-base break-all">{customer_details?.email}</p>
                </div>

                {/* Detail: Payment Method */}
                <div>
                   <p className="text-[#9aa0a6] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                      <CreditCard size={12} /> Payment Method
                   </p>
                   <p className="text-[#202124] font-bold text-base capitalize">
                      {payment_method_types?.[0] || "Credit Card"}
                   </p>
                </div>

                {/* Detail: Date */}
                <div>
                   <p className="text-[#9aa0a6] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Clock size={12} /> Date & Time
                   </p>
                   <p className="text-[#202124] font-bold text-base">
                      {dateFormatter} <span className="text-zinc-400 text-xs ml-1">{timeFormatter}</span>
                   </p>
                </div>

                {/* Detail: Address */}
                <div className="sm:col-span-2">
                   <p className="text-[#9aa0a6] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MapPin size={12} /> Billing Address
                   </p>
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

          {/* ==========================================
              BOX 3: ORDER SUMMARY (Full Width)
          ========================================== */}
          <div className="lg:col-span-12 group relative p-8 rounded-[32px] bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-indigo-200 transition-all duration-500">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Package size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-[#202124] uppercase tracking-wide">Order Summary</h3>
             </div>

             {/* Line Items */}
             <div className="divide-y divide-zinc-100">
                {session.line_items?.data.map((item) => (
                    <div key={item.id} className="py-4 flex items-center justify-between hover:bg-zinc-50 rounded-lg px-3 transition-colors">
                        <div className="flex flex-col">
                            <span className="font-bold text-[#202124] text-base">{item.description}</span>
                            <span className="text-xs text-[#5f6368] font-bold uppercase tracking-wider mt-1">
                                Qty: {item.quantity}
                            </span>
                        </div>
                        <span className="font-black text-[#202124]">
                            {currencyFormatter.format(item.amount_total / 100)}
                        </span>
                    </div>
                ))}
             </div>

             {/* TOTAL SUMMARY FOOTER */}
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

        {/* --- Action Buttons --- */}
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