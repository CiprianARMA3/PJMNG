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
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Check if profile is already complete
  useEffect(() => {
    if (!sessionUser) return;

    const checkProfile = async () => {
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("name, surname")
          .eq("id", sessionUser.id) // Use 'id' instead of 'auth_id'
          .single();

        if (error) {
          console.error("Error checking profile:", error.message);
          setIsCheckingProfile(false);
          return;
        }

        if (userData?.name && userData?.surname) {
          // Profile already set -> redirect to dashboard
          console.log("Profile is complete, redirecting to dashboard");
          router.replace("/dashboard");
        } else {
          // Profile incomplete -> stay on this page
          setIsCheckingProfile(false);
        }
      } catch (err) {
        console.error("Error in checkProfile:", err);
        setIsCheckingProfile(false);
      }
    };

    checkProfile();
  }, [sessionUser, router]);

  const handleSaveProfile = async () => {
    if (!sessionUser) return;
    
    if (!name.trim() || !surname.trim()) {
      setErrorMsg("Please fill in both name and surname.");
      return;
    }

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

      // First, let's check what columns actually exist in the users table
      console.log("Updating user profile for user ID:", sessionUser.id);
      
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          surname: surname.trim(),
          metadata: { avatar_url: avatarUrl || DEFAULT_AVATAR },
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionUser.id); // Use 'id' instead of 'auth_id'

      if (updateError) {
        console.error("Update error details:", updateError);
        throw updateError;
      }

      console.log("Profile updated successfully");
      
      // Profile setup complete - redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Profile setup error:", err.message);
      setErrorMsg(err.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isCheckingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
        <p className="text-gray-600 text-sm mb-6">Please fill in your information to get started</p>

        {/* First Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            type="text"
            placeholder="Enter your first name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all disabled:opacity-50"
          />
        </div>

        {/* Last Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            placeholder="Enter your last name"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all disabled:opacity-50"
          />
        </div>

        {/* Avatar Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture (Optional)
          </label>
          <AvatarUpload onFileSelect={setAvatarFile} />
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveProfile}
          disabled={loading || !name.trim() || !surname.trim()}
          className="w-full bg-purple-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : (
            "Complete Profile"
          )}
        </button>

        {/* Info Message */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            <strong>Note:</strong> You must complete your profile to access the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}