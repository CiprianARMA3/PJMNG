"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../../components/menu"; 
import { 
  ChevronLeft, ChevronRight, X, 
  Calendar as CalendarIcon, Maximize2, 
  Bug, Zap, Hammer, CheckCircle2, AlertTriangle, Layers,
  Clock, Hash, Loader2
} from "lucide-react";

// --- TYPES ---
type Tag = { name: string; color: string; textColor?: string };

type UserProfile = {
  id: string;
  name: string | null;
  surname: string | null;
  metadata: { avatar_url?: string; [key: string]: any };
};

type CalendarItem = {
  id: string;
  type: 'concept' | 'issue';
  title: string;
  description?: string | null;
  date: Date;
  creator: UserProfile | null;
  // Concept specific
  group_name?: string;
  // Issue specific
  status?: string;
  priority?: string;
  issue_type?: string;
  // Shared metadata
  tags?: Tag[];
};

export default function ConceptCalendarPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [showConcepts, setShowConcepts] = useState(true);
  const [showIssues, setShowIssues] = useState(true);

  // View Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  // Day Zoom Modal State
  const [zoomedDay, setZoomedDay] = useState<Date | null>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    const init = async () => {
        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/auth/login"); return; }
        setUser(user);

        // 2. Fetch Project Info (For Menu)
        const { data: proj } = await supabase.from("projects").select("*").eq("id", projectId).single();
        setProject(proj);

        // 3. Fetch Calendar Data
        await fetchData();
    };
    init();
  }, [projectId]);

  async function fetchData() {
    if (!projectId) return;
    setLoading(true);

    const [conceptsRes, issuesRes] = await Promise.all([
      supabase
        .from("concepts")
        .select(`*, creator:users ( id, name, surname, metadata )`)
        .eq("project_id", projectId),
      supabase
        .from("issues")
        .select(`*, creator:users ( id, name, surname, metadata )`)
        .eq("project_id", projectId)
    ]);

    let combinedItems: CalendarItem[] = [];

    if (conceptsRes.data) {
      combinedItems = combinedItems.concat(conceptsRes.data.map((c: any) => ({
        id: c.id,
        type: 'concept',
        title: c.title,
        description: c.description,
        date: new Date(c.created_at),
        creator: c.creator,
        group_name: c.group_name,
        tags: c.metadata?.tags || []
      })));
    }

    if (issuesRes.data) {
      combinedItems = combinedItems.concat(issuesRes.data.map((i: any) => ({
        id: i.id,
        type: 'issue',
        title: i.title,
        description: i.content,
        date: new Date(i.created_at),
        creator: i.creator,
        status: i.status,
        priority: i.priority,
        issue_type: i.type,
        tags: i.metadata?.tags || []
      })));
    }

    setItems(combinedItems);
    setLoading(false);
  }

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Adjust for Monday start (0 = Mon, 6 = Sun)
    let startDayOfWeek = firstDay.getDay() || 7; 
    startDayOfWeek -= 1; 

    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Prev Month Days
    for (let i = startDayOfWeek - 1; i >= 0; i--) { 
        days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) }); 
    }
    // Current Month Days
    for (let i = 1; i <= lastDay.getDate(); i++) { 
        days.push({ day: i, currentMonth: true, date: new Date(year, month, i) }); 
    }
    // Next Month Days (Fill to 42 for 6 rows)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) { 
        days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) }); 
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  
  const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  
  const openItem = (item: CalendarItem) => { 
    setSelectedItem(item);
    setShowModal(true); 
  };

  // --- UI HELPERS ---
  const getIssueIcon = (type?: string) => {
      if (type === 'Bug') return <Bug size={10} className="text-red-400" />;
      if (type === 'Feature') return <Zap size={10} className="text-yellow-400" />;
      return <Hammer size={10} className="text-blue-400" />;
  };

  const getItemStyle = (item: CalendarItem) => {
      if (item.type === 'concept') {
          return "bg-[#1a1a1a] border border-white/5 border-l-2 border-l-purple-500 hover:bg-[#222]";
      }
      if (item.status === 'Resolved') {
          return "bg-[#111] opacity-60 border border-white/5 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:10px_10px]";
      }
      switch (item.priority) {
          case 'Urgent': return "bg-red-950/20 border border-red-500/30 hover:bg-red-900/20";
          case 'High': return "bg-orange-950/20 border border-orange-500/30 hover:bg-orange-900/20";
          default: return "bg-[#161616] border border-white/5 hover:bg-white/5";
      }
  };

  const filteredItems = items.filter(i => {
      if (i.type === 'concept' && !showConcepts) return false;
      if (i.type === 'issue' && !showIssues) return false;
      return true;
  });

 if (loading) {
    return (
      <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-neutral-400 animate-spin fill-white"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
        <style jsx global>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        
        {/* --- SIDEBAR --- */}
        <Menu project={project} user={user} />

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 ml-64 flex flex-col h-full bg-[#0a0a0a]">
            
            {/* Header with Top Margin to prevent overlap */}
            {/* ADDED mt-[60px] HERE */}
            <div className="flex-none h-16 mt-[60px] px-6 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a] z-10 relative">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold tracking-tight">Activity <span className="text-white/30 text-lg font-light">Overview</span></h1>
                    <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                    
                    {/* Month Nav */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-[#161616] rounded-md border border-white/5 p-0.5">
                            <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                            <button onClick={goToToday} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors">Today</button>
                            <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"><ChevronRight size={16} /></button>
                        </div>
                        <h2 className="text-sm font-semibold text-white/90 min-w-[140px]">
                            {currentDate.toLocaleString('default', { month: 'long' })} 
                            <span className="text-white/30 ml-1.5 font-normal">{currentDate.getFullYear()}</span>
                            

                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowConcepts(!showConcepts)} 
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${showConcepts ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-transparent border-white/5 text-white/40 hover:text-white'}`}
                    >
                        <Layers size={12}/> Concepts
                    </button>
                    <button 
                        onClick={() => setShowIssues(!showIssues)} 
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${showIssues ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-transparent border-white/5 text-white/40 hover:text-white'}`}
                    >
                        <Bug size={12}/> Issues
                    </button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="flex-none grid grid-cols-7 border-b border-white/5 bg-[#0a0a0a] z-10">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white/30 bg-[#0a0a0a]">
                    {day}
                </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-[#161616] gap-px border-b border-white/5 min-h-0">
                {calendarDays.map((cell, idx) => {
                const dayItems = filteredItems.filter(i => isSameDay(i.date, cell.date));
                const isToday = isSameDay(cell.date, new Date());
                
                const MAX_VISIBLE = 4;
                const visibleItems = dayItems.slice(0, MAX_VISIBLE);
                const hiddenCount = dayItems.length - MAX_VISIBLE;

                return (
                    <div 
                    key={idx} 
                    className={`
                        relative bg-[#0a0a0a] p-1.5 flex flex-col gap-1 group transition-colors hover:bg-[#0f0f0f] min-h-0 overflow-hidden
                        ${!cell.currentMonth ? "bg-[#0a0a0a]/50 text-white/20" : "text-white"}
                    `}
                    onClick={(e) => { if(e.target === e.currentTarget) setZoomedDay(cell.date); }}
                    >
                        <div className="flex-none flex justify-between items-start mb-1 pointer-events-none">
                            <span className={`
                                text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                                ${isToday ? "bg-purple-600 text-white" : "text-white/40 group-hover:text-white"}
                            `}>
                                {cell.day}
                            </span>
                            <button 
                                className="pointer-events-auto opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded text-white/40 hover:text-white transition-all"
                                onClick={(e) => { e.stopPropagation(); setZoomedDay(cell.date); }}
                            >
                                <Maximize2 size={10} />
                            </button>
                        </div>

                        {/* Items List (Tiny) */}
                        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                            {visibleItems.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={(e) => { e.stopPropagation(); openItem(item); }}
                                    className={`
                                        cursor-pointer px-1.5 py-1 rounded text-[10px] shadow-sm group/card flex-shrink-0 flex items-center gap-1.5 transition-all
                                        ${getItemStyle(item)}
                                    `}
                                >
                                    {item.type === 'issue' ? (
                                        <>
                                            {getIssueIcon(item.issue_type)}
                                            <span className={`truncate ${item.status === 'Resolved' ? 'line-through text-white/30' : 'text-gray-300'}`}>{item.title}</span>
                                        </>
                                    ) : (
                                        <span className="truncate text-gray-300 pl-1">{item.title}</span>
                                    )}
                                </div>
                            ))}
                            
                            {hiddenCount > 0 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setZoomedDay(cell.date); }}
                                    className="mt-auto text-[9px] font-bold text-white/40 hover:text-white text-left hover:bg-white/5 p-1 rounded transition-colors"
                                >
                                    + {hiddenCount} more
                                </button>
                            )}
                        </div>
                    </div>
                );
                })}
            </div>
        </main>

        {/* --- DAY ZOOM MODAL --- */}
        {zoomedDay && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                <div className="bg-[#161616] w-full max-w-lg rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
                        <div>
                            <div className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">
                                {zoomedDay.getFullYear()}
                            </div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {zoomedDay.toLocaleString('default', { weekday: 'long' })}, {zoomedDay.getDate()} {zoomedDay.toLocaleString('default', { month: 'long' })}
                            </h2>
                        </div>
                        <button onClick={() => setZoomedDay(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto scrollbar-hide bg-[#0a0a0a]">
                        {(() => {
                            const dayItems = filteredItems.filter(i => isSameDay(i.date, zoomedDay));
                            
                            if (dayItems.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-12 text-white/30">
                                        <CalendarIcon size={32} className="mb-3 opacity-30" />
                                        <p className="text-sm font-medium">No activity recorded for this day.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-2">
                                    {dayItems.map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => openItem(item)}
                                            className={`
                                                cursor-pointer p-4 rounded-lg border transition-all group/card flex flex-col gap-2 relative overflow-hidden
                                                ${getItemStyle(item)}
                                            `}
                                        >
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {item.type === 'issue' && (
                                                        <div className="flex-none p-1 rounded bg-black/30 border border-white/5">
                                                            {getIssueIcon(item.issue_type)}
                                                        </div>
                                                    )}
                                                    <h3 className={`font-medium text-sm truncate ${item.status === 'Resolved' ? "line-through text-white/30" : "text-gray-100"}`}>
                                                        {item.title}
                                                    </h3>
                                                </div>
                                                {item.type === 'concept' && <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">Concept</span>}
                                                {item.type === 'issue' && <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${item.status === 'Resolved' ? 'bg-green-900/10 text-green-500 border-green-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}>{item.status}</span>}
                                            </div>

                                            {item.description && <p className="text-xs text-white/40 line-clamp-1 pl-1">{item.description}</p>}
                                            
                                            <div className="flex items-center justify-between pt-3 border-t border-white/5 border-dashed mt-1">
                                                <div className="flex items-center gap-2">
                                                    {item.creator?.metadata?.avatar_url && (
                                                        <img src={item.creator.metadata.avatar_url} className="w-5 h-5 rounded-full border border-white/10" alt="" />
                                                    )}
                                                    <span className="text-[10px] text-white/30">
                                                        {item.creator?.name || "Unknown"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 justify-end">
                                                    {item.tags && item.tags.slice(0, 4).map((t, i) => (
                                                        <span 
                                                            key={i} 
                                                            className="text-[9px] px-1.5 py-0.5 rounded border font-medium"
                                                            style={{ 
                                                                backgroundColor: `${t.color}15`,
                                                                borderColor: `${t.color}30`,
                                                                color: t.color 
                                                            }}
                                                        >
                                                            {t.name}
                                                        </span>
                                                    ))}
                                                    {item.tags && item.tags.length > 4 && <span className="text-[9px] text-white/20 px-1">+{item.tags.length - 4}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        )}

        {/* --- READ-ONLY DETAILS MODAL --- */}
        {showModal && selectedItem && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                <div className="bg-[#161616] w-full max-w-lg rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                    
                    {/* Modal Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-start bg-[#1a1a1a]">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs text-white/40 uppercase font-bold tracking-wider mb-1">
                                <CalendarIcon size={12} /> 
                                {new Date(selectedItem.date).toLocaleDateString()}
                                <span className="text-white/20">•</span>
                                <span className={selectedItem.type === 'issue' ? "text-blue-400" : "text-purple-400"}>
                                    {selectedItem.type === 'issue' ? 'Issue' : 'Concept'}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white leading-tight">
                                {selectedItem.title}
                            </h2>
                        </div>
                        <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-lg hover:bg-white/10"><X size={20} /></button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide bg-[#161616]">
                        
                        {/* Tags Section */}
                        {selectedItem.tags && selectedItem.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedItem.tags.map((tag, idx) => (
                                    <span 
                                        key={idx} 
                                        className="text-xs px-2.5 py-1 rounded-md font-medium border"
                                        style={{ 
                                            backgroundColor: `${tag.color}15`, 
                                            borderColor: `${tag.color}30`,
                                            color: tag.color 
                                        }}
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Description Section */}
                        <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5">
                            <label className="text-[10px] font-bold text-white/30 uppercase block mb-3 flex items-center gap-2">
                                Description
                            </label>
                            <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-light">
                                {selectedItem.description || <span className="text-white/20 italic">No description provided.</span>}
                            </div>
                        </div>
                        
                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {selectedItem.type === 'issue' && (
                                <>
                                    <div className="p-3 bg-[#0a0a0a] rounded border border-white/5">
                                        <label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Priority</label>
                                        <div className="flex items-center gap-2 text-sm text-white/80">
                                            {selectedItem.priority === 'Urgent' ? <AlertTriangle size={14} className="text-red-500"/> : <Hash size={14} className="text-white/20"/>}
                                            {selectedItem.priority}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-[#0a0a0a] rounded border border-white/5">
                                        <label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Status</label>
                                        <div className="flex items-center gap-2 text-sm text-white/80">
                                            {selectedItem.status === 'Resolved' ? <CheckCircle2 size={14} className="text-green-500"/> : <Clock size={14} className="text-white/20"/>}
                                            {selectedItem.status}
                                        </div>
                                    </div>
                                </>
                            )}
                            {selectedItem.type === 'concept' && selectedItem.group_name && (
                                <div className="p-3 bg-[#0a0a0a] rounded border border-white/5 col-span-2">
                                    <label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Group List</label>
                                    <div className="text-sm text-white/80">{selectedItem.group_name}</div>
                                </div>
                            )}
                        </div>

                        {/* Creator Footer */}
                        <div className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/5 items-center">
                            <div className="w-10 h-10 rounded-full bg-[#222] border border-white/10 flex items-center justify-center font-bold text-white/60 overflow-hidden">
                                {selectedItem.creator?.metadata?.avatar_url ? (
                                    <img src={selectedItem.creator.metadata.avatar_url} className="w-full h-full object-cover"/>
                                ) : (
                                    selectedItem.creator?.name?.[0] || "?"
                                )}
                            </div>
                            <div>
                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Created By</div>
                                <div className="text-sm font-medium text-white">{selectedItem.creator?.name || "Unknown User"} {selectedItem.creator?.surname}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}