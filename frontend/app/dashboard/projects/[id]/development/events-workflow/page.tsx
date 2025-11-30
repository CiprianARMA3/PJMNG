"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../../components/menu"; 
import { 
  Calendar as CalendarIcon, Table as TableIcon, 
  X, ChevronLeft, ChevronRight,
  Clock, Video, ExternalLink, Minimize2, Maximize2, Tag as TagIcon,
  Loader2
} from "lucide-react";

// --- TYPES ---
type Tag = { name: string; color: string; textColor?: string };

type UserProfile = {
  id: string;
  name: string | null;
  metadata: { avatar_url?: string; [key: string]: any };
};

type LinkedIssue = {
  id: string;
  title: string;
  type: string;
  metadata: { tags?: Tag[]; [key: string]: any };
};

type Task = {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  status: string;
  task_date: string;
  start_time: string;
  end_time: string;
  issue_id?: string | null;
  issue?: LinkedIssue | null;
  creator_id: string | null;
  creator?: UserProfile | null; 
  metadata: {
    meeting_link?: string;
    attendees?: string[]; 
    tags?: Tag[]; 
    [key: string]: any;
  };
};

export default function CalendarPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  
  // View State
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [numDaysInView, setNumDaysInView] = useState(7); 
  const [hourHeight, setHourHeight] = useState(80);

  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // --- CONFIG ---
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const GRID_TOTAL_HEIGHT = 24 * hourHeight;

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);

      const { data: proj } = await supabase.from("projects").select("*").eq("id", projectId).single();
      setProject(proj);

      await fetchData();
    };
    init();
  }, [projectId]);

  // --- SCROLL LOCKING ---
  useEffect(() => {
    if (selectedTask) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [selectedTask]);

  const fetchData = async () => {
    setLoading(true);
    const { data: tasksData } = await supabase
        .from("tasks")
        .select(`*, issue:issue_id(id, title, type, metadata), creator:creator_id(id, name, metadata)`)
        .eq("project_id", projectId);
    
    if (tasksData) setTasks(tasksData as any);

    const { data: usersData } = await supabase
        .from("project_users")
        .select("user:users(id, name, metadata)")
        .eq("project_id", projectId);
    
    if (usersData) {
        const map: Record<string, UserProfile> = {};
        usersData.forEach((u: any) => { if(u.user) map[u.user.id] = u.user; });
        const { data: currentUser } = await supabase.from("users").select("*").eq("id", (await supabase.auth.getUser()).data.user?.id).single();
        if(currentUser) map[currentUser.id] = currentUser as any;
        setUserMap(map);
    }
    setLoading(false);
  };

  // --- HELPER LOGIC ---
  const getStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const newDate = new Date(d.setDate(diff));
    newDate.setHours(0,0,0,0);
    return newDate;
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(startDate);
    if (numDaysInView > 1) {
        newDate.setDate(startDate.getDate() + (direction * numDaysInView)); 
    } else {
        newDate.setDate(startDate.getDate() + direction);
    }
    setStartDate(newDate);
  };

  const isSameDay = (d1: Date, dateStr: string) => {
      const d2 = new Date(dateStr);
      return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  // --- VISUALIZATION LOGIC ---
  const getEventStyle = (task: Task, dayTasks: Task[]) => {
      const toMinutes = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
      };

      const startMins = toMinutes(task.start_time);
      const endMins = toMinutes(task.end_time);
      
      const overlaps = dayTasks.filter(t => {
          const tStart = toMinutes(t.start_time);
          const tEnd = toMinutes(t.end_time);
          return startMins < tEnd && endMins > tStart;
      });
      overlaps.sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time) || a.id.localeCompare(b.id));
      
      const index = overlaps.findIndex(t => t.id === task.id);
      const total = overlaps.length;

      const top = (startMins / 60) * hourHeight;
      const height = ((endMins - startMins) / 60) * hourHeight;
      const widthPercent = 100 / total;
      const leftPercent = index * widthPercent;

      const taskEndDateTime = new Date(`${task.task_date}T${task.end_time}`);
      const isPast = taskEndDateTime < new Date();
      
      // --- STRICT COLOR PALETTE ---
      const colorMap = {
          default: { bg: 'bg-blue-600/10', border: 'border-blue-500/50', bar: 'border-l-blue-500', text: 'text-blue-100' },
          bug:     { bg: 'bg-red-600/10', border: 'border-red-500/50', bar: 'border-l-red-500', text: 'text-red-100' },
          feature: { bg: 'bg-purple-600/10', border: 'border-purple-500/50', bar: 'border-l-purple-500', text: 'text-purple-100' },
      };

      let theme = colorMap.default;
      if (task.issue?.type === 'Bug') theme = colorMap.bug;
      if (task.issue?.type === 'Feature') theme = colorMap.feature;

      return {
          style: {
              top: `${top}px`,
              height: `${Math.max(height, 32)}px`,
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              zIndex: 10 + index
          },
          theme,
          isPast
      };
  };

  const dateStrip = useMemo(() => {
    const days = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    for (let i = 0; i < numDaysInView; i++) {
        days.push(new Date(startDate.getTime() + i * msPerDay));
    }
    return days;
  }, [startDate, numDaysInView]);

  const currentTimeMarker = useMemo(() => {
      const now = new Date();
      const isInView = dateStrip.some(d => isSameDay(d, now.toISOString()));
      if (!isInView) return null;
      const mins = now.getHours() * 60 + now.getMinutes();
      return (mins / 60) * hourHeight;
  }, [dateStrip, hourHeight]);

  const getTaskTags = (task: Task) => {
    const issueTags = task.issue?.metadata?.tags || [];
    const taskTags = task.metadata?.tags || [];
    return [...issueTags, ...taskTags];
  };

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
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #262626; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
        
        .past-event-striped {
            background-image: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 5px,
                rgba(0,0,0,0.3) 5px,
                rgba(0,0,0,0.3) 10px
            );
        }
      `}</style>

      {/* --- SIDEBAR --- */}
      <Menu project={project} user={user} />
      
      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 ml-64 flex flex-col h-full bg-[#0a0a0a]">
        
        {/* --- HEADER --- */}
        <div className="flex-none h-16 mt-[60px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a] z-20">
            <div className="flex items-center gap-6">
                <h1 className="text-xl font-bold tracking-tight">Calendar<span className="text-white/30 text-lg font-light ml-1">Overview</span></h1>
                <div className="h-6 w-px bg-white/10"></div>
                
                {/* Date Navigation */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#161616] rounded-md border border-white/5 p-0.5">
                        <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white"><ChevronLeft size={16}/></button>
                        <button onClick={() => setStartDate(getStartOfWeek(new Date()))} className="px-3 text-[11px] font-bold uppercase text-white/60 hover:text-white">Today</button>
                        <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-white/10 rounded text-white/60"><ChevronRight size={16}/></button>
                    </div>
                    <h2 className="text-sm font-semibold text-white/90 min-w-[140px]">
                        {startDate.toLocaleString('default', { month: 'long', day: 'numeric' })} 
                        <span className="text-white/30 ml-1.5 font-normal">{startDate.getFullYear()}</span>
                    </h2>
                </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-3">
                 {viewMode === 'calendar' && (
                    <>
                        <div className="flex bg-[#161616] rounded-md border border-white/5 p-0.5">
                            <button onClick={() => setHourHeight(60)} className={`p-2 rounded text-white/60 hover:text-white ${hourHeight === 60 ? 'bg-white/10' : ''}`} title="Compact View"><Minimize2 size={16}/></button>
                            <button onClick={() => setHourHeight(120)} className={`p-2 rounded text-white/60 hover:text-white ${hourHeight === 120 ? 'bg-white/10' : ''}`} title="Expanded View"><Maximize2 size={16}/></button>
                        </div>
                        <div className="hidden sm:flex bg-[#161616] rounded-md border border-white/5 p-0.5">
                            {[1, 3, 5, 7].map(n => (
                                <button key={n} onClick={() => setNumDaysInView(n)} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${numDaysInView === n ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>{n} Days</button>
                            ))}
                        </div>
                    </>
                 )}
                 <div className="h-6 w-px bg-white/10"></div>
                 <div className="flex bg-[#161616] rounded-md border border-white/5 p-0.5">
                    <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                        <CalendarIcon size={14}/> Calendar
                    </button>
                    <button onClick={() => setViewMode('table')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                        <TableIcon size={14}/> Table
                    </button>
                 </div>
            </div>
        </div>

        <div className="flex-1 overflow-hidden bg-[#0a0a0a] relative flex flex-col">
            
            {/* CALENDAR VIEW */}
            {viewMode === 'calendar' && (
                <div className="flex-1 overflow-y-auto relative flex flex-col">
                    
                    {/* Sticky Day Headers */}
                    <div className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/5 flex flex-none h-12">
                         <div className="w-14 flex-none border-r border-white/5 bg-[#0a0a0a]" />
                         <div className="flex-1 flex">
                            {dateStrip.map((day, i) => {
                                const isToday = isSameDay(day, new Date().toISOString());
                                return (
                                    <div key={i} className="flex-1 border-r border-white/5 flex items-center justify-center gap-2 last:border-r-0">
                                        <span className={`text-xs uppercase font-bold tracking-wider ${isToday ? 'text-purple-400' : 'text-white/40'}`}>{day.toLocaleString('default', { weekday: 'short' })}</span>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-purple-600 text-white' : 'text-white/80'}`}>{day.getDate()}</div>
                                    </div>
                                );
                            })}
                         </div>
                    </div>

                    {/* Scrollable Grid Area */}
                    <div className="flex flex-1 relative min-h-0">
                        {/* 1. Time Column */}
                        <div className="w-14 flex-none border-r border-white/5 bg-[#0a0a0a] relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                             {HOURS.map(h => (
                                <div key={h} className="absolute w-full text-right pr-2 text-xs font-medium text-white/20" style={{ top: h * hourHeight, transform: 'translateY(-50%)' }}>
                                    {h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`}
                                </div>
                            ))}
                            {/* Spacer for the last tick */}
                            <div style={{ top: 24 * hourHeight, height: 1 }} className="absolute w-full"></div>
                        </div>

                        {/* 2. Main Grid */}
                        <div className="flex-1 relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                            {/* Render rows for all 24 hours */}
                            {HOURS.map(h => (
                                <div key={h} className="absolute w-full border-b border-white/5" style={{ top: h * hourHeight, height: hourHeight }}>
                                    <div className="absolute top-1/2 w-full border-t border-white/[0.02] border-dashed"></div> 
                                </div>
                            ))}
                            {/* Bottom border for the last hour */}
                             <div className="absolute w-full border-b border-white/5" style={{ top: 24 * hourHeight, height: 1 }}></div>
                            
                            {/* Current Time Marker */}
                            {currentTimeMarker !== null && (
                                <div className="absolute w-full z-10 pointer-events-none border-t border-red-500/50" style={{ top: currentTimeMarker }}>
                                    <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-red-500 -mt-1.5"></div>
                                </div>
                            )}
                            
                            {/* Columns & Events */}
                            <div className="absolute inset-0 flex h-full">
                                {dateStrip.map((day, colIndex) => {
                                    const dayTasks = tasks.filter(t => isSameDay(day, t.task_date));
                                    return (
                                        <div key={colIndex} className="flex-1 border-r border-white/5 last:border-r-0 relative h-full group/col hover:bg-white/[0.01] transition-colors">
                                            {dayTasks.map(task => {
                                                const { style, theme, isPast } = getEventStyle(task, dayTasks);
                                                const tags = getTaskTags(task);
                                                return (
                                                    <div 
                                                        key={task.id}
                                                        onClick={() => setSelectedTask(task)}
                                                        style={style}
                                                        className={`
                                                            absolute rounded-md px-2 py-1.5 cursor-pointer transition-all border-l-[3px] overflow-hidden flex flex-col justify-start
                                                            hover:brightness-110 hover:z-50 hover:shadow-lg shadow-sm
                                                            ${theme.bg} ${theme.border} ${theme.bar} ${theme.text}
                                                            ${isPast ? 'past-event-striped opacity-60 saturate-50' : ''}
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-1.5 min-w-0 mb-0.5">
                                                            {task.issue && (<div className={`flex-none w-2 h-2 rounded-full ${task.issue.type === 'Bug' ? 'bg-red-400' : 'bg-purple-400'}`}></div>)}
                                                            <span className="text-xs font-bold truncate leading-tight">{task.title}</span>
                                                        </div>
                                                        
                                                        {parseInt(style.height) > 40 && (
                                                            <div className="text-[10px] opacity-70 truncate mb-1">
                                                                {task.start_time.slice(0,5)} - {task.end_time.slice(0,5)}
                                                            </div>
                                                        )}

                                                        {parseInt(style.height) > 60 && tags.length > 0 && (
                                                            <div className="flex gap-1 flex-wrap overflow-hidden max-h-[20px]">
                                                                {tags.slice(0, 3).map((tag, i) => (
                                                                    <span 
                                                                        key={i} 
                                                                        className="text-[9px] px-1.5 py-0.5 rounded-[3px] border font-medium"
                                                                        style={{ 
                                                                            borderColor: `${tag.color}40`, 
                                                                            color: tag.color, 
                                                                            backgroundColor: `${tag.color}20` 
                                                                        }}
                                                                    >
                                                                        {tag.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {/* Bottom Spacer */}
                    <div className="h-10 flex-none bg-[#0a0a0a]"></div>
                </div>
            )}

            {/* TABLE VIEW */}
            {viewMode === 'table' && (
                 <div className="flex-1 overflow-auto p-6">
                    <table className="w-full text-left text-sm text-white/70 border-collapse">
                        <thead className="text-[10px] uppercase font-bold text-white/40 bg-[#0a0a0a] sticky top-0 border-b border-white/5 z-10">
                            <tr>
                                <th className="px-4 py-3">Date & Time</th>
                                <th className="px-4 py-3">Event</th>
                                <th className="px-4 py-3">Linked Issue</th>
                                <th className="px-4 py-3">Tags</th>
                                <th className="px-4 py-3">Attendees</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tasks.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-12 text-white/20 italic">No events found for this project.</td></tr>
                            ) : tasks.sort((a,b) => a.task_date.localeCompare(b.task_date)).map(task => {
                                const taskEnd = new Date(`${task.task_date}T${task.end_time}`);
                                const isPast = taskEnd < new Date();
                                const tags = getTaskTags(task);
                                return (
                                    <tr key={task.id} onClick={() => setSelectedTask(task)} className={`cursor-pointer transition-colors ${isPast ? 'opacity-50 hover:opacity-100 past-event-striped' : 'hover:bg-[#111]'}`}>
                                        <td className="px-4 py-3 font-mono text-xs text-white/50">
                                            <div className="text-white/80 font-bold">{new Date(task.task_date).toLocaleDateString()}</div>
                                            <div className="opacity-50 mt-0.5">{task.start_time.slice(0,5)} - {task.end_time.slice(0,5)}</div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-white text-base">{task.title}</td>
                                        <td className="px-4 py-3">
                                            {task.issue ? (
                                                <span className={`text-[10px] px-2 py-1 rounded border font-medium ${task.issue.type === 'Bug' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                    {task.issue.type}: {task.issue.title}
                                                </span>
                                            ) : <span className="text-white/10">-</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5 flex-wrap">
                                                {tags.map((tag, i) => (
                                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}10` }}>{tag.name}</span>
                                                ))}
                                                {tags.length === 0 && <span className="text-xs text-white/10">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex -space-x-2">
                                                {(task.metadata?.attendees || []).map((uid, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-[#222] border-2 border-[#1a1a1a] overflow-hidden hover:z-10 relative transition-transform hover:scale-110" title={userMap[uid]?.name || ""}>
                                                        {userMap[uid]?.metadata?.avatar_url ? <img src={userMap[uid].metadata.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[10px]">{userMap[uid]?.name?.[0]}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                 </div>
            )}
        </div>
      </main>

      {/* --- GLOBAL FIXED MODAL --- */}
      {selectedTask && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[#161616] border border-white/10 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#1a1a1a]">
                      <div className="space-y-1">
                          {selectedTask.issue && (
                              <div className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider mb-2 border ${selectedTask.issue.type === 'Bug' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                  Linked {selectedTask.issue.type}
                              </div>
                          )}
                          <h3 className="font-bold text-2xl text-white leading-tight">{selectedTask.title}</h3>
                      </div>
                      <button onClick={() => setSelectedTask(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"><X size={20} /></button>
                  </div>

                  <div className="p-6 space-y-6 overflow-y-auto">
                      {/* Tags Section */}
                      {getTaskTags(selectedTask).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                              {getTaskTags(selectedTask).map((tag, i) => (
                                  <span key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border font-medium" style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30`, color: tag.color }}>
                                      <TagIcon size={12} /> {tag.name}
                                  </span>
                              ))}
                          </div>
                      )}

                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                          <div className="p-3 bg-[#0a0a0a] rounded-lg border border-white/5 text-center min-w-[70px]">
                              <div className="text-[10px] uppercase font-bold text-white/40">{new Date(selectedTask.task_date).toLocaleString('default', { month: 'short'})}</div>
                              <div className="text-2xl font-bold text-white">{new Date(selectedTask.task_date).getDate()}</div>
                          </div>
                          <div className="space-y-1">
                              <div className="flex items-center gap-2 text-white/90 text-base font-bold">
                                  <Clock size={16} className="text-white/40"/>
                                  {selectedTask.start_time.slice(0,5)} - {selectedTask.end_time.slice(0,5)}
                              </div>
                              <div className="text-sm text-white/50 flex items-center gap-2">
                                  <span>Created by</span>
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0a0a0a] rounded-full border border-white/5">
                                      <div className="w-4 h-4 rounded-full bg-[#222] overflow-hidden">
                                          {selectedTask.creator?.metadata?.avatar_url ? <img src={selectedTask.creator.metadata.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[8px]">{selectedTask.creator?.name?.[0]}</div>}
                                      </div>
                                      <span className="text-xs font-medium text-white/80">{selectedTask.creator?.name || "Unknown"}</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {selectedTask.description && (
                          <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold text-white/40">Description</label>
                              <div className="text-sm text-white/70 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5 whitespace-pre-wrap">
                                  {selectedTask.description}
                              </div>
                          </div>
                      )}

                      {selectedTask.metadata?.meeting_link && (
                           <a href={selectedTask.metadata.meeting_link} target="_blank" className="flex items-center justify-center gap-2 p-3 w-full rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-sm font-bold transition-all hover:scale-[1.02]">
                              <Video size={16} /> Join Google Meet <ExternalLink size={12}/>
                           </a>
                      )}

                      <div className="pt-4 border-t border-white/5">
                          <label className="text-[10px] uppercase font-bold text-white/40 block mb-3">Attendees ({selectedTask.metadata?.attendees?.length || 0})</label>
                          <div className="flex flex-wrap gap-2">
                              {(selectedTask.metadata?.attendees || []).map((uid) => (
                                  <div key={uid} className="flex items-center gap-2 p-2 pr-3 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                                      <div className="w-6 h-6 rounded-full bg-[#222] border border-white/10 overflow-hidden">
                                          {userMap[uid]?.metadata?.avatar_url ? <img src={userMap[uid].metadata.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[8px]">{userMap[uid]?.name?.[0]}</div>}
                                      </div>
                                      <span className="text-xs font-medium text-white/80">{userMap[uid]?.name}</span>
                                  </div>
                              ))}
                              {(selectedTask.metadata?.attendees || []).length === 0 && <span className="text-sm text-white/30 italic">No attendees have joined this event yet.</span>}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}