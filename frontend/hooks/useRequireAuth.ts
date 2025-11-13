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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace(redirectTo); // Not logged in → redirect
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router, redirectTo]);

  return { user, loading };
}
