"use client";

import React from "react";
import { Lock, CreditCard, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function MissingSubscriptionPage() {
  return (
    <div className="min-h-screen bg-[#09090b] light:bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#0C0C0E] light:bg-white border border-red-900/30 light:border-red-200 rounded-2xl p-8 text-center shadow-2xl light:shadow-lg relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <Lock size={32} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-white light:text-black mb-2">Subscription Required</h1>
        <p className="text-zinc-400 light:text-zinc-600 mb-6">
          Your project access has been suspended because the associated subscription is inactive or past due.
        </p>

        <div className="bg-red-950/20 light:bg-red-50 border border-red-900/50 light:border-red-200 rounded-lg p-4 mb-8 text-left flex gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-red-200/80 light:text-red-800/80">
            <span className="font-bold text-red-200 light:text-red-800">Warning:</span> If the subscription is not renewed within <strong>15 days</strong> of expiration, this project and its data may be permanently deleted.
          </div>
        </div>

        <div className="space-y-3">
          {/* <Link 
            href="/dashboard/" // Adjust to your pricing page route
            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard size={18} />
            Renew Subscription
          </Link>

          <Link 
            href="/dashboard"
            className="w-full py-3 bg-transparent text-zinc-500 hover:text-zinc-300 font-medium text-sm transition-colors"
          >
            Back to Dashboard
          </Link> */}
        </div>
      </div>
    </div>
  );
}