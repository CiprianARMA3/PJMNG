"use client";

import { useEffect, useState, useRef } from "react";
import {
  Bell,
  Inbox,
  Filter,
  X,
  Calendar,
  Tag as TagIcon,
  Loader2,
  ChevronRight,
  User,
  ArrowUp,
  ArrowDown,
  Terminal,
  Zap,
  Info
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
interface UpdateTag {
  tag: string;
  tag_color: string;
}

interface AuthorProfile {
  name: string | null;
  surname: string | null;
  metadata: {
    avatar_url?: string | null;
  } | null;
}

interface UpdateItem {
  id: number;
  created_at: string;
  title: string | null;
  description: string | null;
  version: string | null;
  tag: UpdateTag | null;
  by: string | null;
  users: AuthorProfile | null;
}

type SortKey = 'date' | 'tag';
type SortOrder = 'asc' | 'desc';

// --- SUPERCHARGED WIDGET CONTAINER ---
const TelemetryNode = ({ title, icon: Icon, children, action }: any) => (
  <div className="relative w-full bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[40px] flex flex-col overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 h-[650px]">
    {/* GRAINY TEXTURE */}
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none z-0" />
    
    <div className="relative z-10 px-8 py-6 border-b-2 border-zinc-50 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/30">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 text-purple-600 shadow-sm">
          <Icon size={18} strokeWidth={3} />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 block mb-0.5">Developer Updates</span>
          <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">{title}</h3>
        </div>
      </div>
      {action}
    </div>
    <div className="relative z-10 flex-1 bg-white dark:bg-transparent min-h-0 flex flex-col overflow-hidden">
      {children}
    </div>
  </div>
);

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const getInitials = (name?: string | null, surname?: string | null) => {
  return `${name?.[0] || ""}${surname?.[0] || ""}`.toUpperCase() || "?";
};

export default function MailSection() {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateItem | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const filterRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setIsFilterOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("updates").select(`*, users (name, surname, metadata)`);
        if (error) throw error;
        setUpdates((data as any) || []);
      } catch (err) { console.error("Error fetching updates:", err);
      } finally { setLoading(false); }
    })();
  }, []);

  const sortedUpdates = [...updates].sort((a, b) => {
    if (sortKey === 'date') {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      const tagA = a.tag?.tag || '';
      const tagB = b.tag?.tag || '';
      if (!tagA) return 1; if (!tagB) return -1;
      return sortOrder === 'asc' ? tagA.localeCompare(tagB) : tagB.localeCompare(tagA);
    }
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder(key === 'date' ? 'desc' : 'asc'); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* --- SUPERCHARGED HEADER --- */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={14} className="text-purple-600" strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
            Telemetry / Broadcast Protocol
          </span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-none mb-4">
          Updates & Messages<span className="text-purple-600">.</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm leading-relaxed max-w-lg">
          Audit real-time broadcast logs, system notifications, and synchronized project telemetry updates.
        </p>
        <div className="h-1 w-12 bg-zinc-100 dark:bg-zinc-800 mt-6 rounded-full" />
      </div>

      <TelemetryNode
        title="Blog Posts"
        icon={Inbox}
        action={
          <div className="relative" ref={filterRef}>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-b-2 border-zinc-100 dark:border-zinc-800 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Sort Protocol</div>
                  <div className="p-2 space-y-1">
                    {[
                      { key: 'date', label: 'Timestamp', icon: Calendar },
                      { key: 'tag', label: 'Tag Cluster', icon: TagIcon }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleSort(opt.key as SortKey)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all group ${sortKey === opt.key ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500'}`}
                      >
                        <div className="flex items-center gap-3">
                          <opt.icon size={14} strokeWidth={3} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                        </div>
                        {sortKey === opt.key && (sortOrder === 'desc' ? <ArrowDown size={14} strokeWidth={3} /> : <ArrowUp size={14} strokeWidth={3} />)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Syncing...</span>
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-6 text-zinc-200 dark:text-zinc-700">
              <Bell size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-2">Streams Nominal</h3>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm max-w-xs">No Blog updates fetched.</p>
          </div>
        ) : (
          <div className="overflow-y-auto h-full p-4 space-y-3 custom-scrollbar">
            {sortedUpdates.map((update) => (
              <div
                key={update.id}
                onClick={() => setSelectedUpdate(update)}
                className="group relative p-6 bg-white dark:bg-zinc-900/30 border-2 border-zinc-50 dark:border-zinc-800 rounded-[32px] hover:border-purple-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 overflow-hidden flex items-center justify-center">
                      {update.users?.metadata?.avatar_url ? (
                        <img src={update.users.metadata.avatar_url} className="w-full h-full object-cover" alt="User Avatar" />
                      ) : (
                        <img src={"/logo-light.png"} className="w-full h-full object-cover" alt="User Avatar" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full shadow-sm shadow-emerald-500/50" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <h4 className="text-base font-black text-zinc-900 dark:text-white tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors uppercase">
                        {update.title || "Transmission"}
                      </h4>
                      {update.version && <span className="text-[9px] font-black bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black px-2 py-0.5 rounded-md uppercase tracking-widest">v{update.version}</span>}
                    </div>
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 line-clamp-1 max-w-md">{update.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-300">{update.users?.name || "KapryDev Team"}</div>
                    <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">{formatDate(update.created_at)}</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <ChevronRight size={20} strokeWidth={3} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </TelemetryNode>

      {/* --- SUPERCHARGED BROADCAST MODAL --- */}
      <AnimatePresence>
        {selectedUpdate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUpdate(null)} className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[40px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] pointer-events-none" />
              
              <div className="relative z-10 p-10 border-b-2 border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-[20px] bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                    {selectedUpdate.users?.metadata?.avatar_url ? (
                      <img src={selectedUpdate.users.metadata.avatar_url} className="w-full h-full object-cover" alt="Detail Avatar" />
                    ) : (
                        <img src={"/logo-light.png"} className="w-full h-full object-cover" alt="User Avatar" />
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">{selectedUpdate.title || "Transmission"}</h2>
                      {selectedUpdate.tag && (
                         <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2" style={{ borderColor: selectedUpdate.tag.tag_color, color: selectedUpdate.tag.tag_color }}>
                            {selectedUpdate.tag.tag}
                         </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
  <span className="flex items-center gap-2">
    <User size={14} strokeWidth={3} className="text-purple-600 dark:text-purple-400" /> 
    {selectedUpdate.users?.name 
      ? `${selectedUpdate.users.name} ${selectedUpdate.users.surname || ""}` 
      : "KapryDEV Team"}
  </span>                      
  <span className="flex items-center gap-2"><Calendar size={14} strokeWidth={3} className="text-purple-600 dark:text-purple-400" /> {formatDate(selectedUpdate.created_at)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedUpdate(null)} className="p-3 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-sm"><X size={20} strokeWidth={3} /></button>
              </div>

              <div className="relative z-10 p-10 overflow-y-auto flex-1 custom-scrollbar">
                <div className="prose dark:prose-invert prose-zinc max-w-none">
                  {selectedUpdate.description?.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="text-zinc-500 dark:text-zinc-400 font-bold text-lg leading-relaxed mb-6 last:mb-0">{paragraph}</p>
                  ))}
                  {!selectedUpdate.description && <p className="text-zinc-300 dark:text-zinc-700 font-black uppercase tracking-widest text-center py-10">Stream Empty / No Data Logged</p>}
                </div>
              </div>

              <div className="relative z-10 p-8 border-t-2 border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-end">
                <button onClick={() => setSelectedUpdate(null)} className="px-10 py-4 bg-[#202124] dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-zinc-900/10 dark:shadow-black/50 active:scale-95 transition-all">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}