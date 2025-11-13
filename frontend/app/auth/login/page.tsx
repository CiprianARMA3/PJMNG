"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import useRedirectIfAuth from "@/hooks/useRedirectIfAuth";

const supabase = createClient();

export default function LoginPage() {
  useRedirectIfAuth(); // Redirect to dashboard if already logged in

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setErrorMsg("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (!data.user) {
      setErrorMsg("No user found");
      return;
    }

    // Fetch profile to see if setup is complete
    const { data: profile } = await supabase
      .from("users")
      .select("name,surname,metadata")
      .eq("id", data.user.id)
      .single();

    if (!profile?.name || !profile?.surname) {
      router.push("/profile-setup");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2 p-2 border w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-2 p-2 border w-full"
      />
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white p-2 w-full"
      >
        Login
      </button>
      {errorMsg && <p className="mt-2 text-red-500">{errorMsg}</p>}
    </div>
  );
}
