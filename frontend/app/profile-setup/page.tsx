"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import AvatarUpload from "../components/AvatarUpload";
import useRequireAuth from "@/hooks/useRequireAuth";

const supabase = createClient();
const DEFAULT_AVATAR = "/default-avatar.png"; // fallback avatar

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user: sessionUser, loading: authLoading } = useRequireAuth();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Check if profile is already complete
  useEffect(() => {
    if (!sessionUser) return;

    const checkProfile = async () => {
      const { data: userData, error } = await supabase
        .from("users")
        .select("name,surname")
        .eq("id", sessionUser.id)
        .single();

      if (error) {
        console.error("Error checking profile:", error.message);
        return;
      }

      if (userData?.name && userData?.surname) {
        // Profile already set -> redirect to dashboard
        router.replace("/dashboard");
      }
    };

    checkProfile();
  }, [sessionUser, router]);

  const handleSaveProfile = async () => {
    if (!sessionUser) return;
    setLoading(true);
    setErrorMsg("");

    try {
      let avatarUrl: string | null = null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${sessionUser.id}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        avatarUrl = publicData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          name,
          surname,
          metadata: { avatar_url: avatarUrl || DEFAULT_AVATAR },
        })
        .eq("id", sessionUser.id);

      if (updateError) throw updateError;

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Profile setup error:", err.message);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Set Up Your Profile</h1>
      <input
        type="text"
        placeholder="First Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-2 p-2 border w-full"
      />
      <input
        type="text"
        placeholder="Surname"
        value={surname}
        onChange={(e) => setSurname(e.target.value)}
        className="mb-2 p-2 border w-full"
      />
      <AvatarUpload onFileSelect={setAvatarFile} />
      {errorMsg && <p className="text-red-500 my-2">{errorMsg}</p>}
      <button
        onClick={handleSaveProfile}
        disabled={loading}
        className="bg-blue-500 text-white p-2 w-full mt-2 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
