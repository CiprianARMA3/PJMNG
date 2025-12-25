"use client";

import Link from 'next/link';
import { motion } from "framer-motion";
import { Terminal, ArrowLeft, Zap, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-6 selection:bg-purple-100 overflow-hidden relative">
      
      {/* --- BACKGROUND INFRASTRUCTURE --- */}
      <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />
      
      {/* --- FLOATING DECOR NODE --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        className="relative z-10 w-full max-w-2xl text-center"
      >
        {/* --- ERROR METADATA TAG --- */}
        <div className="flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-100 dark:border-orange-900/30 rounded-xl text-orange-600">
                <AlertTriangle size={18} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-500">
                Page Not Found
            </span>
        </div>

        {/* --- MAIN ERROR CODE --- */}
        <div className="relative inline-block mb-4">
            <h2 className="text-[150px] md:text-[220px] font-black tracking-tighter text-zinc-900 dark:text-white leading-none uppercase">
                404
            </h2>
            <div className="absolute -top-4 -right-8 p-3 bg-purple-600 text-white rounded-2xl shadow-xl shadow-purple-600/20 rotate-12">
                <Terminal size={24} strokeWidth={3} />
            </div>
        </div>

        {/* --- STATUS MESSAGE --- */}
        <div className="space-y-4 mb-12">
            <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-tight">
                Page Not Found<span className="text-purple-600">.</span>
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm md:text-base uppercase tracking-tight max-w-md mx-auto leading-relaxed">
                The requested action address returned a null response. Write the website address fully and double check it working.
            </p>
        </div>

        {/* --- ACTION REROUTE --- */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link 
                href="/"
                className="group flex items-center gap-3 px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[24px] font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl transition-all active:scale-95 hover:opacity-90"
            >
                <ArrowLeft size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                Return Home
            </Link>

            <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-[24px]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    System Core: Online
                </span>
            </div>
        </div>
      </motion.div>

      {/* --- FOOTER DEPLOYMENT VERSION --- */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30">
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-400 dark:text-zinc-600">
              KAPRYDEV
          </span>
      </div>
    </div>
  );
}