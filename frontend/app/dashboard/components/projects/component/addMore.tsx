"use client";

import {
  Plus,
  FolderPlus,
  Users,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  Terminal,
  Cpu
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// [DIAGRAM OF VALIDATION FLOW]: 
// User Input (UUID) -> Fetch Project -> Get Owner ID -> Fetch Owner Plan -> Count Project Members -> (Count < OwnerLimit ?) -> ALLOW : REJECT

// define limits based on your pricing structure
const PLAN_LIMITS: Record<string, number> = {
    free: 2,
    pro: 10,
    enterprise: 999
};

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

  const isValidUUID = (uuid: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  };

  const checkOwnerPlanLimits = async (projectId: string) => {
    // 1. Get Project Owner ID
    const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('created_by')
        .eq('id', projectId)
        .single();

    if (projectError || !projectData) {
        // If we can't read the project, we assume it doesn't exist or RLS blocks us
        // We let the RPC handle the final "Not Found" error
        return; 
    }

    const ownerId = projectData.created_by;

    // 2. Fetch Owner's Plan (Assuming it's in users table metadata or a subscriptions table)
    // Adjust this query to match your exact schema for storing plans
    const { data: ownerData, error: ownerError } = await supabase
        .from('users')
        .select('plan, billing_status') // Adjust columns as needed
        .eq('id', ownerId)
        .single();

    if (ownerError) return; // Skip check if we can't read owner (fail open to RPC)

    // Default to 'free' if no plan found
    const ownerPlan = (ownerData?.plan || 'free').toLowerCase();
    const limit = PLAN_LIMITS[ownerPlan] || PLAN_LIMITS['free'];

    // 3. Count Current Collaborators
    const { count, error: countError } = await supabase
        .from('project_users')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

    if (countError) return;

    // 4. Validate
    const currentCount = count || 0;
    if (currentCount >= limit) {
        throw new Error(`Owner's ${ownerPlan.toUpperCase()} plan limit reached (${currentCount}/${limit}). Cannot join.`);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim();
    if (!cleanCode) return;
    
    if (!isValidUUID(cleanCode)) {
      setError("Protocol Error: Input must be a valid UUID cluster.");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // --- NEW STEP: Pre-check Owner Limits ---
      // We assume cleanCode IS the project_id. If it's a token, 
      // you must resolve it to a project_id first.
      await checkOwnerPlanLimits(cleanCode);

      // --- EXECUTE JOIN ---
      const { data: projectId, error: rpcError } = await supabase.rpc('join_project_via_invite', {
        code_input: cleanCode
      });

      if (rpcError) throw new Error(rpcError.message || "Relay failure while joining.");
      if (!projectId) throw new Error("Target cluster not found.");

      router.push(`/dashboard/projects/${projectId}`);
      setIsJoinModalOpen(false);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      {/* --- TRIGGER INTERFACE --- */}
      <div className="relative w-full h-full min-h-[400px]" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            group relative flex flex-col items-center justify-center w-full h-full 
            bg-white dark:bg-zinc-900/20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[32px] 
            transition-all duration-500 cursor-pointer overflow-hidden
            ${isOpen ? 'border-purple-600 dark:border-purple-500 bg-zinc-50 dark:bg-zinc-900/50' : 'hover:border-purple-400 dark:hover:border-purple-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'}
          `}
        >
          {/* Grainy Texture Overlay */}
          <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-6 text-center p-8">
            {/* Action Icon Cluster */}
            <div className={`
                w-20 h-20 rounded-[24px] bg-white dark:bg-zinc-900 border-2 flex items-center justify-center transition-all duration-500 shadow-xl
                ${isOpen ? 'border-purple-600 dark:border-purple-500 scale-110 shadow-purple-600/10' : 'border-zinc-100 dark:border-zinc-800 group-hover:border-purple-400 group-hover:scale-105'}
            `}>
              <Plus className={`w-8 h-8 text-zinc-400 transition-colors duration-500 ${isOpen ? 'text-purple-600' : 'group-hover:text-purple-500'}`} strokeWidth={3} />
            </div>

            {/* Typography Readout */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600 dark:text-purple-400 block">Initialize Action</span>
              <h3 className={`text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white transition-colors`}>
                Expand Workspace
              </h3>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 max-w-[200px] leading-relaxed">
                Initialize a fresh project to begin organizing your development assets and collaborators.
              </p>
            </div>
          </div>

          {/* Infrastructure Metadata Badge */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-50 transition-all duration-500 ${isOpen ? 'opacity-100 translate-y-0' : 'group-hover:opacity-80 translate-y-2'}`}>
            <Terminal size={12} className="text-zinc-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Secured by kaprydev</span>
          </div>
        </button>

        {/* --- EXPANSION MENU --- */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-[80%] left-0 right-0 bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[32px] shadow-2xl z-50 overflow-hidden"
            >
              <Link
                href="/create-project"
                className="w-full px-8 py-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all border-b-2 border-zinc-50 dark:border-zinc-900 flex items-center gap-4 group/item"
                onClick={() => setIsOpen(false)}
              >
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-zinc-100 dark:border-zinc-700 group-hover/item:border-purple-600 transition-colors">
                  <FolderPlus size={18} className="text-purple-600" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-black text-[11px] uppercase tracking-widest text-zinc-900 dark:text-white">Create Project</div>
                  <div className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5 tracking-tight">Deploy new infrastructure</div>
                </div>
              </Link>

              <button
                onClick={openJoinModal}
                className="w-full px-8 py-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all flex items-center gap-4 group/item"
              >
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-zinc-100 dark:border-zinc-700 group-hover/item:border-purple-600 transition-colors">
                  <Users size={18} className="text-purple-600" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-black text-[11px] uppercase tracking-widest text-zinc-900 dark:text-white">Join Project</div>
                  <div className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5 tracking-tight">Relay via UUID invitation</div>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- AUTHORIZATION MODAL --- */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsJoinModalOpen(false)} 
              className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[40px] shadow-2xl w-full max-w-md p-10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] pointer-events-none" />
              
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="absolute top-8 right-8 p-2.5 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"
              >
                <X size={18} strokeWidth={3} />
              </button>

              <div className="mb-10 relative z-10">
                <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-100 dark:border-purple-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <Cpu size={28} className="text-purple-600" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600 dark:text-purple-400 block mb-2">Project Access Auth</span>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Authorize Join</h2>
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-4 leading-relaxed uppercase tracking-tight">
                  Enter the cryptographic UUID token shared by the cluster administrator to synchronize.
                </p>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="CRYPTOGRAPHIC-TOKEN-UUID"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-xs font-black text-zinc-900 dark:text-white focus:outline-none focus:border-purple-600 dark:focus:border-purple-500 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700 uppercase tracking-widest font-mono"
                    autoFocus
                  />
                  {error && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-2xl">
                      <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" strokeWidth={3} />
                      <p className="text-[10px] font-black uppercase text-red-600 tracking-tight">{error}</p>
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(false)}
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={!inviteCode || isJoining}
                    className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-zinc-900/20 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {isJoining ? <Loader2 size={16} className="animate-spin" strokeWidth={3} /> : <ArrowRight size={16} strokeWidth={3} />}
                    {isJoining ? "Syncing..." : "Execute"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}