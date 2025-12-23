"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Terminal,
  Zap
} from "lucide-react";
import AuroraBackground from "@/app/components/AuroraBackground";
import { motion } from "framer-motion";

const supabase = createClient();

export default function ConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Initializing protocol...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmailAndUpdateUser = async () => {
      const url = new URL(window.location.href);
      const access_token = url.searchParams.get("access_token");
      const refresh_token = url.searchParams.get("refresh_token");
      const type = url.searchParams.get("type");

      if (type !== "signup") {
        setMessage("Session type mismatch. Protocol closed.");
        setLoading(false);
        return;
      }

      if (!access_token || !refresh_token) {
        setMessage("Invalid verification token.");
        setLoading(false);
        return;
      }

      try {
        setMessage("Syncing identity with core...");
        const { data: { user }, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          setError("Handshake failed. Protocol requires manual sign-in.");
          setLoading(false);
          return;
        }

        if (user) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ 
              email_verified: true,
              updated_at: new Date().toISOString()
            })
            .eq("auth_id", user.id);

          if (updateError) console.error("Update error:", updateError);
        }

        await supabase.auth.signOut();
        setMessage("Authentication handshake complete.");
        setLoading(false);

      } catch (err: any) {
        setError("Inbound protocol error. Please try signing in manually.");
        setLoading(false);
      }
    };

    verifyEmailAndUpdateUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans selection:bg-purple-100 p-6">
      <AuroraBackground />
      <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
      
      {/* VERIFICATION TERMINAL CARD */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-[480px] bg-white border-2 border-zinc-100 rounded-[40px] shadow-2xl shadow-zinc-200/50 p-10 sm:p-12 z-20 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] pointer-events-none" />
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex flex-col leading-none text-zinc-900 mb-2">
            <span className="text-5xl font-normal tracking-tight">KAPR<span className="text-purple-600">Y</span></span>
            <span className="text-4xl font-black tracking-tighter -mt-1">DEV</span>
          </div>          
        </div>

        {/* DYNAMIC CONTENT AREA */}
        <div className="relative z-10">
          
          {/* 1. LOADING STATE */}
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-8 py-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-zinc-50 rounded-full"></div>
                <Loader2 className="absolute top-0 left-0 w-20 h-20 text-purple-600 animate-spin" strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black tracking-tighter text-zinc-900 uppercase">Verifying Node...</h3>
                <p className="text-zinc-400 font-bold text-sm mt-2 tracking-tight">{message}</p>
              </div>
            </div>
          )}

          {/* 2. ERROR STATE */}
          {!loading && error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center space-y-8">
              <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center shadow-inner">
                <AlertCircle className="text-red-600" size={40} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black tracking-tighter text-zinc-900 uppercase">Protocol Error</h3>
                <p className="text-red-500 font-bold text-sm mt-3 bg-red-50/50 px-4 py-2 rounded-xl border border-red-100">{error}</p>
              </div>
              <Link href="/auth/login" className="w-full">
                <button className="w-full bg-zinc-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                  <ArrowLeft size={16} strokeWidth={3} /> Return to Login
                </button>
              </Link>
            </motion.div>
          )}

          {/* 3. SUCCESS STATE */}
          {!loading && !error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-[24px] flex items-center justify-center shadow-inner">
                 <CheckCircle2 className="text-emerald-600" size={40} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black tracking-tighter text-zinc-900 uppercase leading-none">Identity Verified</h3>
                <p className="text-zinc-400 font-bold text-sm mt-3 tracking-tight max-w-[280px] mx-auto leading-relaxed">
                  Handshake successful. Your account is now active on the Kapry network.
                </p>
              </div>
              
              <div className="w-full space-y-4">
                <Link href="/auth/login" className="block w-full">
                  <button className="w-full bg-purple-600 text-white font-black py-5 rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-2 group">
                    Login page <Zap size={14} className="fill-white group-hover:scale-125 transition-transform" />
                  </button>
                </Link>
                <Link href="/" className="block w-full text-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer">Return to Home Page</span>
                </Link>
              </div>
            </motion.div>
          )}

        </div>
        
        {/* Footer Audit Area */}
        <div className="pt-10 mt-10 border-t-2 border-zinc-50 flex flex-col items-center">
          <div className="flex items-center gap-2 text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4">
             <ShieldCheck size={12} strokeWidth={3} /> Secured Protocol
          </div>
          <div className="flex justify-center gap-8 opacity-20 grayscale scale-90">
             <Terminal size={20} />
             <Zap size={20} />
             <Activity size={20} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Simple Activity Icon Import
const Activity = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);