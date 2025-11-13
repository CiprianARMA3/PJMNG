"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function ConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    const verifyEmail = async () => {
      const url = new URL(window.location.href);
      const access_token = url.searchParams.get("access_token");
      const refresh_token = url.searchParams.get("refresh_token");

      if (!access_token || !refresh_token) {
        setMessage("You can close the page.");
        return;
      }

      // Set the session properly
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        console.error("Failed to set session:", error);
        setMessage("Verification failed.");
        return;
      }

      setMessage("Email verified! Redirecting...");

      router.push("/profile-setup");
    };

    verifyEmail();
  }, [router]);

  return <div className="p-6">{message}</div>;
}
