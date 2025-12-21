"use client";

import React, { use } from "react";
import { X, RefreshCcw, HelpCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PaymentFailedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#0C0C0E] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-xl animate-in fade-in zoom-in duration-500">
        
        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-500/20 shadow-sm dark:shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
          <X size={40} className="text-red-600 dark:text-red-500" strokeWidth={3} />
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Payment Failed</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          We couldn't process your payment. No charges were made. This could be due to insufficient funds or card verification failure.
        </p>

        <div className="space-y-3">
          <Link 
            href={`/dashboard/projects/${projectId}/payments`}
            className="block w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-black dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} />
            Try Again
          </Link>

          <Link 
            href="mailto:support@kapry.dev"
            className="block w-full py-3 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            <HelpCircle size={18} />
            Contact Support
          </Link>
        </div>

        <div className="mt-6">
             <Link 
                href={`/dashboard/projects/${projectId}`}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center justify-center gap-1 transition-colors"
            >
                <ArrowLeft size={12} /> Back to Dashboard
            </Link>
        </div>
      </div>
    </div>
  );
}