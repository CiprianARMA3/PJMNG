"use client";

import { Terminal, Zap, ShieldCheck } from "lucide-react";
import PricingInterface from "../../../components/subscriptionFolder/subscriptionsBoxes";
import { motion } from "framer-motion";

export default function QuickActionsSection() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- HEADER CLUSTER --- */}
      <header className="mb-16 relative">
        <div className="flex items-center gap-2 mb-4">
          <Terminal size={14} className="text-purple-600 dark:text-purple-400" strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
            Infrastructure / Account Nodes
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 dark:text-white leading-[0.95] uppercase">
          Billing <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
            & Subscriptions.
          </span>
        </h1>

        <div className="mt-8 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Secured by Stripe
                </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Encrypted Session
                </span>
            </div>
        </div>
      </header>

      {/* --- PRICING MATRIX --- */}
      <section className="relative z-10">
        <PricingInterface />
      </section>
    </div>
  );
}