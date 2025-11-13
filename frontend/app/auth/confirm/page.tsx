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
            // Continue anyway - the email is verified in Auth
          }

          console.log("✅ Email verified for user:", user.id);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700">{message}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Verification Failed</h3>
          <p className="text-red-700 text-sm mb-6">{error}</p>
          <Link
            href="/auth/login"
            className="inline-block bg-red-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-green-900 mb-2">Successfully Verified!</h3>
        <p className="text-green-700 text-sm mb-6">
          Your email has been verified. You can now sign in to your account.
        </p>
        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full bg-purple-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-900 transition-colors"
          >
            Sign In Now
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            <strong>Note:</strong> You have been signed out automatically. Please sign in to access your account.
          </p>
        </div>
      </div>
    </div>
  );
}