// frontend/app/dashboard/components/profile-settings/sections/Account.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Eye,
  EyeOff,
  Upload,
  Trash2,
  Edit2,
  Check,
  X,
  User,
  Mail,
  Lock,
  Camera,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// --- Shared Component: Page Widget ---
const PageWidget = ({ title, icon: Icon, children, action }: any) => (
  <div className="relative z-10 w-full bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl flex flex-col overflow-visible shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] light:shadow-lg hover:border-[#333] light:hover:border-gray-300 transition-colors mb-6">
    <div className="px-5 py-4 border-b border-[#222] light:border-gray-200 flex items-center justify-between bg-[#141414] light:bg-gray-50 rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-[#1a1a1a] light:bg-white rounded-md border border-[#2a2a2a] light:border-gray-200">
          <Icon size={14} className="text-neutral-400 light:text-neutral-500" />
        </div>
        <h3 className="text-sm font-medium text-neutral-300 light:text-neutral-700 tracking-wide">{title}</h3>
      </div>
      {action}
    </div>
    <div className="flex-1 p-6 bg-[#111111] light:bg-white min-h-0 relative flex flex-col rounded-b-xl text-neutral-300 light:text-neutral-600">
      {children}
    </div>
  </div>
);

interface AccountPageProps {
  user: {
    id: string;
    email?: string;
  } | null;
}

