"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const supabase = createClient();

export default function ConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your email...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmailAndUpdateUser = async () => {
      const url = new URL(window.location.href);
      const access_token = url.searchParams.get("access_token");
      const refresh_token = url.searchParams.get("refresh_token");
      const type = url.searchParams.get("type");

      // Only process email verification type
      if (type !== "signup") {
        setMessage("You can close this page.");
        setLoading(false);
        return;
      }

      if (!access_token || !refresh_token) {
        setMessage("Invalid verification link.");
        setLoading(false);
        return;
      }

      try {
        // Set temporary session to get user info
        const { data: { user }, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          console.error("Failed to set session:", sessionError);
          setError("Verification failed. Please try signing in.");
          setLoading(false);
          return;
        }

        if (user) {
          // Update user profile to mark as verified
          const { error: updateError } = await supabase
            .from("users")
            .update({ 
              email_verified: true,
              updated_at: new Date().toISOString()
            })
            .eq("auth_id", user.id);

          if (updateError) {
            console.error("Failed to update user:", updateError);
          }
        }

        // 🔥 IMPORTANT: Sign out immediately after verification
        await supabase.auth.signOut();

        setMessage("Email verified successfully!");
        setLoading(false);

      } catch (err: any) {
        console.error("Verification error:", err);
        setError("An error occurred during verification. Please try signing in.");
        setLoading(false);
      }
    };

    verifyEmailAndUpdateUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      
      {/* Centered Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 relative overflow-hidden">
        
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex flex-col leading-none text-gray-900 mb-2">
            <span className="text-5xl font-normal tracking-wide">
              KAPR<span className="text-purple-600 font-normal">Y</span>
            </span>
            <span className="text-4xl font-black tracking-tight -mt-1">
              DEV
            </span>
          </div>          
        </div>

        {/* DYNAMIC CONTENT AREA */}
        <div className="text-center">
          
          {/* 1. Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-6 py-4">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Verifying...</h3>
                <p className="text-gray-500 mt-2">{message}</p>
              </div>
            </div>
          )}

          {/* 2. Error State */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Verification Failed</h3>
                <p className="text-red-600 mt-2 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
              </div>
              <Link
                href="/auth/login"
                className="w-full bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-black transition-colors shadow-sm"
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {/* 3. Success State */}
          {!loading && !error && (
            <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                 <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Successfully Verified!</h3>
                <p className="text-gray-500 mt-2">
                  Your email has been verified. You can now sign in to your account.
                </p>
              </div>
              
              <div className="w-full space-y-3">
                <Link
                  href="/auth/login"
                  className="block w-full bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-black transition-colors shadow-sm"
                >
                  Sign In Now
                </Link>
                <Link
                  href="/"
                  className="block w-full bg-white text-gray-700 border border-gray-200 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Return to Home
                </Link>
              </div>

              {/* <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 p-3 rounded-lg mt-4 w-full">
                <strong>Note:</strong> You have been signed out automatically. Please sign in to continue.
              </div> */}
            </div>
          )}

        </div>
        
        {/* Footer Logos Area */}
        <div className="pt-8 mt-8 border-t border-gray-100">
          <p className="text-center text-xs text-gray-400 font-semibold mb-4 uppercase tracking-wider">Trusted by developers at</p>
          <div className="flex justify-center gap-6 opacity-40 grayscale">
            <div className="flex items-center gap-1 font-bold text-lg text-black">X</div>
            <div className="flex items-center gap-1 font-bold text-lg text-black">Y</div>
            <div className="flex items-center gap-1 font-bold text-lg text-black">Z</div>
          </div>
        </div>

      </div>
    </div>
  );
}