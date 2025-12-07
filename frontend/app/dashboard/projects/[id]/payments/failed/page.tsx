"use client";

import React, { use } from "react";
import { X, RefreshCcw, HelpCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PaymentFailedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0C0C0E] border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
          <X size={40} className="text-red-500" strokeWidth={3} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
        <p className="text-zinc-400 mb-8">
          We couldn't process your payment. No charges were made. This could be due to insufficient funds or card verification failure.
        </p>

        <div className="space-y-3">
          <Link 
            href={`/dashboard/projects/${projectId}/payments`}
            className="block w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} />
            Try Again
          </Link>

          <Link 
            href="mailto:support@example.com"
            className="block w-full py-3 bg-zinc-900 text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            <HelpCircle size={18} />
            Contact Support
          </Link>
        </div>

        <div className="mt-6">
             <Link 
                href={`/dashboard/projects/${projectId}`}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1"
            >
                <ArrowLeft size={12} /> Back to Dashboard
            </Link>
        </div>
      </div>
    </div>
  );
}