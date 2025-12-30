"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import useRedirectIfAuth from "@/hooks/useRedirectIfAuth";
import Link from "next/link";
import { 
  ArrowLeft, 
  Github, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Terminal, 
  Chrome, 
  UserPlus,
  Sparkles,
  ShieldCheck,
  Zap,
  Check
} from "lucide-react";
import AuroraBackground from "@/app/components/AuroraBackground";
import { motion } from "framer-motion";

const supabase = createClient();

export default function RegisterPage() {
  useRedirectIfAuth(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // NEW STATES FOR CONSENT
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToCookies, setAgreedToCookies] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // --- PRESERVED BACKEND LOGIC ---
  const handleRegister = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        setErrorMsg("This email already has a profile.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user) {
        const { error: dbError } = await supabase
          .from("users")
          .insert({
            auth_id: data.user.id,
            email: data.user.email,
            name: null,
            surname: null,
            plan_id: null,
            active: true,
            email_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            password_hash: 'supabase_auth_managed',
            metadata: {},
          });

        if (dbError && !dbError.message.includes('duplicate key')) {
          console.error('Database error:', dbError);
        }

        setSuccessMsg("Check your email to confirm your account!");
        setEmail("");
        setPassword("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) setErrorMsg(error.message);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-purple-100">
      
      {/* LEFT SIDE - Narrower Visual Branding (lg:w-[35%]) */}
      <div className="hidden lg:flex lg:w-[35%] relative bg-zinc-50 overflow-hidden flex-col justify-center p-12 border-r-2 border-zinc-100">
        <AuroraBackground />
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
        
        <div className="relative z-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl xl:text-5xl font-black tracking-tighter text-zinc-900 leading-[0.95] mb-6">
              Join the developer <br /> 
              <span className="text-purple-600">revolution.</span>
            </h2>
            <p className="text-zinc-500 text-base font-bold max-w-xs leading-relaxed">
              Deploy your account today and gain immediate access to our specialized AI implementations.
            </p>
          </motion.div>

          <div className="pt-8 flex flex-wrap gap-4 opacity-30 grayscale scale-90 origin-left">
            {/* <Sparkles size={28} />
            <Terminal size={28} />
            <ShieldCheck size={28} /> */}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Larger Form Area */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 relative overflow-y-auto">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] pointer-events-none" />
        
        <Link 
          href="/" 
          className="absolute top-10 left-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-purple-600 transition-all group z-50"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" strokeWidth={3} />
          Return to Home
        </Link>

        <div className="w-full max-w-[420px] space-y-8 relative z-10 py-12">
          
          <div className="flex flex-col items-start">
            <div className="flex flex-col leading-none text-zinc-900">
              <span className="text-5xl font-normal tracking-tight">KAPR<span className="text-purple-600">Y</span></span>
              <span className="text-4xl font-black tracking-tighter -mt-1">DEV</span>
            </div>          
          </div>

          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border-2 border-red-100 text-red-600 text-[13px] font-bold rounded-2xl text-center shadow-sm"
            >
              {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 text-[13px] font-bold rounded-2xl text-center shadow-sm"
            >
              {successMsg}
            </motion.div>
          )}

{/* <div className="flex flex-col gap-3 w-full max-w-md mx-auto"> 
  <button
    onClick={() => handleOAuthLogin('google')}
    disabled={loading}
    className="flex w-full items-center justify-center gap-3 px-4 py-4 border-2 border-zinc-100 rounded-[20px] text-[#1f1f1f] font-black text-[12px] uppercase tracking-widest transition-all shadow-xl hover:bg-zinc-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div className="flex h-[18px] w-[18px] items-center justify-center bg-white">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="block">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
      </svg>
    </div>
    <span>{loading ? 'Loading...' : 'Sign up with Google'}</span>
  </button>

  <button
    onClick={() => handleOAuthLogin('github')}
    disabled={loading}
    className="flex w-full items-center justify-center gap-3 px-4 py-4 bg-[#202124] text-white rounded-[20px] font-black text-[12px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
  >
    <Github size={18} strokeWidth={2.5} /> 
    <span>{loading ? 'Loading...' : 'Sign up with Github'}</span>
  </button>
<p className="mt-2 flex justify-center text-[10px] font-semibold uppercase tracking-[1px] text-zinc-400">
    Secure Authentication by Supabase
  </p>
  </div> */}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-zinc-50"></div></div>
            <div className="relative flex justify-center text-[10px]"><span className="px-4 bg-white text-zinc-400 font-black uppercase tracking-widest">New Profile Registration</span></div>
          </div>

          <div className="bg-zinc-50 p-1.5 rounded-2xl flex border-2 border-zinc-100">
            <Link 
              href="/auth/login" 
              className="flex-1 text-zinc-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:text-zinc-900 transition-all"
            >
              Sign In
            </Link>
            <div className="flex-1 bg-white shadow-md text-zinc-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border border-zinc-100">
              Sign Up
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-purple-600 transition-colors" size={18} strokeWidth={2.5} />
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:bg-white focus:border-purple-600 text-sm font-bold placeholder:text-zinc-300 outline-none transition-all"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-purple-600 transition-colors" size={18} strokeWidth={2.5} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="CREATE SECURITY KEY"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-12 pr-12 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:bg-white focus:border-purple-600 text-sm font-bold placeholder:text-zinc-300 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-900 transition-colors"
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
              </button>
            </div>

            {/* ADHERENCE BOXES SECTION */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={agreedToTerms}
                    onChange={() => setAgreedToTerms(!agreedToTerms)}
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${agreedToTerms ? 'bg-purple-600 border-purple-600 shadow-lg shadow-purple-200' : 'border-zinc-200 bg-zinc-50 group-hover:border-zinc-300'}`}>
                    {agreedToTerms && <Check size={12} className="text-white" strokeWidth={4} />}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-zinc-500 leading-tight">
                  I adhere to the <Link href="/home/legal/tos" className="text-purple-600 font-black hover:underline">Terms of Service</Link> and Security standards.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={agreedToCookies}
                    onChange={() => setAgreedToCookies(!agreedToCookies)}
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${agreedToCookies ? 'bg-purple-600 border-purple-600 shadow-lg shadow-purple-200' : 'border-zinc-200 bg-zinc-50 group-hover:border-zinc-300'}`}>
                    {agreedToCookies && <Check size={12} className="text-white" strokeWidth={4} />}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-zinc-500 leading-tight mb-5">
                  I adhere to the <Link href="/home/legal/privacy-policy" className="text-purple-600 font-black hover:underline">  Privacy Policy</Link> for session management.
                </span>
              </label>
            </div>
            
            <button
              onClick={handleRegister}
              // UPDATED DISABLED LOGIC: Must agree to both
              disabled={loading || !email || !password || !agreedToTerms || !agreedToCookies}
              className="group w-full bg-[#202124] text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-2"
            >
              {loading ? "Initializing..." : "Deploy Account"}
              {!loading && <UserPlus size={14} className="fill-white" />}
            </button>
          </div>

          <div className="text-center text-[10px] font-bold text-zinc-400">
             Ensuring compliance with GDPR and high-level encryption standards.
          </div>
        </div>
      </div>
    </div>
  );
}