export default function AccountPage({ user }: AccountPageProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempFirstName, setTempFirstName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data from public.users table
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFirstName(data.name || "");
          setLastName(data.surname || "");
          setEmail(data.email || user.email || "");
          setEmails([data.email || user.email || ""]);
          // Add cache busting to force fresh image load
          const avatarUrl = data.metadata?.avatar_url;
          if (avatarUrl) {
            setProfileImage(`${avatarUrl}?t=${Date.now()}`);
          } else {
            setProfileImage("");
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        showMessage('error', "Failed to load user data");
      }
    };

    fetchUserData();
  }, [user]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleChangeImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 15 * 1024 * 1024) {
      showMessage('error', "File size must be under 15MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      showMessage('error', "Please upload a valid image file (PNG, JPEG)");
      return;
    }

    setIsUploadingImage(true);

    try {
      let fileExt = '';
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        fileExt = 'jpg';
      } else if (file.type === 'image/png') {
        fileExt = 'png';
      } else if (file.type === 'image/gif') {
        fileExt = 'gif';
      } else if (file.type === 'image/webp') {
        fileExt = 'webp';
      } else {
        const fileNameParts = file.name.split('.');
        fileExt = fileNameParts[fileNameParts.length - 1].toLowerCase();
      }

      const fileName = `${user.id}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          metadata: { avatar_url: publicUrl },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileImage(`${publicUrl}?t=${Date.now()}`);
      showMessage('success', "Profile image updated successfully");

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('error', "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!profileImage || !user) return;

    try {
      const cleanUrl = profileImage.split('?')[0];
      const urlParts = cleanUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = fileName;

      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        console.warn("Storage remove error (might be okay if already gone):", deleteError);
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          metadata: { avatar_url: null },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileImage("");
      showMessage('success', "Profile image removed successfully");
    } catch (error) {
      console.error('Error removing image:', error);
      showMessage('error', "Failed to remove image");
    }
  };

  const startEditingName = () => {
    setTempFirstName(firstName);
    setTempLastName(lastName);
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setTempFirstName(firstName);
    setTempLastName(lastName);
  };

  const applyNameChanges = async () => {
    if (!currentPassword || !user?.email) {
      showMessage('error', "Please enter your current password to confirm changes");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error("Current password is incorrect");

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: tempFirstName,
          surname: tempLastName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setFirstName(tempFirstName);
      setLastName(tempLastName);

      setIsEditingName(false);
      setCurrentPassword("");
      showMessage('success', "Name updated successfully");
    } catch (error) {
      console.error('Error updating name:', error);
      showMessage('error', error instanceof Error ? error.message : "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !user?.email) {
      showMessage('error', "Please fill in both password fields");
      return;
    }

    if (newPassword.length < 6) {
      showMessage('error', "New password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error("Current password is incorrect");

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      await supabase
        .from('users')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      setCurrentPassword("");
      setNewPassword("");
      showMessage('success', "Password updated successfully");
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
<div className="mb-8">
  {/* Technical Module Tag */}
  <div className="flex items-center gap-2 mb-2">
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
      KAPRYDEV Secured informations
    </span>
  </div>
  
  {/* Main Title */}
  <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase leading-none">
    Account Settings<span className="text-purple-600">.</span>
  </h1>
  
  {/* Subtle Divider Line */}
  <div className="h-1 w-12 bg-zinc-100 mt-4 rounded-full" />
</div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${message.type === 'success'
          ? 'bg-green-500/5 border-green-500/10 text-green-400'
          : 'bg-red-500/5 border-red-500/10 text-red-400'
          }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
          <p>{message.text}</p>
        </div>
      )}

      {/* Profile Picture Section */}
      <PageWidget title="Profile Picture" icon={Camera}>
        <div className="flex flex-col sm:flex-row items-start gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#161616] light:bg-gray-100 flex-shrink-0 border border-[#333] light:border-gray-200 group-hover:border-neutral-500 light:group-hover:border-neutral-400 transition-colors shadow-lg">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    key={profileImage}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : null}
                {!profileImage && (
                  <div className="w-full h-full bg-gradient-to-b from-[#222] to-[#111] light:from-gray-100 light:to-white flex items-center justify-center text-neutral-500 text-2xl font-medium">
                    {firstName?.[0]}{lastName?.[0]}
                  </div>
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="animate-spin text-white w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm text-neutral-300 light:text-neutral-700 font-medium mb-1">Upload new avatar</p>
              <p className="text-xs text-neutral-500 light:text-neutral-600 leading-relaxed max-w-sm">
                We recommend using an image of at least 256x256 pixels in PNG or JPEG format. Maximum file size: 15MB.
              </p>
            </div>

            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
              <button
                onClick={handleChangeImageClick}
                disabled={isUploadingImage}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-md ${isUploadingImage
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-white light:bg-black text-black light:text-white hover:bg-neutral-200 light:hover:bg-neutral-800'
                  }`}
              >
                <Upload size={14} />
                {isUploadingImage ? 'Uploading...' : 'Upload Image'}
              </button>

              {profileImage && (
                <button
                  onClick={handleRemoveImage}
                  disabled={isUploadingImage}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] light:bg-white hover:bg-[#222] light:hover:bg-gray-50 text-neutral-400 light:text-neutral-600 hover:text-red-400 light:hover:text-red-500 rounded-lg transition-all border border-[#2a2a2a] light:border-gray-200 hover:border-red-900/30 text-xs font-medium"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </PageWidget>

      {/* Full Name Section */}
      <PageWidget
        title="Personal Information"
        icon={User}
        action={
          !isEditingName ? (
            <button
              onClick={startEditingName}
              className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-400 light:text-neutral-600 hover:text-white light:hover:text-black text-xs font-medium transition-colors bg-[#1a1a1a] light:bg-white hover:bg-[#222] light:hover:bg-gray-50 border border-[#2a2a2a] light:border-gray-200 rounded-lg"
            >
              <Edit2 size={12} />
              Edit Details
            </button>
          ) : null
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-neutral-500 light:text-neutral-600 uppercase tracking-wide mb-2">First Name</label>
              {isEditingName ? (
                <input
                  type="text"
                  value={tempFirstName}
                  onChange={(e) => setTempFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#161616] light:bg-white border border-[#333] light:border-gray-200 rounded-lg text-neutral-200 light:text-black placeholder-neutral-600 light:placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:bg-[#1a1a1a] light:focus:bg-gray-50 transition-all text-sm"
                  placeholder="Enter first name"
                />
              ) : (
                <div className="w-full px-4 py-2.5 bg-[#161616] light:bg-white border border-[#222] light:border-gray-200 rounded-lg text-neutral-300 light:text-neutral-700 text-sm">
                  {firstName || "Not set"}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 light:text-neutral-600 uppercase tracking-wide mb-2">Last Name</label>
              {isEditingName ? (
                <input
                  type="text"
                  value={tempLastName}
                  onChange={(e) => setTempLastName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#161616] light:bg-white border border-[#333] light:border-gray-200 rounded-lg text-neutral-200 light:text-black placeholder-neutral-600 light:placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:bg-[#1a1a1a] light:focus:bg-gray-50 transition-all text-sm"
                  placeholder="Enter last name"
                />
              ) : (
                <div className="w-full px-4 py-2.5 bg-[#161616] light:bg-white border border-[#222] light:border-gray-200 rounded-lg text-neutral-300 light:text-neutral-700 text-sm">
                  {lastName || "Not set"}
                </div>
              )}
            </div>
          </div>

          {isEditingName && (
            <div className="bg-[#161616] light:bg-gray-50 border border-[#222] light:border-gray-200 rounded-lg p-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-4 h-4 text-neutral-500 mt-0.5" />
                <p className="text-xs text-neutral-400 light:text-neutral-600 leading-relaxed">
                  To confirm these changes, please enter your current password. This is a security measure to protect your account.
                </p>
              </div>

              <div className="relative max-w-md">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#111] light:bg-white border border-[#333] light:border-gray-200 rounded-lg text-neutral-200 light:text-black placeholder-neutral-600 light:placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors pr-10 text-sm"
                  placeholder="Current password"
                />
                <button
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center gap-3 mt-6 border-t border-[#222] light:border-gray-200 pt-4">
                <button
                  onClick={applyNameChanges}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white light:bg-black hover:bg-neutral-200 light:hover:bg-neutral-800 text-black light:text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-black/20"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={cancelEditingName}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-[#222] light:hover:bg-gray-200 text-neutral-400 light:text-neutral-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </PageWidget>

      {/* Contact Email Section */}
      <PageWidget title="Contact Information" icon={Mail}>
        <div>
          <p className="text-xs text-neutral-500 mb-4">
            This email address is used for invoices, login, and important notifications.
          </p>
          <div className="space-y-3">
            {emails.map((emailValue, index) => (
              <div key={index} className="flex items-center justify-between px-4 py-3 bg-[#161616] light:bg-gray-50 border border-[#222] light:border-gray-200 rounded-lg group hover:border-[#333] light:hover:border-gray-300 transition-colors">
                <span className="text-sm text-neutral-300 light:text-neutral-700 font-mono">{emailValue}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-green-500/10 text-green-500 border border-green-500/20 tracking-wide">Verified</span>
              </div>
            ))}
          </div>
        </div>
      </PageWidget>

      {/* Password Section */}
      <PageWidget title="Security & Password" icon={Lock}>
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-xs font-medium text-neutral-500 light:text-neutral-600 uppercase tracking-wide mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#161616] light:bg-white border border-[#333] light:border-gray-200 rounded-lg text-neutral-200 light:text-black placeholder-neutral-600 light:placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:bg-[#1a1a1a] light:focus:bg-gray-50 transition-all pr-10 text-sm"
                  placeholder="••••••••••••"
                />
                <button
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 light:text-neutral-600 uppercase tracking-wide mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#161616] light:bg-white border border-[#333] light:border-gray-200 rounded-lg text-neutral-200 light:text-black placeholder-neutral-600 light:placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:bg-[#1a1a1a] light:focus:bg-gray-50 transition-all pr-10 text-sm"
                  placeholder="Minimum 6 characters"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#222] light:border-gray-200">
            <button
              onClick={handleUpdatePassword}
              disabled={loading || !currentPassword || !newPassword}
              className="px-6 py-2 bg-white light:bg-black hover:bg-neutral-200 light:hover:bg-neutral-800 text-black light:text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </PageWidget>
    </div>
  );
}