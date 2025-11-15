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

  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setErrorMsg(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setErrorMsg(error.message);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Registration Form */}
      <div className="flex-[3] flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to KapryDEV</h1>
            <p className="text-gray-600 text-sm">Your developer oriented project manager</p>
          </div>

          {/* OAuth Buttons Container */}
          <div className="space-y-4 mb-6">
            {/* Google Login Button */}
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium">Sign up with Google</span>
            </button>

            {/* GitHub Login Button */}
            <button 
              onClick={handleGitHubLogin}
              className="w-full bg-gray-800 text-white border border-gray-800 rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="font-medium">Sign up with GitHub</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="mb-6 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all pr-12"
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleRegister}
            disabled={loading || !email || !password}
            className="w-full bg-purple-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6 shadow-sm"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Sign in Link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link className="text-purple-700 font-medium hover:text-purple-900 underline" href="/auth/login">
              Sign in
            </Link>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{successMsg}</p>
            </div>
          )}
        </div>
      </div>

<div className="flex-1 hidden lg:block relative bg-gray-100">
  {/* Background Image */}
  <Image
    src="/clouds.webp"
    alt="Clouds background"
    fill
    className="object-cover blur-sm rounded-tl-2xl rounded-bl-2xl"
    priority
    sizes="(max-width: 1024px) 0vw, 25vw"
  />
  
  {/* Radial Fade Overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent 
    [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]">
  </div>
  
  {/* Logo and Text Container */}
  <div className="absolute inset-0 flex flex-col items-center justify-center">
    {/* Logo */}
    <div className="relative w-60 h-60 "> {/* Added margin-bottom */}
      <Image
        src="/logo-light.png"
        alt="KapryDEV Logo"
        fill
        className="object-contain drop-shadow-lg"
        priority
      />
    </div>
    
    {/* Text */}
    <div className="text-center">
<div className="text-center space-y-2">
  <p className="text-white text-2xl font-bold drop-shadow-lg tracking-wide">
    Built for Development Teams by Developers
  </p>
  <p className="text-white/80 text-lg font-medium tracking-wide">
    Organize your workflow efficently
  </p>
</div>
    </div>
  </div>
</div>
    </div>
  );
}