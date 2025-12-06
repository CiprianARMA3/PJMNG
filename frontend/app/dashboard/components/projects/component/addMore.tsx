"use client";

import { Plus, ChevronDown, FolderPlus, Users, X, ArrowRight, Loader2, AlertCircle } from "lucide-react";
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
      setError("Invalid code format. It must be a valid UUID (e.g., 550e8400-...).");
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
      // We explicitly pass the named parameter 'code_input'
      const { data: projectId, error: rpcError } = await supabase.rpc('join_project_via_invite', {
        code_input: cleanCode
      });

      if (rpcError) {
        // Log the full error structure to console for debugging
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
      // Make the error message user-friendly
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
      {/* --- DROPDOWN TRIGGER --- */}
      <div className="relative" ref={dropdownRef}>
        <button
          className={`
            flex items-center justify-center gap-2 px-4 py-2
            bg-white/5 backdrop-blur-lg border border-white/10 rounded-full text-white 
            hover:bg-white/10 hover:border-white/20 shadow-lg transition-all duration-200
            ${isOpen ? 'bg-white/10 border-white/20' : ''}
          `}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Plus size={20} />
          <span className="text-sm font-medium">Add Project</span>
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* --- DROPDOWN MENU --- */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-2 w-64 bg-[#1a1a1a] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <Link
              href="/create-project" 
              className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all duration-150 border-b border-white/5 flex items-start gap-3"
              onClick={() => setIsOpen(false)}
            >
              <FolderPlus size={18} className="text-purple-400 mt-1" />
              <div>
                <div className="font-medium text-sm">Create Project</div>
                <div className="text-xs text-white/50 mt-0.5">Start a new workspace</div>
              </div>
            </Link>
            
            <button
              onClick={openJoinModal}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all duration-150 flex items-start gap-3"
            >
              <Users size={18} className="text-zinc-400 mt-1" />
              <div>
                <div className="font-medium text-sm">Join Project</div>
                <div className="text-xs text-white/50 mt-0.5">Enter an invite code</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* --- JOIN MODAL --- */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsJoinModalOpen(false)} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="mb-6">
              <div className="w-10 h-10 bg-zinc-500/10 rounded-full flex items-center justify-center mb-3">
                 <Users size={20} className="text-zinc-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Join Workspace</h2>
              <p className="text-xs text-zinc-400 mt-1">Enter the invitation code shared by the project admin.</p>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Paste UUID code here..." 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all placeholder:text-zinc-700 font-mono"
                  autoFocus
                />
                {error && (
                  <p className="text-rose-500 text-[11px] mt-2 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> 
                    {error}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!inviteCode || isJoining}
                  className="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  Join Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}