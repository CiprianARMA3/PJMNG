"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Copy, RefreshCw, Check, Link as LinkIcon, AlertTriangle } from "lucide-react";

interface ProjectCodeGenerationProps {
  projectId: string;
}

export default function ProjectCodeGeneration({ projectId }: ProjectCodeGenerationProps) {
  const supabase = createClient();
  const [inviteCode, setInviteCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch the initial code
  useEffect(() => {
    const fetchCode = async () => {
      if (!projectId) return;

      // Ensure we select 'invite_code' exactly as named in the DB
      const { data, error } = await supabase
        .from("projects")
        .select("invite_code")
        .eq("id", projectId)
        .single();

      if (error) {
        // Log the full error object for debugging
        console.error("Error fetching invite code:", JSON.stringify(error, null, 2));
        setError(error.message || "Could not load invite code");
      } else {
        setInviteCode(data?.invite_code || "No code generated");
      }
      setLoading(false);
    };

    fetchCode();
  }, [projectId]);

  // 2. Regenerate using the SQL Function (RPC)
  const handleRegenerate = async () => {
    if (!confirm("Regenerating the code will invalidate the previous link. Are you sure?")) return;

    setRegenerating(true);
    setError(null);

    const { data, error } = await supabase.rpc("regenerate_invite_code", {
      project_uuid: projectId,
    });

    if (error) {
      console.error("Regeneration error:", error);
      setError(error.message || "Failed to generate new code");
    } else if (data) {
      setInviteCode(data);
    }

    setRegenerating(false);
  };

  const handleCopy = () => {
    const fullLink = `${inviteCode}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="h-20 flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-zinc-600 light:border-zinc-300 border-t-zinc-200 light:border-t-zinc-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full  rounded-lg p-1 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-300 light:text-zinc-700">
          <LinkIcon size={14} className="text-purple-400" />
          <span>Project Invite Code</span>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="group flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 light:hover:text-zinc-900 transition-colors disabled:opacity-50"
          title="Regenerate Code"
        >
          <RefreshCw size={12} className={`group-hover:rotate-180 transition-transform duration-500 ${regenerating ? "animate-spin" : ""}`} />
          <span>Reset Invite Code</span>
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 group">
          <input
            readOnly
            value={inviteCode ? `${inviteCode}` : "Loading..."}
            className="w-full bg-black/40 light:bg-zinc-100 border border-zinc-800 light:border-zinc-300 text-zinc-400 light:text-zinc-900 text-xs rounded-md px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all select-all"
          />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/40 light:from-zinc-100 to-transparent pointer-events-none" />
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center justify-center px-3 bg-zinc-100 light:bg-zinc-200 hover:bg-white light:hover:bg-zinc-300 text-black light:text-zinc-900 rounded-md transition-colors active:scale-95"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-[10px] text-rose-500">
          <AlertTriangle size={10} />
          <span>{error}</span>
        </div>
      )}

      <p className="mt-2 text-[10px] text-zinc-600 light:text-zinc-500">
        Share this code to allow others to join this project directly.
      </p>
    </div>
  );
}