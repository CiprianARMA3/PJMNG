// frontend/app/dashboard/components/dashboard-sections/MailSection.tsx
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
  Check
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

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

// --- Components ---

const PageWidget = ({ title, icon: Icon, children, action }: any) => (
  <div className="relative z-10 w-full bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl flex flex-col overflow-visible shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] light:shadow-lg hover:border-[#333] light:hover:border-gray-300 transition-colors h-[600px]">
    <div className="px-5 py-4 border-b border-[#222] light:border-gray-200 flex items-center justify-between bg-[#141414] light:bg-gray-50 rounded-t-xl shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-[#1a1a1a] light:bg-white rounded-md border border-[#2a2a2a] light:border-gray-200">
          <Icon size={14} className="text-neutral-400 light:text-neutral-500" />
        </div>
        <h3 className="text-sm font-medium text-neutral-300 light:text-neutral-700 tracking-wide">{title}</h3>
      </div>
      {action}
    </div>
    <div className="flex-1 bg-[#111111] light:bg-white min-h-0 relative flex flex-col rounded-b-xl text-neutral-300 light:text-neutral-600 overflow-hidden">
      {children}
    </div>
  </div>
);

// Helper to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Helper to get initials
const getInitials = (name?: string | null, surname?: string | null) => {
  return `${name?.[0] || ""}${surname?.[0] || ""}`.toUpperCase() || "?";
};

