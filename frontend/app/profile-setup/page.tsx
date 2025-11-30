"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import AvatarUpload from "../components/AvatarUpload";
import useRequireAuth from "@/hooks/useRequireAuth";
import { User, MoreHorizontal, Code } from "lucide-react";

const supabase = createClient();
const DEFAULT_AVATAR = "/default-avatar.png"; // fallback avatar

// Helper: Internal Card Component to create the "Menu on top" look
const PageWidget = ({ title, icon: Icon, iconColor, children }: any) => (
  <div className="bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col overflow-hidden shadow-2xl w-full max-w-md hover:border-white/20 transition-colors">
    {/* The Menu / Header Bar */}
    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
      <div className="flex items-center gap-2.5">
        <Icon size={16} className={iconColor} />
        <h3 className="text-sm font-semibold text-white/90 tracking-tight">{title}</h3>
      </div>
      {/* Menu dots */}
      <MoreHorizontal size={16} className="text-white/20" />
    </div>
    
    {/* Content */}
    <div className="flex-1 p-8 bg-[#0a0a0a] min-h-0 relative flex flex-col">
      {children}
    </div>
  </div>
);

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
          .eq("id", sessionUser.id)
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

      console.log("Updating user profile for user ID:", sessionUser.id);
      
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          surname: surname.trim(),
          metadata: { avatar_url: avatarUrl || DEFAULT_AVATAR },
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionUser.id);

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
      <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-neutral-400 animate-spin fill-white"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Custom Dark Theme Profile Setup Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <PageWidget 
        title="Complete Your Profile" 
        icon={Code} // Using 'Code' icon for the theme consistency
        iconColor="text-purple-400"
      >
        <p className="text-white/70 text-sm mb-6">Please fill in your information to get started</p>

        {/* First Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/90 mb-2">
            First Name
          </label>
          <input
            type="text"
            placeholder="Enter your first name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-[#161616] text-white/90 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all disabled:opacity-50"
          />
        </div>

        {/* Last Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/90 mb-2">
            Last Name
          </label>
          <input
            type="text"
            placeholder="Enter your last name"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-[#161616] text-white/90 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all disabled:opacity-50"
          />
        </div>

        {/* Avatar Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/90 mb-2">
            Profile Picture (Optional)
          </label>
          {/* Assuming AvatarUpload component handles its own dark theme styling internally or it uses minimal styling */}
          <AvatarUpload onFileSelect={setAvatarFile} /> 
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-900/40 border border-red-700/60 rounded-lg">
            <p className="text-red-300 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveProfile}
          disabled={loading || !name.trim() || !surname.trim()}
          className="w-full bg-purple-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
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
        <div className="mt-6 p-4 bg-blue-900/40 border border-blue-700/60 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Note:</strong> You must complete your profile to access the dashboard.
          </p>
        </div>
      </PageWidget>
    </div>
  );
}