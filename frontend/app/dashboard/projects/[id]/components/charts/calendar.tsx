"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Calendar as CalendarIcon, Table as TableIcon, 
  X, ChevronLeft, ChevronRight,
  Clock, Video, ExternalLink, Minimize2, Maximize2, Tag as TagIcon
} from "lucide-react";
import { useParams } from "next/navigation";

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

export default function ProjectCalendar() {
  const supabase = createClient();
  const params = useParams();
  const projectId = params.id as string;

  // --- STATE ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  
  // View State
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [numDaysInView, setNumDaysInView] = useState(7); 
  const [hourHeight, setHourHeight] = useState(60); 

  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // --- CONFIG ---
  const START_HOUR = 0;
  const END_HOUR = 24;
  const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId]);

  // --- SCROLL LOCKING EFFECT ---
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
      const durationMins = endMins - startMins;

      // Overlap detection
      const overlaps = dayTasks.filter(t => {
          const tStart = toMinutes(t.start_time);
          const tEnd = toMinutes(t.end_time);
          return startMins < tEnd && endMins > tStart;
      });

      overlaps.sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time) || a.id.localeCompare(b.id));
      
      const index = overlaps.findIndex(t => t.id === task.id);
      const total = overlaps.length;

      const top = (startMins / 60) * hourHeight;
      const height = (durationMins / 60) * hourHeight;
      const widthPercent = 100 / total;
      const leftPercent = index * widthPercent;

      const taskEndDateTime = new Date(`${task.task_date}T${task.end_time}`);
      const isPast = taskEndDateTime < new Date();
      
      const colorMap: any = {
          purple: { bg: 'bg-purple-600/10', border: 'border-purple-500', text: 'text-purple-100' },
          red: { bg: 'bg-red-600/10', border: 'border-red-500', text: 'text-red-100' },
          green: { bg: 'bg-purple-600/10', border: 'border-purple-500', text: 'text-purple-100' },
      };

      let theme = colorMap.purple;
      if (task.issue?.type === 'Bug') theme = colorMap.red;
      if (task.issue?.type === 'Feature') theme = colorMap.purple;

      return {
          style: {
              top: `${top}px`,
              height: `${Math.max(height, 28)}px`, 
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
          <div className="h-[600px] w-full rounded-xl border border-white/5 bg-[#0a0a0a] flex items-center justify-center">
             <div className="w-6 h-6 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <div className="h-[600px] bg-[#0a0a0a] rounded-xl border border-white/5 flex flex-col overflow-hidden font-sans shadow-inner relative">
        <style jsx global>{`
            .widget-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
            .widget-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .widget-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
            .widget-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }

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
        
        {/* --- WIDGET HEADER --- */}
        <div className="flex-none h-12 px-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
             <div className="flex items-center gap-3">
                 <div className="flex items-center bg-[#161616] rounded-md border border-white/5 p-0.5">
                    <button onClick={() => navigateDate(-1)} className="p-1 hover:bg-white/10 rounded text-white/60"><ChevronLeft size={14}/></button>
                    <button onClick={() => setStartDate(getStartOfWeek(new Date()))} className="px-2 text-[10px] font-bold uppercase text-white/60 hover:text-white">Today</button>
                    <button onClick={() => navigateDate(1)} className="p-1 hover:bg-white/10 rounded text-white/60"><ChevronRight size={14}/></button>
                 </div>
                 <h2 className="text-xs font-semibold text-white/80">
                    {startDate.toLocaleString('default', { month: 'short', day: 'numeric' })}
                    {numDaysInView > 1 && ` - ${dateStrip[dateStrip.length-1].getDate()}`}
                 </h2>
            </div>
            
            <div className="flex items-center gap-2">
                {viewMode === 'calendar' && (
                    <div className="flex bg-[#161616] rounded-md border border-white/5 p-0.5">
                        <button onClick={() => setHourHeight(60)} className={`p-1.5 rounded text-white/60 hover:text-white ${hourHeight === 60 ? 'bg-white/10' : ''}`}><Minimize2 size={14}/></button>
                        <button onClick={() => setHourHeight(120)} className={`p-1.5 rounded text-white/60 hover:text-white ${hourHeight === 120 ? 'bg-white/10' : ''}`}><Maximize2 size={14}/></button>
                    </div>
                )}
                 {viewMode === 'calendar' && (
                    <div className="hidden sm:flex bg-[#161616] rounded-md border border-white/5 p-0.5">
                        {[1, 3, 5, 7].map(n => (
                            <button key={n} onClick={() => setNumDaysInView(n)} className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${numDaysInView === n ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>{n}D</button>
                        ))}
                    </div>
                 )}
                 <div className="flex bg-[#161616] rounded-md border border-white/5 p-0.5">
                    <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md text-white/60 transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'hover:text-white'}`}><CalendarIcon size={12}/></button>
                    <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md text-white/60 transition-all ${viewMode === 'table' ? 'bg-white/10 text-white' : 'hover:text-white'}`}><TableIcon size={12}/></button>
                 </div>
            </div>
        </div>

        {/* --- CALENDAR VIEW --- */}
        {viewMode === 'calendar' && (
            // Single Scrollable Container
            <div className="flex-1 overflow-y-auto widget-scrollbar bg-[#0a0a0a] relative flex flex-col">
                
                {/* Sticky Header Row */}
                <div className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/5 flex flex-none h-8">
                     {/* Corner Spacer (matches time col width) */}
                     <div className="w-10 flex-none border-r border-white/5 bg-[#0a0a0a]" />
                     
                     {/* Day Headers */}
                     <div className="flex-1 flex">
                        {dateStrip.map((day, i) => {
                            const isToday = isSameDay(day, new Date().toISOString());
                            return (
                                <div key={i} className="flex-1 border-r border-white/5 flex items-center justify-center gap-1.5 last:border-r-0">
                                    <span className={`text-[9px] uppercase font-bold tracking-wider ${isToday ? 'text-purple-400' : 'text-white/40'}`}>{day.toLocaleString('default', { weekday: 'short' })}</span>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isToday ? 'bg-purple-600 text-white' : 'text-white/80'}`}>{day.getDate()}</div>
                                </div>
                            );
                        })}
                     </div>
                </div>

                {/* Main Content (Time + Grid) */}
                <div className="flex flex-1 relative" style={{ height: (END_HOUR - START_HOUR) * hourHeight }}>
                    
                    {/* Time Column (Scrolls with grid) */}
                    <div className="w-10 flex-none border-r border-white/5 bg-[#0a0a0a] relative">
                         {HOURS.map(h => (
                            <div key={h} className="absolute w-full text-right pr-1.5 text-[9px] font-medium text-white/20" style={{ top: h * hourHeight, transform: 'translateY(-50%)' }}>
                                {h === 0 ? '' : h}
                            </div>
                        ))}
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 relative">
                        {/* Horizontal Hour Lines */}
                        {HOURS.map(h => (
                            <div key={h} className="absolute w-full border-b border-white/5" style={{ top: h * hourHeight, height: hourHeight }}></div>
                        ))}
                        
                        {/* Current Time Marker */}
                        {currentTimeMarker !== null && (
                            <div className="absolute w-full z-10 pointer-events-none border-t border-red-500/50" style={{ top: currentTimeMarker }}>
                                <div className="absolute -left-1 w-2 h-2 rounded-full bg-red-500 -mt-1"></div>
                            </div>
                        )}
                        
                        {/* Columns & Events */}
                        <div className="absolute inset-0 flex">
                            {dateStrip.map((day, colIndex) => {
                                const dayTasks = tasks.filter(t => isSameDay(day, t.task_date));
                                return (
                                    <div key={colIndex} className="flex-1 border-r border-white/5 last:border-r-0 relative h-full group/col">
                                        {dayTasks.map(task => {
                                            const { style, theme, isPast } = getEventStyle(task, dayTasks);
                                            const tags = getTaskTags(task);
                                            return (
                                                <div 
                                                    key={task.id}
                                                    onClick={() => setSelectedTask(task)}
                                                    style={style}
                                                    className={`
                                                        absolute rounded-[3px] px-1.5 py-1 cursor-pointer transition-all border-l-2 overflow-hidden flex flex-col justify-start
                                                        hover:brightness-110 hover:z-50 shadow-sm
                                                        ${theme.bg} ${theme.border} ${theme.text}
                                                        ${isPast ? 'past-event-striped opacity-60 saturate-50' : ''}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        {task.issue && (<div className={`flex-none w-1.5 h-1.5 rounded-full ${task.issue.type === 'Bug' ? 'bg-red-400' : 'bg-purple-400'}`}></div>)}
                                                        <span className="text-[10px] font-bold truncate leading-tight">{task.title}</span>
                                                    </div>
                                                    
                                                    {/* TAGS IN CARD */}
                                                    {parseInt(style.height) > 50 && tags.length > 0 && (
                                                        <div className="flex gap-1 mt-1 flex-wrap overflow-hidden h-[18px]">
                                                            {tags.slice(0, 2).map((tag, i) => (
                                                                <span 
                                                                    key={i} 
                                                                    className="text-[9px] px-1 rounded-[2px] border font-medium"
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
            </div>
        )}

        {/* --- TABLE VIEW --- */}
        {viewMode === 'table' && (
             <div className="flex-1 overflow-auto widget-scrollbar p-2">
                <table className="w-full text-left text-xs text-white/70 border-collapse">
                    <thead className="text-[9px] uppercase font-bold text-white/40 bg-[#0a0a0a] sticky top-0 border-b border-white/5 z-10">
                        <tr>
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Event</th>
                            <th className="px-3 py-2">Tags</th>
                            <th className="px-3 py-2">Attendees</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {tasks.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-white/20 italic">No events found</td></tr>
                        ) : tasks.sort((a,b) => a.task_date.localeCompare(b.task_date)).map(task => {
                            const taskEnd = new Date(`${task.task_date}T${task.end_time}`);
                            const isPast = taskEnd < new Date();
                            const tags = getTaskTags(task);
                            return (
                                <tr key={task.id} onClick={() => setSelectedTask(task)} className={`cursor-pointer transition-colors ${isPast ? 'opacity-50 hover:opacity-100 past-event-striped' : 'hover:bg-[#111]'}`}>
                                    <td className="px-3 py-2 font-mono text-[10px] text-white/50">
                                        <div className="text-white/80">{new Date(task.task_date).toLocaleDateString()}</div>
                                        <div className="opacity-50">{task.start_time.slice(0,5)}</div>
                                    </td>
                                    <td className="px-3 py-2 font-medium text-white">{task.title}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex gap-1 flex-wrap">
                                            {tags.map((tag, i) => (
                                                <span key={i} className="text-[9px] px-1 rounded border" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</span>
                                            ))}
                                            {tags.length === 0 && <span className="text-[9px] text-white/10">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex -space-x-1.5">
                                            {(task.metadata?.attendees || []).map((uid, i) => (
                                                <div key={i} className="w-5 h-5 rounded-full bg-[#222] border border-[#333] overflow-hidden" title={userMap[uid]?.name || ""}>
                                                    {userMap[uid]?.metadata?.avatar_url ? <img src={userMap[uid].metadata.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[8px]">{userMap[uid]?.name?.[0]}</div>}
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

        {/* --- GLOBAL FIXED MODAL --- */}
        {selectedTask && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#161616] border border-white/10 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/10 flex justify-between items-start bg-[#1a1a1a]">
                        <div>
                            {selectedTask.issue && (
                                <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider mb-1 border ${selectedTask.issue.type === 'Bug' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                    {selectedTask.issue.type}
                                </div>
                            )}
                            <h3 className="font-bold text-lg text-white leading-tight">{selectedTask.title}</h3>
                        </div>
                        <button onClick={() => setSelectedTask(null)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white"><X size={16} /></button>
                    </div>

                    <div className="p-4 space-y-4 overflow-y-auto widget-scrollbar">
                        
                        {/* Tags Section in Modal */}
                        {getTaskTags(selectedTask).length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {getTaskTags(selectedTask).map((tag, i) => (
                                    <span 
                                        key={i} 
                                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-medium"
                                        style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30`, color: tag.color }}
                                    >
                                        <TagIcon size={10} /> {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded border border-white/5 text-center min-w-[50px]">
                                <div className="text-[9px] uppercase font-bold text-white/40">{new Date(selectedTask.task_date).toLocaleString('default', { month: 'short'})}</div>
                                <div className="text-lg font-bold text-white">{new Date(selectedTask.task_date).getDate()}</div>
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
                                    <Clock size={14} className="text-white/40"/>
                                    {selectedTask.start_time.slice(0,5)} - {selectedTask.end_time.slice(0,5)}
                                </div>
                                <div className="text-xs text-white/40">Created by {selectedTask.creator?.name || "Unknown"}</div>
                            </div>
                        </div>

                        {selectedTask.description && (
                            <div className="text-xs text-white/70 leading-relaxed bg-white/5 p-3 rounded border border-white/5">
                                {selectedTask.description}
                            </div>
                        )}

                        {selectedTask.metadata?.meeting_link && (
                             <a href={selectedTask.metadata.meeting_link} target="_blank" className="flex items-center justify-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-xs font-bold transition-colors">
                                <Video size={14} /> Join Meeting <ExternalLink size={10}/>
                             </a>
                        )}

                        <div>
                            <label className="text-[9px] uppercase font-bold text-white/40 block mb-2">Attendees ({selectedTask.metadata?.attendees?.length || 0})</label>
                            <div className="flex flex-wrap gap-2">
                                {(selectedTask.metadata?.attendees || []).map((uid) => (
                                    <div key={uid} className="flex items-center gap-1.5 p-1.5 rounded bg-white/5 border border-white/5">
                                        <div className="w-5 h-5 rounded-full bg-[#222] border border-white/10 overflow-hidden">
                                            {userMap[uid]?.metadata?.avatar_url ? <img src={userMap[uid].metadata.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[8px]">{userMap[uid]?.name?.[0]}</div>}
                                        </div>
                                        <span className="text-[10px] text-white/70">{userMap[uid]?.name}</span>
                                    </div>
                                ))}
                                {(selectedTask.metadata?.attendees || []).length === 0 && <span className="text-xs text-white/20 italic">None</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}