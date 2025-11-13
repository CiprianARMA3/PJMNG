"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";

const supabase = createClient();
const DEFAULT_AVATAR = "/default-avatar.png"; // put a default image in public folder

export default function DashboardPage() {
  const router = useRouter();
  const { user: sessionUser, loading } = useRequireAuth();

  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string | null;
    surname: string | null;
    avatar_url: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!sessionUser) return;

      const { data: userData, error } = await supabase
        .from("users")
        .select("id, email, name, surname, metadata")
        .eq("id", sessionUser.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        surname: userData.surname,
        avatar_url: userData.metadata?.avatar_url || DEFAULT_AVATAR,
      });
    };

    fetchUser();
  }, [sessionUser]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error.message);
    else router.push("/auth/login");
  };

  if (loading || !user) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="border p-4 rounded max-w-md space-y-2">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Name:</strong> {user.name || "-"}</p>
        <p><strong>Surname:</strong> {user.surname || "-"}</p>
        <p>
          <strong>Avatar:</strong>{" "}
          <img
            src={user.avatar_url}
            alt="Avatar"
            className="w-16 h-16 rounded-full"
          />
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white p-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
