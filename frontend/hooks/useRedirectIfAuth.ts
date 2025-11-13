"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function useRedirectIfAuth(redirectTo: string = "/dashboard") {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get both session and user to be more reliable
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();

        console.log("Session check:", { session: !!session, user: !!user });
        
        // Only redirect if we have both a valid session AND user
        if (session?.user && user) {
          console.log("User is authenticated, redirecting to:", redirectTo);
          router.replace(redirectTo);
        } else {
          console.log("No valid session/user found, staying on page");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        // Don't redirect on error
      }
    };

    // Add a small delay to ensure auth state is settled
    const timer = setTimeout(() => {
      checkSession();
    }, 100);

    return () => clearTimeout(timer);
  }, [router, redirectTo]);
}