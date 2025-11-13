"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function useRedirectIfAuth() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuthAndProfile = async () => {
      try {
        // Use getUser() which is more reliable
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;

        if (error) {
          console.error("Auth error:", error);
          setChecked(true);
          return;
        }

        if (user) {
          console.log("User authenticated:", user.id);
          
          // Check if profile is complete
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("name, surname")
            .eq("auth_id", user.id)
            .single();

          if (profileError) {
            console.error("Profile check error:", profileError);
            // If no profile exists, redirect to setup
            router.replace("/profile-setup");
            return;
          }

          if (!profile?.name || !profile?.surname) {
            console.log("Profile incomplete, redirecting to profile-setup");
            router.replace("/profile-setup");
          } else {
            console.log("Profile complete, redirecting to dashboard");
            router.replace("/dashboard");
          }
        } else {
          console.log("No user found, staying on auth page");
          setChecked(true);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setChecked(true);
      }
    };

    // Add a delay to ensure auth state is settled
    const timer = setTimeout(() => {
      checkAuthAndProfile();
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [router]);

  return checked;
}