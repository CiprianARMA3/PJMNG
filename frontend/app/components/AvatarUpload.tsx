"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface AvatarUploadProps {
  onFileSelect: (file: File | null) => void;
  currentAvatarUrl?: string | null;
}

export default function AvatarUpload({ onFileSelect, currentAvatarUrl }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {loading && <p>Uploading...</p>}
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Avatar Preview"
          className="w-24 h-24 rounded-full"
        />
      )}
    </div>
  );
}
