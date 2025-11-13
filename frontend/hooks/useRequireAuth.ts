"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function useRequireAuth(redirectTo: string = "/auth/login") {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get both session and user for more reliable check
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();

        console.log("Auth check:", { session: !!session, user: !!user });

        if (!session?.user || !user) {
          console.log("No valid auth, redirecting to login");
          router.replace(redirectTo);
        } else {
          console.log("User authenticated:", user.id);
          setUser(user);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        // On error, redirect to login for safety
        router.replace(redirectTo);
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure auth state is settled
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [router, redirectTo]);

  return { user, loading };
}