export default function MailSection() {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateItem | null>(null);

  // Sorting State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const filterRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Data
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const { data, error } = await supabase
          .from("updates")
          .select(`
            *,
            users (
              name,
              surname,
              metadata
            )
          `); // We will handle sorting on the client side to avoid re-fetching

        if (error) throw error;
        setUpdates((data as any) || []);
      } catch (err) {
        console.error("Error fetching updates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  // Sorting Logic
  const getSortedUpdates = () => {
    return [...updates].sort((a, b) => {
      if (sortKey === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const tagA = a.tag?.tag || '';
        const tagB = b.tag?.tag || '';
        // If 'asc', empty tags go last. If 'desc', empty tags go last.
        if (!tagA) return 1;
        if (!tagB) return -1;
        return sortOrder === 'asc'
          ? tagA.localeCompare(tagB)
          : tagB.localeCompare(tagA);
      }
    });
  };

  const sortedUpdates = getSortedUpdates();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Toggle order if clicking same key
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to desc for date, asc for tags when switching
      setSortKey(key);
      setSortOrder(key === 'date' ? 'desc' : 'asc');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-xl font-medium text-white/90 light:text-black/90 mb-1">Updates & Messages</h1>
        <p className="text-sm text-neutral-500 light:text-neutral-600">System notifications and project updates.</p>
      </div>

      <PageWidget
        title="Inbox"
        icon={Inbox}
        action={
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-1.5 rounded-md transition-colors ${isFilterOpen ? 'bg-[#222] light:bg-gray-200 text-white light:text-black' : 'text-neutral-500 hover:text-neutral-300 light:hover:text-neutral-700 hover:bg-[#1a1a1a] light:hover:bg-gray-100'}`}
            >
              <Filter size={14} />
            </button>

            {/* Dropdown Menu */}
            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] light:bg-white border border-[#333] light:border-gray-200 rounded-xl shadow-2xl light:shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-[#2a2a2a] light:border-gray-100 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Sort by
                </div>

                {/* Date Sort Option */}
                <button
                  onClick={() => handleSort('date')}
                  className="w-full text-left px-4 py-2.5 text-xs text-neutral-300 light:text-neutral-700 hover:bg-[#222] light:hover:bg-gray-50 hover:text-white light:hover:text-black transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-neutral-500 group-hover:text-neutral-400" />
                    <span>Date</span>
                  </div>
                  {sortKey === 'date' && (
                    <div className="flex items-center gap-1 text-indigo-400">
                      <span className="text-[10px] font-mono">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                      {sortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                    </div>
                  )}
                </button>

                {/* Tag Sort Option */}
                <button
                  onClick={() => handleSort('tag')}
                  className="w-full text-left px-4 py-2.5 text-xs text-neutral-300 light:text-neutral-700 hover:bg-[#222] light:hover:bg-gray-50 hover:text-white light:hover:text-black transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <TagIcon size={12} className="text-neutral-500 group-hover:text-neutral-400" />
                    <span>Tag</span>
                  </div>
                  {sortKey === 'tag' && (
                    <div className="flex items-center gap-1 text-indigo-400">
                      <span className="text-[10px] font-mono">{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
                      {sortOrder === 'asc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        }
      >
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs">Checking for updates...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && updates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 bg-[#161616] light:bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-[#222] light:border-gray-200">
              <Bell className="w-6 h-6 text-neutral-600 light:text-neutral-400" />
            </div>
            <h3 className="text-neutral-300 light:text-neutral-700 font-medium text-sm mb-1">All caught up</h3>
            <p className="text-neutral-500 text-xs max-w-xs mx-auto">
              You have no new notifications or messages at this time.
            </p>
          </div>
        )}

        {/* List of Updates */}
        {!loading && sortedUpdates.length > 0 && (
          <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            {sortedUpdates.map((update) => {
              const author = update.users;
              const avatarUrl = author?.metadata?.avatar_url;

              return (
                <div
                  key={update.id}
                  onClick={() => setSelectedUpdate(update)}
                  className="group border-b border-[#1a1a1a] light:border-gray-100 p-4 hover:bg-[#161616] light:hover:bg-gray-50 cursor-pointer transition-all duration-200 flex flex-col gap-2 relative"
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                      {/* Avatar in List */}
                      <div className="w-8 h-8 rounded-full bg-[#222] light:bg-gray-100 border border-[#333] light:border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-medium text-neutral-500">
                            {getInitials(author?.name, author?.surname)}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-neutral-200 light:text-neutral-800 group-hover:text-white light:group-hover:text-black transition-colors">
                          {update.title || "Untitled Update"}
                        </h4>
                        <p className="text-[10px] text-neutral-500">
                          by {author?.name || "Unknown"} {author?.surname || ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-600 group-hover:text-neutral-500 whitespace-nowrap ml-2">
                      {formatDate(update.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500 line-clamp-2 pl-11 pr-4">
                    {update.description}
                  </p>

                  <div className="pl-11 flex items-center gap-2 mt-1">
                    {update.version && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#2a2a2a] light:border-gray-200 bg-[#1a1a1a] light:bg-gray-50 text-neutral-400 light:text-neutral-500 font-mono">
                        v{update.version}
                      </span>
                    )}
                    {update.tag && update.tag.tag && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded border border-[#2a2a2a] light:border-gray-200 bg-[#1a1a1a] light:bg-gray-50 flex items-center gap-1"
                        style={{ color: update.tag.tag_color || '#999' }}
                      >
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {update.tag.tag}
                      </span>
                    )}
                  </div>

                  <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        )}
      </PageWidget>

      {/* --- Full Screen Modal --- */}
      {selectedUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedUpdate(null)}
          />

          <div className="relative w-full max-w-2xl bg-[#0f0f0f] light:bg-white border border-[#222] light:border-gray-200 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between p-6 border-b border-[#1f1f1f] light:border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] light:bg-gray-50 border border-[#333] light:border-gray-200 flex items-center justify-center overflow-hidden shrink-0 mt-1">
                  {selectedUpdate.users?.metadata?.avatar_url ? (
                    <img src={selectedUpdate.users.metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-neutral-500">
                      {getInitials(selectedUpdate.users?.name, selectedUpdate.users?.surname)}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-white light:text-black tracking-tight leading-tight">
                      {selectedUpdate.title || "Update Details"}
                    </h2>
                    {selectedUpdate.version && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
                        v{selectedUpdate.version}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-neutral-400 light:text-neutral-500">
                    <div className="flex items-center gap-1.5 text-neutral-300 light:text-neutral-700">
                      <User size={12} className="text-neutral-500" />
                      <span>
                        {selectedUpdate.users?.name || "Unknown"} {selectedUpdate.users?.surname || ""}
                      </span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-neutral-700" />
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-neutral-500" />
                      <span>{formatDate(selectedUpdate.created_at)}</span>
                    </div>
                  </div>

                  {selectedUpdate.tag && selectedUpdate.tag.tag && (
                    <div className="pt-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-[#2a2a2a] light:border-gray-200 bg-[#161616] light:bg-gray-50 text-xs"
                        style={{ color: selectedUpdate.tag.tag_color || '#999' }}
                      >
                        <TagIcon size={10} />
                        {selectedUpdate.tag.tag}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedUpdate(null)}
                className="p-2 rounded-lg bg-[#1a1a1a] light:bg-gray-100 hover:bg-[#222] light:hover:bg-gray-200 text-neutral-400 light:text-neutral-500 hover:text-white light:hover:text-black transition-colors border border-[#2a2a2a] light:border-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto text-neutral-300 light:text-neutral-700 leading-relaxed space-y-4">
              {selectedUpdate.description?.split('\n').map((paragraph, idx) => (
                <p key={idx} className={paragraph.trim() === '' ? 'h-4' : ''}>
                  {paragraph}
                </p>
              ))}

              {!selectedUpdate.description && (
                <p className="text-neutral-600 italic">No description provided for this update.</p>
              )}
            </div>

            <div className="p-4 border-t border-[#1f1f1f] light:border-gray-100 bg-[#111111] light:bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedUpdate(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-300 light:text-neutral-700 bg-[#1a1a1a] light:bg-white border border-[#2a2a2a] light:border-gray-200 rounded-lg hover:bg-[#222] light:hover:bg-gray-50 hover:text-white light:hover:text-black transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}