// sections/Account.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Upload, Trash2, Edit2, Check, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!//
// // FIX ACCOUNT PAGE FA LAGGARE TUTTO//
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! //
const supabase = createClient();

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

        if (error) {
          throw error;
        }

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

  // Handle click on change button
  const handleChangeImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      showMessage('error', "File size must be under 15MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', "Please upload a valid image file (PNG, JPEG)");
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // Get the correct file extension from the actual file type
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
        // Fallback: try to get extension from filename
        const fileNameParts = file.name.split('.');
        fileExt = fileNameParts[fileNameParts.length - 1].toLowerCase();
      }

      const fileName = `${user.id}.${fileExt}`;
      const filePath = fileName;

      console.log('Uploading file:', fileName, 'Type:', file.type, 'Extension:', fileExt);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update user metadata in public.users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          metadata: { avatar_url: publicUrl },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Update local state WITH CACHE BUSTING - this is the key fix!
      setProfileImage(`${publicUrl}?t=${Date.now()}`);
      showMessage('success', "Profile image updated successfully");
      
      // Reset file input
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
      // Extract file path from URL (remove cache busting parameter)
      const cleanUrl = profileImage.split('?')[0];
      const urlParts = cleanUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = fileName;

      console.log('Removing file:', filePath);

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        // Continue even if file doesn't exist in storage
      }

      // Update user metadata in public.users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          metadata: { avatar_url: null },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
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
      // Verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update user data in public.users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: tempFirstName,
          surname: tempLastName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
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
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update password in Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Update updated_at in public.users table
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
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Account</h1>
        <p className="text-gray-400">Manage your account settings and preferences.</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-900/20 border-green-500 text-green-400' 
            : 'bg-red-900/20 border-red-500 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="bg-[#141417] border border-[#1e1e22] rounded-lg p-8 mb-8">
        <h2 className="text-lg font-semibold text-white mb-6">Profile Picture</h2>
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0f0f10] flex-shrink-0 border-2 border-[#2a2a2e] group hover:border-purple-500 transition-colors">
                {profileImage ? (
                  <img 
                    src={profileImage}
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    key={profileImage} // Force React to re-mount the image element
                    onError={(e) => {
                      console.error('Image failed to load:', profileImage);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : null}
                {!profileImage && (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white text-2xl font-bold">
                    {firstName?.[0]}{lastName?.[0]}
                  </div>
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
              {/* Change button that triggers file input */}
              <button 
                onClick={handleChangeImageClick}
                disabled={isUploadingImage}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-colors cursor-pointer text-sm ${
                  isUploadingImage 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <Upload size={16} />
                {isUploadingImage ? 'Uploading...' : 'Change'}
              </button>
              {profileImage && (
                <button 
                  onClick={handleRemoveImage}
                  disabled={isUploadingImage}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e1e22] hover:bg-[#2a2a2e] text-gray-200 rounded-xl transition-colors border border-[#2a2a2e] text-sm disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-2">We recommend using an image of at least 256x256 pixels in PNG or JPEG format.</p>
            <p className="text-sm text-gray-500">Maximum file size: 15MB</p>
          </div>
        </div>
      </div>

      {/* Full Name Section */}
      <div className="bg-[#141417] border border-[#1e1e22] rounded-lg p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Full Name</h2>
          {!isEditingName ? (
            <button
              onClick={startEditingName}
              className="flex items-center gap-2 px-3 py-1 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
            >
              <Edit2 size={16} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={applyNameChanges}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                {loading ? 'Saving...' : 'Apply'}
              </button>
              <button
                onClick={cancelEditingName}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 bg-[#1e1e22] hover:bg-[#2a2a2e] text-gray-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">First Name</label>
            {isEditingName ? (
              <input
                type="text"
                value={tempFirstName}
                onChange={(e) => setTempFirstName(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f0f10] border border-[#2a2a2e] rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Enter first name"
              />
            ) : (
              <div className="w-full px-4 py-2 bg-[#0f0f10] border border-transparent rounded-xl text-gray-200">
                {firstName || "Not set"}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Last Name</label>
            {isEditingName ? (
              <input
                type="text"
                value={tempLastName}
                onChange={(e) => setTempLastName(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f0f10] border border-[#2a2a2e] rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Enter last name"
              />
            ) : (
              <div className="w-full px-4 py-2 bg-[#0f0f10] border border-transparent rounded-xl text-gray-200">
                {lastName || "Not set"}
              </div>
            )}
          </div>
        </div>
        
        {isEditingName && (
          <div className="mt-4 p-4 bg-[#0f0f10] border border-[#2a2a2e] rounded-lg">
            <p className="text-sm text-gray-400">
              To confirm changes, please enter your current password:
            </p>
            <div className="mt-2 relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#141417] border border-[#2a2a2e] rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors pr-10"
                placeholder="Enter current password"
              />
              <button
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Email Section */}
      <div className="bg-[#141417] border border-[#1e1e22] rounded-lg p-8 mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">Contact Email</h2>
        <p className="text-sm text-gray-400 mb-6">Manage your account's email address for invoices and notifications.</p>
        <div className="space-y-3">
          {emails.map((emailValue, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-[#0f0f10] border border-[#2a2a2e] rounded-xl text-gray-200">
                {emailValue}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-[#141417] border border-[#1e1e22] rounded-lg p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Password</h2>
        <p className="text-sm text-gray-400 mb-6">Modify your current password.</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f0f10] border border-[#2a2a2e] rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors pr-10"
                placeholder="Enter current password"
              />
              <button
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f0f10] border border-[#2a2a2e] rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors pr-10"
                placeholder="Enter new password"
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleUpdatePassword}
          disabled={loading || !currentPassword || !newPassword}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}