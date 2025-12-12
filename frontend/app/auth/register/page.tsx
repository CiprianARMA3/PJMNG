"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import useRedirectIfAuth from "@/hooks/useRedirectIfAuth";
import Image from "next/image";
import Link from "next/link";

const supabase = createClient();

export default function RegisterPage() {
  useRedirectIfAuth(); // redirect if logged in

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      // 1️⃣ Check users table for existing profile
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

      // 2️⃣ Sign up via Supabase Auth
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
        // Create user profile in database but don't log them in
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

        setSuccessMsg("Check your email to confirm your account! After verification, you'll need to sign in manually.");
        // Reset form
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
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      
      {/* LEFT SIDE - Visuals & Branding */}
      <div className="hidden lg:flex flex-1 relative bg-black text-white overflow-hidden flex-col justify-end p-12">
        
        {/* Abstract Background Elements - UPDATED with Purple Tint */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/20 to-black z-0"></div>
        
        {/* Floating Code Card Effect */}
        <div className="absolute top-20 left-10 w-[120%] opacity-90 transform -rotate-6 skew-y-3 z-10 pointer-events-none">
          <div className="bg-[#0d1117] border border-gray-700 rounded-xl p-6 shadow-2xl text-xs md:text-sm font-mono text-gray-300">
            <div className="flex gap-2 mb-4">
               <div className="w-3 h-3 rounded-full bg-red-500"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
               <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <p><span className="text-purple-400">import</span> OpenAI <span className="text-purple-400">from</span> <span className="text-green-400">'openai'</span>;</p>
            <p className="mt-2"><span className="text-blue-400">const</span> openai = <span className="text-blue-400">new</span> <span className="text-yellow-400">OpenAI</span>({`{`}</p>
            <p className="pl-4">apiKey: <span className="text-green-400">"YOUR_API_KEY"</span>,</p>
            <p className="pl-4">baseURL: <span className="text-green-400">"https://api.kaprydev.com/v1"</span>,</p>
            <p className="pl-4">dangerouslyAllowBrowser: <span className="text-blue-400">true</span></p>
            <p>{`});`}</p>
            <p className="mt-4"><span className="text-blue-400">const</span> completion = <span className="text-purple-400">await</span> openai.chat.completions.<span className="text-yellow-400">create</span>({`{`}</p>
            <p className="pl-4">messages: [{`{`} role: <span className="text-green-400">"system"</span>, content: <span className="text-green-400">"You are a helpful assistant."</span> {`}`}],</p>
            <p className="pl-4">model: <span className="text-green-400">"gpt-4-turbo"</span>,</p>
            <p>{`});`}</p>
            <div className="mt-4 text-gray-500">// Initialize powerful AI features instantly</div>
          </div>
        </div>

        {/* Text Content */}
        <div className="relative z-20 mt-auto mb-10">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Join the Developer<br />
            Revolution
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Start building with Text-to-Image, Text-to-Video, Music Generation, 
            Voice, and advanced Vision models today.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Registration Form */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        
        {/* --- ADDED: GO BACK LINK --- */}
        <Link 
          href="/" 
          className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors z-50 group"
        >
          <svg 
            className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
        {/* --------------------------- */}

        <div className="w-full max-w-md space-y-6">
          
          {/* Logo Area */}
          <div className="flex flex-col items-center mb-4">
            <div className="flex flex-col leading-none text-gray-900 mb-2">
              <span className="text-6xl font-normal tracking-wide">
                KAPR<span className="text-purple-600 font-normal">Y</span>
              </span>
              <span className="text-5xl font-black tracking-tight -mt-1">
                DEV
              </span>
            </div>          
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center shadow-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg text-center shadow-sm">
              {successMsg}
            </div>
          )}

          {/* Social Logins */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all shadow-sm"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Sign up with Google
            </button>
            <button
              onClick={() => handleOAuthLogin('github')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all shadow-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Sign up with GitHub
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400">Or register with email</span>
            </div>
          </div>

          {/* Tab Switcher - 'Sign Up' active */}
          <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
            <Link 
              href="/auth/login" 
              className="flex-1 text-gray-500 py-2 rounded-lg text-sm font-medium text-center hover:text-gray-700 transition-all"
            >
              Sign In
            </Link>
            <button className="flex-1 bg-white shadow-sm text-gray-900 py-2 rounded-lg text-sm font-semibold transition-all">
              Sign Up
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            <button
              onClick={handleRegister}
              disabled={loading || !email || !password}
              className="w-full bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          {/* Footer Logos Area */}
          <div className="pt-8 mt-4 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400 font-semibold mb-4 uppercase tracking-wider">Trusted by developers at</p>
            <div className="flex justify-center gap-6 opacity-40 grayscale">
              <div className="flex items-center gap-1 font-bold text-lg text-black">X</div>
              <div className="flex items-center gap-1 font-bold text-lg text-black">Y</div>
              <div className="flex items-center gap-1 font-bold text-lg text-black">Z</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}