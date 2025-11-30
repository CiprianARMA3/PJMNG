"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Upload, X } from "lucide-react"; // Importing icons for visual cues

const supabase = createClient();

interface AvatarUploadProps {
  onFileSelect: (file: File | null) => void;
  currentAvatarUrl?: string | null;
}

export default function AvatarUpload({ onFileSelect, currentAvatarUrl }: AvatarUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [loading] = useState(false); // Simplified: Actual upload logic happens in parent, so we keep this simple.

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    onFileSelect(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(currentAvatarUrl || null);
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreviewUrl(currentAvatarUrl || null); // Revert to current URL if set, otherwise null
    onFileSelect(null);
    // Note: If you need to clear the file input itself, you'd need a ref.
  };

  return (
    <div className="flex items-center space-x-6">
      
      {/* 1. Avatar Preview */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <img
          src={previewUrl || "/default-avatar.png"} // Use a default image if no preview
          alt="Avatar Preview"
          className={`w-24 h-24 rounded-full object-cover border-4 ${previewUrl ? 'border-white/10' : 'border-purple-700/50'} bg-[#161616]`}
        />
        
        {/* Remove Button (for newly selected file) */}
        {file && (
          <button
            onClick={handleRemoveImage}
            className="absolute -top-1 -right-1 p-1 bg-red-600/90 hover:bg-red-500 rounded-full text-white/90 transition-colors shadow-lg"
            aria-label="Remove selected image"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 2. File Input & Text */}
      <div className="flex-1 space-y-3">
        {/* Hidden File Input Trigger */}
        <label 
          htmlFor="avatar-upload-input" 
          className="cursor-pointer inline-flex items-center px-4 py-2 border border-white/10 bg-white/5 text-sm font-medium rounded-lg text-white/90 shadow-sm hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <Upload size={18} className="mr-2 text-purple-400" />
          {previewUrl ? "Change Image" : "Upload Image"}
        </label>
        
        {/* Actual hidden input */}
        <input 
          id="avatar-upload-input"
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          disabled={loading}
          className="hidden" 
        />
        
        {loading && <p className="text-purple-400 text-sm">Uploading...</p>}
        <p className="text-white/50 text-xs">
          JPG, PNG, GIF. Max file size: 5MB
        </p>
      </div>

    </div>
  );
}