// frontend/app/dashboard/components/projects/component/addMore.tsx

"use client";

import {
  Plus,
  FolderPlus,
  Users,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function AddProjectButton() {
  const supabase = createClient();
  const router = useRouter();

  // Dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal & Logic state
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openJoinModal = () => {
    setIsOpen(false);
    setIsJoinModalOpen(true);
    setError(null);
    setInviteCode("");
  };

  // Helper to validate UUID format strictly
  const isValidUUID = (uuid: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim();

    if (!cleanCode) return;

    // 1. Client-side Validation
    if (!isValidUUID(cleanCode)) {
      setError("Invalid code format. It must be a valid UUID.");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // 2. Check Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // 3. Call the RPC function
      const { data: projectId, error: rpcError } = await supabase.rpc('join_project_via_invite', {
        code_input: cleanCode
      });

      if (rpcError) {
        console.error("RPC Error Details:", JSON.stringify(rpcError, null, 2));
        throw new Error(rpcError.message || "Server error while joining.");
      }

      if (!projectId) {
        throw new Error("Project not found or invalid code.");
      }

      // 4. Success - Redirect
      router.push(`/dashboard/projects/${projectId}`);
      setIsJoinModalOpen(false);

    } catch (err: any) {
      let msg = err.message;
      if (msg.includes("input syntax for type uuid")) {
        msg = "The code format is incorrect.";
      } else if (msg.includes("Invalid invitation code")) {
        msg = "That code doesn't exist or is invalid.";
      }
      setError(msg);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      {/* --- TRIGGER CARD --- */}
      <div className="relative w-full h-full" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            group relative flex flex-col items-center justify-center w-full h-full min-h-[220px] 
            bg-[#111]/30 light:bg-white border border-dashed border-[#222] light:border-gray-300 rounded-xl 
            transition-all duration-300 cursor-pointer overflow-hidden
            ${isOpen ? 'bg-[#111] light:bg-gray-50 border-[#444] light:border-gray-400' : 'hover:bg-[#111] light:hover:bg-gray-50 hover:border-[#444] light:hover:border-gray-400'}
          `}
        >
          {/* Subtle background glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
            {/* Icon Container */}
            <div className={`
                w-12 h-12 rounded-full bg-[#161616] light:bg-white border border-[#2a2a2a] light:border-gray-200 
                flex items-center justify-center transition-all duration-300 shadow-sm
                ${isOpen ? 'border-[#444] light:border-gray-300 scale-110' : 'group-hover:border-[#444] light:group-hover:border-gray-300 group-hover:scale-110'}
            `}>
              <Plus className={`w-5 h-5 text-neutral-500 light:text-neutral-400 transition-colors ${isOpen ? 'text-white light:text-black' : 'group-hover:text-white light:group-hover:text-black'}`} />
            </div>

            {/* Text */}
            <div className="space-y-1">
              <h3 className={`text-sm font-medium text-neutral-300 light:text-neutral-700 transition-colors ${isOpen ? 'text-white light:text-black' : 'group-hover:text-white light:group-hover:text-black'}`}>
                Add Project
              </h3>
              <p className="text-xs text-neutral-500 light:text-neutral-500 group-hover:text-neutral-400 light:group-hover:text-neutral-600 transition-colors max-w-[300px]">
                Create a new workspace or join an existing team.
              </p>
            </div>
          </div>

          {/* Dropdown Chevron Indicator */}
          <div className={`absolute bottom-4 opacity-0 transition-all duration-300 transform ${isOpen ? 'opacity-100 translate-y-0' : 'group-hover:opacity-100 translate-y-1'}`}>
            <ChevronDown size={16} className="text-neutral-600 light:text-neutral-400" />
          </div>
        </button>

        {/* --- DROPDOWN MENU --- */}
        {isOpen && (
          <div className="absolute top-[72.5%] left-1/2 -translate-x-1/2 w-[100%] bg-[#141414] light:bg-white border border-[#333] light:border-gray-200 rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] light:shadow-lg z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <Link
              href="/create-project"
              className="w-full px-4 py-3 text-left text-neutral-300 light:text-neutral-700 hover:text-white light:hover:text-black hover:bg-[#1a1a1a] light:hover:bg-gray-50 transition-all duration-150 border-b border-[#222] light:border-gray-100 flex items-start gap-3 group/item"
              onClick={() => setIsOpen(false)}
            >
              <div className="p-1.5 bg-[#1a1a1a] light:bg-white rounded-lg border border-[#2a2a2a] light:border-gray-200 group-hover/item:border-[#333] light:group-hover/item:border-gray-300">
                <FolderPlus size={16} className="text-neutral-400 light:text-neutral-500 group-hover/item:text-white light:group-hover/item:text-black" />
              </div>
              <div>
                <div className="font-medium text-sm">Create Project</div>
                <div className="text-[11px] text-neutral-500 light:text-neutral-500 mt-0.5">Start a new workspace</div>
              </div>
            </Link>

            <button
              onClick={openJoinModal}
              className="w-full px-4 py-3 text-left text-neutral-300 light:text-neutral-700 hover:text-white light:hover:text-black hover:bg-[#1a1a1a] light:hover:bg-gray-50 transition-all duration-150 flex items-start gap-3 group/item"
            >
              <div className="p-1.5 bg-[#1a1a1a] light:bg-white rounded-lg border border-[#2a2a2a] light:border-gray-200 group-hover/item:border-[#333] light:group-hover/item:border-gray-300">
                <Users size={16} className="text-neutral-400 light:text-neutral-500 group-hover/item:text-white light:group-hover/item:text-black" />
              </div>
              <div>
                <div className="font-medium text-sm">Join Project</div>
                <div className="text-[11px] text-neutral-500 light:text-neutral-500 mt-0.5">Enter an invite code</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* --- JOIN MODAL --- */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 light:bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl shadow-2xl light:shadow-lg w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 light:text-neutral-400 hover:text-white light:hover:text-black transition-colors"
            >
              <X size={16} />
            </button>

            <div className="mb-6">
              <div className="w-10 h-10 bg-[#1a1a1a] light:bg-gray-50 border border-[#2a2a2a] light:border-gray-200 rounded-xl flex items-center justify-center mb-4">
                <Users size={20} className="text-neutral-400 light:text-neutral-500" />
              </div>
              <h2 className="text-lg font-medium text-white light:text-black mb-1">Join Workspace</h2>
              <p className="text-xs text-neutral-500 light:text-neutral-600 leading-relaxed">
                Enter the unique UUID invitation code shared by the project administrator to gain access.
              </p>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="e.g. 550e8400-e29b-..."
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full bg-[#0a0a0a] light:bg-gray-50 border border-[#222] light:border-gray-200 rounded-lg px-3 py-3 text-sm text-neutral-200 light:text-black focus:outline-none focus:border-neutral-500 light:focus:border-neutral-400 focus:bg-[#111] light:focus:bg-white transition-all placeholder:text-neutral-700 light:placeholder:text-neutral-400 font-mono shadow-inner"
                  autoFocus
                />
                {error && (
                  <div className="flex items-start gap-2 mt-3 text-red-400 light:text-red-600 bg-red-900/10 light:bg-red-50 border border-red-900/20 light:border-red-200 p-2.5 rounded-lg">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p className="text-[11px] leading-snug">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 light:text-neutral-500 hover:text-white light:hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inviteCode || isJoining}
                  className="px-4 py-2 bg-white light:bg-black hover:bg-neutral-200 light:hover:bg-neutral-800 text-black light:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10 light:shadow-black/10"
                >
                  {isJoining ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  {isJoining ? "Joining..." : "Join Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}