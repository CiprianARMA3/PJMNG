'use client';

import Link from "next/link";
import { 
  XCircle, 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle,
  HelpCircle,
  CreditCard
} from "lucide-react";
import AuroraBackground from "@/app/components/AuroraBackground"; 

export default function PaymentRejectedPage() {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-red-100 selection:text-red-900 scroll-smooth antialiased relative overflow-hidden">
      
      {/* Background Elements */}
      <AuroraBackground />
      <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />

      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center p-6">
        
        {/* Failure Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 border border-red-100 rounded-full shadow-sm mb-8">
            <AlertTriangle size={14} className="text-red-600" />
            <span className="text-[10px] font-bold text-red-700 tracking-widest uppercase">Transaction Failed</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#202124] mb-6">
            Payment <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
              Declined.
            </span>
          </h1>
          <p className="text-xl text-[#5f6368] max-w-lg mx-auto leading-relaxed font-bold">
            We couldn't process your transaction. No charges were applied to your account.
          </p>
        </div>

        {/* Bento Grid Error Info */}
        <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          
          {/* Main Error Card */}
          <div className="group relative p-10 rounded-[40px] bg-white border-2 border-red-600 shadow-2xl shadow-red-900/10 md:col-span-2 overflow-hidden">
             <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
             
             <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                        <XCircle size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-red-600 font-black text-sm uppercase tracking-widest mb-1">Status</p>
                        <h3 className="text-3xl font-black tracking-tighter text-[#202124]">
                            Processing Error
                        </h3>
                    </div>
                </div>

                <div className="w-full md:w-auto p-4 bg-red-50 border border-red-100 rounded-2xl">
                     <p className="text-red-800 text-sm font-bold leading-relaxed max-w-xs">
                        This is usually due to insufficient funds, bank restrictions, or incorrect card details.
                     </p>
                </div>
             </div>
          </div>

          {/* Action: Retry */}
          <Link href="/dashboard" className="group relative p-8 rounded-[40px] bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200 transition-all duration-500 cursor-pointer">
             <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-all duration-500">
                    <RefreshCw size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black tracking-tighter text-[#202124] mb-2">Try Again</h3>
                <p className="text-zinc-500 font-bold text-sm leading-relaxed mb-8 flex-grow">
                    Restart the checkout process with a different payment method.
                </p>
                <div className="flex items-center gap-2 text-sm font-black text-purple-600 uppercase tracking-widest border-b-2 border-purple-100 pb-1 w-max group-hover:border-purple-600 transition-all">
                    Retry Payment <ArrowLeft size={16} strokeWidth={3} className="rotate-180" />
                </div>
             </div>
          </Link>

          {/* Action: Support */}
          <Link href="/home/contact" className="group relative p-8 rounded-[40px] bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-zinc-300 transition-all duration-500 cursor-pointer">
             <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-all duration-500">
                    <HelpCircle size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black tracking-tighter text-[#202124] mb-2">Need Help?</h3>
                <p className="text-zinc-500 font-bold text-sm leading-relaxed mb-8 flex-grow">
                    If this error persists, contact our billing support team for assistance.
                </p>
                <div className="flex items-center gap-2 text-sm font-black text-[#202124] uppercase tracking-widest border-b-2 border-zinc-100 pb-1 w-max group-hover:border-[#202124] transition-all">
                    Contact Support
                </div>
             </div>
          </Link>

        </div>

        {/* Footer Action */}
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <Link 
                href="/dashboard"
                className="inline-flex items-center gap-3 text-zinc-400 hover:text-zinc-900 transition-colors font-bold uppercase tracking-widest text-sm"
            >
                <ArrowLeft size={16} strokeWidth={3} /> Return to Dashboard
            </Link>
        </div>

      </section>
    </main>
  );
}