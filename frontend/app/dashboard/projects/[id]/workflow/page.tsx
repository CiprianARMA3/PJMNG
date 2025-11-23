"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../components/menu"; 
import { 
  Calendar as CalendarIcon, Table as TableIcon, 
  Plus, X, ChevronLeft, ChevronRight,
  Link as LinkIcon, Clock, Trash2,
  Video, UserPlus, UserMinus, ExternalLink,
  Minimize2, Maximize2 
} from "lucide-react";

// --- TYPES (Omitted for brevity) ---
type UserProfile = {
  id: string;
  name: string | null;
  metadata: { avatar_url?: string; [key: string]: any };
};

type LinkedIssue = {
  id: string;
  title: string;
  type: string;
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
    [key: string]: any;
  };
};

export default function WorkflowPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableIssues, setAvailableIssues] = useState<LinkedIssue[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [viewStartDate, setViewStartDate] = useState<Date>(new Date());
  
  const [hourHeight, setHourHeight] = useState(100); 
  const [numDaysInView, setNumDaysInView] = useState(3); 

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState("");
  // CHANGED: Default time format to 24-hour military time
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formIssueId, setFormIssueId] = useState("");
  const [formMeetingLink, setFormMeetingLink] = useState("");

  // --- INITIAL FETCH (Omitted for brevity) ---
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

  const fetchData = async () => {
    setLoading(true);
    const { data: tasksData } = await supabase.from("tasks").select(`*, issue:issue_id ( id, title, type ), creator:creator_id ( id, name, metadata )`).eq("project_id", projectId);
    if (tasksData) setTasks(tasksData as any);

    const { data: issuesData } = await supabase.from("issues").select("id, title, type").eq("project_id", projectId).neq("status", "Closed");
    if (issuesData) setAvailableIssues(issuesData as any);

    const { data: usersData } = await supabase.from("project_users").select("user:users(id, name, metadata)").eq("project_id", projectId);
    if (usersData) {
        const map: Record<string, UserProfile> = {};
        usersData.forEach((u: any) => { if(u.user) map[u.user.id] = u.user; });
        const { data: currentUser } = await supabase.from("users").select("id, name, metadata").eq("id", (await supabase.auth.getUser()).data.user?.id).single();
        if(currentUser) map[currentUser.id] = currentUser as any;
        setUserMap(map);
    }
    setLoading(false);
  };

  // --- GLOBAL HELPER (Omitted for brevity) ---
  const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  // --- CALENDAR HELPERS (Omitted for brevity) ---
  const getViewDays = (startDate: Date) => {
      const days = [];
      for (let i = 0; i < numDaysInView; i++) {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          days.push(d);
      }
      return days;
  };
  
  const changeViewDate = (offset: number) => {
      const newStart = new Date(viewStartDate);
      newStart.setDate(newStart.getDate() + (offset * numDaysInView));
      setViewStartDate(newStart);
  };

  const isSameDate = (d1: Date, d2Str: string) => {
      const d2 = new Date(d2Str);
      return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  const getTaskColor = (id: string) => {
      const palettes = [
          { bg: 'bg-blue-900/40', border: 'border-blue-500/50', bar: 'border-l-blue-500', hover: 'hover:bg-blue-900/60', text: 'text-blue-100' },
          { bg: 'bg-purple-900/40', border: 'border-purple-500/50', bar: 'border-l-purple-500', hover: 'hover:bg-purple-900/60', text: 'text-purple-100' },
          { bg: 'bg-green-900/40', border: 'border-green-500/50', bar: 'border-l-green-500', hover: 'hover:bg-green-900/60', text: 'text-green-100' },
          { bg: 'bg-orange-900/40', border: 'border-orange-500/50', bar: 'border-l-orange-500', hover: 'hover:bg-orange-900/60', text: 'text-orange-100' },
          { bg: 'bg-pink-900/40', border: 'border-pink-500/50', bar: 'border-l-pink-500', hover: 'hover:bg-pink-900/60', text: 'text-pink-100' },
          { bg: 'bg-cyan-900/40', border: 'border-cyan-500/50', bar: 'border-l-cyan-500', hover: 'hover:bg-cyan-900/60', text: 'text-cyan-100' },
      ];
      let hash = 0;
      for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
      return palettes[Math.abs(hash) % palettes.length];
  };

  const getGridPosition = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + (minutes / 60); 
  };
  
  const getDurationHeight = (start: string, end: string) => {
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      return (h2 + m2/60) - (h1 + m1/60);
  };

  const getEventLayout = (task: Task, dayTasks: Task[]) => {
      const startA = toMins(task.start_time);
      const endA = toMins(task.end_time);
      const overlaps = dayTasks.filter(t => {
          const startB = toMins(t.start_time);
          const endB = toMins(t.end_time);
          return startA < endB && endA > startB; 
      });
      overlaps.sort((a, b) => {
          const diff = toMins(a.start_time) - toMins(b.start_time);
          if (diff !== 0) return diff;
          return a.id.localeCompare(b.id);
      });
      const total = overlaps.length;
      const index = overlaps.findIndex(t => t.id === task.id);
      const CONTAINER_WIDTH = 85;
      
      const style = {
          top: `${getGridPosition(task.start_time) * hourHeight}px`,
          height: `${getDurationHeight(task.start_time, task.end_time) * hourHeight}px`,
          width: `calc((${CONTAINER_WIDTH}% - 8px) / ${total})`, 
          left: `calc(((${CONTAINER_WIDTH}% - 8px) / ${total}) * ${index})`,
          zIndex: 10 + index
      };
      return { style, total };
  };

  // --- ACTIONS (Omitted for brevity) ---
  const openNewTaskModal = (prefillDate?: Date, prefillHour?: number) => {
      setEditingTask(null);
      setFormTitle(""); setFormDesc("");
      const d = prefillDate || new Date();
      setFormDate(d.toISOString().split('T')[0]);
      // CHANGED: Use 24-hour format
      const startH = prefillHour !== undefined ? prefillHour : 9;
      setFormStartTime(`${startH.toString().padStart(2, '0')}:00`);
      setFormEndTime(`${((startH + 1) % 24).toString().padStart(2, '0')}:00`);
      setFormIssueId(""); setFormMeetingLink("");
      setShowModal(true);
  };

  const openEditModal = (task: Task) => {
      setEditingTask(task);
      setFormTitle(task.title);
      setFormDesc(task.description || "");
      setFormDate(task.task_date);
      // Ensure times sliced for 24-hour input: HH:MM
      setFormStartTime(task.start_time.slice(0, 5));
      setFormEndTime(task.end_time.slice(0, 5));
      setFormIssueId(task.issue_id || "");
      setFormMeetingLink(task.metadata?.meeting_link || "");
      setShowModal(true);
  };

  const handleSaveTask = async () => {
    if (!formTitle.trim()) return;
    const existingMeta = editingTask?.metadata || {};
    const newMetadata = { ...existingMeta, meeting_link: formMeetingLink, attendees: existingMeta.attendees || (editingTask ? [] : [user.id]) };
    const payload = {
      project_id: projectId,
      title: formTitle,
      description: formDesc,
      task_date: formDate,
      // Times are already expected to be HH:MM strings
      start_time: formStartTime,
      end_time: formEndTime,
      issue_id: formIssueId || null,
      status: editingTask ? editingTask.status : 'Todo',
      metadata: newMetadata,
      ...(editingTask ? {} : { creator_id: user.id }) 
    };
    if (editingTask) await supabase.from("tasks").update(payload).eq("id", editingTask.id);
    else await supabase.from("tasks").insert(payload);
    setShowModal(false);
    fetchData(); 
  };

  const handleDeleteTask = async () => {
      if(!editingTask) return;
      if(confirm("Delete this event?")) {
          await supabase.from("tasks").delete().eq("id", editingTask.id);
          setShowModal(false);
          fetchData();
      }
  };

  const toggleJoinTask = async (e: React.MouseEvent, task: Task) => {
      e.stopPropagation();
      if (!user) return;
      
      // Time comparison requires ISO 8601 format: YYYY-MM-DDT...
      const taskEndDateTime = new Date(`${task.task_date}T${task.end_time}:00`);
      if (taskEndDateTime.getTime() < Date.now()) {
          // Meeting has ended, prevent join/leave action
          console.warn("Cannot join/leave a meeting that has already ended.");
          return;
      }
      
      const currentAttendees = task.metadata?.attendees || [];
      const isJoined = currentAttendees.includes(user.id);
      const newAttendees = isJoined ? currentAttendees.filter(id => id !== user.id) : [...currentAttendees, user.id];
      const updatedMetadata = { ...task.metadata, attendees: newAttendees };
      const updatedTask = { ...task, metadata: updatedMetadata };
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      if (editingTask && editingTask.id === task.id) setEditingTask(updatedTask);
      await supabase.from("tasks").update({ metadata: updatedMetadata }).eq("id", task.id);
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
  
  const viewDays = getViewDays(viewStartDate);
  const HOURS = Array.from({ length: 24 }, (_, i) => i); 
  const GRID_TOTAL_HEIGHT = 24 * hourHeight;

  // --- CORE VIEW STATE CHECK ---
  const isMaximizedView = numDaysInView === 1 || hourHeight === 150; 
  // -----------------------------

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-sans">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #262626; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* CSS for diagonal dashing on past events */
        .past-event-row {
            background-image: repeating-linear-gradient(
                45deg,
                #161616,
                #161616 10px,
                #0a0a0a 10px,
                #0a0a0a 20px
            );
            opacity: 0.6;
        }
        .past-event-row:hover {
            opacity: 0.8;
            background-image: repeating-linear-gradient(
                45deg,
                #1a1a1a,
                #1a1a1a 10px,
                #0a0a0a 10px,
                #0a0a0a 20px
            );
        }
      `}</style>

      <Menu project={project} user={user} />
      
      <main className="flex-1 ml-64 flex flex-col h-full bg-[#0a0a0a]">
        
        {/* HEADER (Omitted for brevity) */}
        <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
             <h1 className="text-lg font-bold tracking-tight">{project?.name || "Project"}</h1>
             <div className="flex bg-[#161616] p-0.5 rounded-lg border border-white/5">
                <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                    <CalendarIcon size={12}/> Calendar
                </button>
                <button onClick={() => setViewMode('table')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                    <TableIcon size={12}/> Table
                </button>
             </div>
          </div>
          <button onClick={() => openNewTaskModal()} className="flex items-center gap-2 px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-xs uppercase font-bold rounded transition-colors">
            <Plus size={14} /> Add Event
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-[#0a0a0a] relative flex flex-col">
            
            {/* CALENDAR VIEW */}
            {viewMode === 'calendar' && (
                <div className="flex flex-col h-full">
                    {/* Nav & Zoom Controls (Omitted for brevity) */}
                    <div className="flex-none flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0a0a0a]">
                        <div className="flex items-center gap-3">
                             <h2 className="text-xl font-bold ">
                                {viewDays[0].toLocaleString('default', { month: 'short', day: 'numeric' })}
                                {numDaysInView > 1 && ` - ${viewDays[viewDays.length - 1].toLocaleString('default', { month: 'short', day: 'numeric' })}`}
                             </h2>
                             <span className="text-white/30 text-sm">{viewStartDate.getFullYear()}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            
                            {/* COLUMN TOGGLE (1 Day / 3 Days) */}
                            <div className="flex bg-[#161616] rounded-lg border border-white/5 p-0.5">
                                <button 
                                    onClick={() => setNumDaysInView(1)} 
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase text-white/60 hover:text-white transition-all ${numDaysInView === 1 ? 'bg-white/10 text-white' : ''}`}
                                >
                                    1 Day
                                </button>
                                <button 
                                    onClick={() => setNumDaysInView(3)} 
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase text-white/60 hover:text-white transition-all ${numDaysInView === 3 ? 'bg-white/10 text-white' : ''}`}
                                >
                                    3 Days
                                </button>
                            </div>

                            {/* VERTICAL ZOOM CONTROLS */}
                            <div className="flex bg-[#161616] rounded-lg border border-white/5 p-0.5">
                                <button 
                                    onClick={() => setHourHeight(100)} 
                                    className={`p-1.5 rounded-md text-white/60 hover:text-white transition-all ${hourHeight === 100 ? 'bg-white/10' : ''}`}
                                    title="Standard View (100px)"
                                >
                                    <Minimize2 size={16}/>
                                </button>
                                <button 
                                    onClick={() => setHourHeight(150)} 
                                    className={`p-1.5 rounded-md text-white/60 hover:text-white transition-all ${hourHeight === 150 ? 'bg-white/10' : ''}`}
                                    title="Expanded View (150px)"
                                >
                                    <Maximize2 size={16}/>
                                </button>
                            </div>

                            {/* NAVIGATION CONTROLS */}
                            <div className="flex bg-[#161616] rounded-lg border border-white/5 p-0.5">
                                <button onClick={() => changeViewDate(-1)} className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white"><ChevronLeft size={16}/></button>
                                <button onClick={() => setViewStartDate(new Date())} className="px-3 text-[10px] font-bold uppercase hover:bg-white/10 text-white/60 hover:text-white">Today</button>
                                <button onClick={() => changeViewDate(1)} className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white"><ChevronRight size={16}/></button>
                            </div>
                        </div>
                    </div>
                    
                    {/* SCROLLABLE AREA */}
                    <div className="flex-1 overflow-y-auto relative flex pb-0"> 
                        
                        {/* Time Column */}
                        <div className="w-16 flex-none border-r border-white/5 bg-[#0a0a0a] sticky left-0 z-20">
                             <div className="h-10 border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-30"></div>
                             <div className="relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                                {HOURS.map((h) => (
                                    <div 
                                        key={h} 
                                        className="absolute w-full text-right pr-2 text-[10px] text-white/30"
                                        style={{ top: `${h * hourHeight}px`, transform: h === 0 ? 'translateY(2px)' : 'translateY(-50%)' }}
                                    >
                                        {h.toString().padStart(2, '0')}:00 {/* Military time display */}
                                    </div>
                                ))}
                             </div>
                        </div>

                        {/* DAY GRID */}
                        <div className="flex-1 min-w-[600px]">
                             {/* Sticky Header - Day Names (Omitted for brevity) */}
                             <div className="flex border-b border-white/5 sticky top-0 bg-[#0a0a0a] z-10 h-10">
                                 {viewDays.map((day, i) => {
                                     const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
                                     return (
                                         <div key={i} className="flex-1 text-center border-r border-white/5 flex items-center justify-center gap-2">
                                             <span className="text-[10px] font-bold uppercase text-white/40">{day.toLocaleString('default', { weekday: 'short' })}</span>
                                             <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-white'}`}>
                                                 {day.getDate()}
                                             </span>
                                         </div>
                                     )
                                 })}
                             </div>

                             {/* Main Grid Content - Dynamic Columns and Height */}
                             <div className={`relative grid ${numDaysInView === 1 ? 'grid-cols-1' : 'grid-cols-3'} overflow-hidden`} style={{ height: `${GRID_TOTAL_HEIGHT}px` }}> 
                                 
                                 {/* Background Lines (Omitted for brevity) */}
                                 <div className="absolute inset-0 flex flex-col pointer-events-none">
                                      {HOURS.map(h => <div key={h} className="border-b border-white/5 w-full" style={{ height: `${hourHeight}px` }}></div>)}
                                 </div>
                                 
                                 {viewDays.map((day, colIndex) => {
                                     const dayTasks = tasks.filter(t => isSameDate(day, t.task_date));
                                     return (
                                         <div key={colIndex} className="relative border-r border-white/5 h-full">
                                             {HOURS.map(h => <div key={h} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => openNewTaskModal(day, h)} style={{ height: `${hourHeight}px` }}></div>)}

                                             {dayTasks.map(task => {
                                                 const { style, total } = getEventLayout(task, dayTasks); 
                                                 const color = getTaskColor(task.id);
                                                 const attendees = task.metadata?.attendees || [];
                                                 const isJoined = attendees.includes(user.id);
                                                 
                                                 // DIMENSION CALCULATIONS
                                                 const taskDurationInHours = getDurationHeight(task.start_time, task.end_time);
                                                 const cardHeight = taskDurationInHours * hourHeight;
                                                 const taskEndDateTime = new Date(`${task.task_date}T${task.end_time}:00`);
                                                 const isOver = taskEndDateTime.getTime() < Date.now(); // Check if event has ended

                                                 // DYNAMIC TEXT & PFP SIZING LOGIC
                                                 let titleSize = 'text-sm';
                                                 let timeSize = 'text-xs';
                                                 let pfpSize = 'w-6 h-6';
                                                 let pfpMargin = 'ml-[-6px]';

                                                 if (isMaximizedView) {
                                                    // Maximize content size
                                                    titleSize = 'text-lg';
                                                    timeSize = 'text-sm';
                                                    pfpSize = 'w-8 h-8';
                                                    pfpMargin = 'ml-[-8px]'; 
                                                 } else {
                                                    // Standard (Dynamic/Shrinking behavior)
                                                    
                                                    // 1. Height-Based Sizing (If Tall)
                                                    if (cardHeight > 150) { 
                                                        titleSize = 'text-base';
                                                    }

                                                    // 2. Width-Based Sizing (If Narrow/Overlapped)
                                                    if (total >= 3) { 
                                                        titleSize = 'text-xs';
                                                        timeSize = 'text-[10px]';
                                                    } else if (total === 2 && cardHeight < 90) { 
                                                        titleSize = 'text-sm';
                                                        timeSize = 'text-[10px]';
                                                    }
                                                 }
                                                 
                                                 // VISIBILITY LOGIC (for non-overlap)
                                                 const hideTime = cardHeight < 55;   
                                                 const hideDescription = cardHeight < 90; 
                                                 const hideAvatars = cardHeight < 75; 
                                                 const hideIssueText = total > 2;
                                                 
                                                 // Dynamic description size based on scaled title size
                                                 const descriptionSize = titleSize.replace('text-lg', 'text-sm').replace('text-base', 'text-sm').replace('text-sm', 'text-xs').replace('text-xs', 'text-[10px]');
                                                 
                                                 return (
                                                     <div 
                                                         key={task.id}
                                                         onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                         style={style}
                                                         className={`absolute rounded border-l-4 p-2 cursor-pointer overflow-hidden z-10 group shadow-lg transition-all
                                                            ${color.bg} ${color.border} ${color.bar} ${color.hover} ${isOver ? 'opacity-50 pointer-events-none' : ''}
                                                         `}
                                                     >
                                                         {/* ICONS CONTAINER (Top Right) */}
                                                         <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
                                                             {task.issue && (
                                                                 <div className={`flex items-center gap-1.5 text-[10px] bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/20 ${hideIssueText ? 'hidden sm:flex' : ''}`} title={task.issue.title}>
                                                                     <LinkIcon size={12} />
                                                                     <span className={`truncate max-w-[60px] ${hideIssueText ? 'hidden' : 'inline'}`}>{task.issue.title}</span>
                                                                 </div>
                                                             )}
                                                             {task.metadata?.meeting_link && (
                                                                 <a href={task.metadata.meeting_link} target="_blank" onClick={(e) => e.stopPropagation()} className="bg-green-500/20 text-green-300 p-1 rounded border border-green-500/20 hover:bg-green-500/40 transition-colors" title="Join Meeting">
                                                                     <Video size={14} />
                                                                 </a>
                                                             )}
                                                             {/* JOIN/LEAVE BUTTON - Disabled if meeting is over */}
                                                             <button 
                                                                onClick={(e) => toggleJoinTask(e, task)}
                                                                disabled={isOver}
                                                                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity 
                                                                    ${isOver ? 'bg-gray-700 text-white/50 cursor-not-allowed' : (isJoined ? 'bg-red-500 text-white' : 'bg-blue-500 text-white')}
                                                                `}
                                                                title={isOver ? "Event Over" : (isJoined ? "Leave" : "Join")}
                                                             >
                                                                 {isJoined ? <UserMinus size={14}/> : <UserPlus size={14}/>}
                                                             </button>
                                                         </div>

                                                         {/* TEXT CONTENT (Includes Description & New PFP Location) */}
                                                         <div className="flex flex-col pr-24 pt-0.5 mt-6"> 
                                                            <div className={`font-bold ${titleSize} truncate ${color.text}`}>{task.title}</div>
                                                            
                                                            {/* DESCRIPTION */}
                                                            {task.description && !hideDescription && (
                                                                <div className={`${descriptionSize} text-white/40 italic mt-0.5 truncate max-h-3`} title={task.description}>
                                                                    {task.description}
                                                                </div>
                                                            )}

                                                            {/* TIME */}
                                                            <div className={`${timeSize} text-white/50 flex items-center gap-1.5 mt-0.5 ${hideTime ? 'hidden' : ''}`}>
                                                                <Clock size={12}/> {task.start_time.slice(0,5)} - {task.end_time.slice(0,5)}
                                                            </div>
                                                            
                                                            {/* ATTENDEES (In-Flow Location with mt-1) */}
                                                            <div className={`flex mt-1 ${hideAvatars ? 'hidden' : ''}`}>
                                                                {attendees.slice(0, 3).map((uid, idx) => (
                                                                    <div 
                                                                        key={idx} 
                                                                        className={`${pfpSize} rounded-full bg-[#111] border border-[#333] overflow-hidden ${idx > 0 ? pfpMargin : ''}`} 
                                                                        title={userMap[uid]?.name || 'Unknown User'} 
                                                                    >
                                                                        {userMap[uid]?.metadata?.avatar_url ? 
                                                                            <img src={userMap[uid].metadata.avatar_url} className="w-full h-full object-cover"/> : 
                                                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-white">{userMap[uid]?.name?.[0]}</div>
                                                                        }
                                                                    </div>
                                                                ))}
                                                            </div>
                                                         </div>
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                     )
                                 })}
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLE VIEW */}
            {viewMode === 'table' && (
                 <div className="p-6">
                    <table className="w-full text-left text-sm text-white/70 border-collapse">
                        <thead className="text-[10px] uppercase font-bold text-white/40 bg-[#0a0a0a] sticky top-0 border-b border-white/5 z-10">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Event</th>
                                <th className="px-4 py-3">Creator</th>
                                <th className="px-4 py-3">Link</th>
                                <th className="px-4 py-3">Attendees</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tasks.map(task => {
                                const attendees = task.metadata?.attendees || [];
                                const taskDate = new Date(task.task_date);
                                const taskEndDateTime = new Date(`${task.task_date}T${task.end_time}:00`);
                                const isPastEventDay = taskDate.getTime() < todayMidnight.getTime();
                                const isOver = taskEndDateTime.getTime() < Date.now(); // Check if event has ended
                                
                                return (
                                <tr 
                                    key={task.id} 
                                    onClick={() => openEditModal(task)} 
                                    className={`cursor-pointer transition-colors ${isPastEventDay ? 'past-event-row' : 'hover:bg-[#111]'}`}
                                >
                                    <td className="px-4 py-3 font-mono text-xs text-white/50">
                                        <div>{taskDate.toLocaleDateString()}</div>
                                        {/* CHANGED: Ensure time slice for 24-hour format */}
                                        <div className="text-white/30">{task.start_time.slice(0,5)} - {task.end_time.slice(0,5)}</div> 
                                    </td>
                                    <td className="px-4 py-3 font-medium text-white">{task.title}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-[#222] border border-white/10 overflow-hidden">
                                                {task.creator?.metadata?.avatar_url ? <img src={task.creator.metadata.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[8px]">{task.creator?.name?.[0]}</div>}
                                            </div>
                                            <span className="text-xs">{task.creator?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {task.metadata?.meeting_link ? (
                                            <a href={task.metadata.meeting_link} target="_blank" onClick={(e) => e.stopPropagation()} className="text-green-400 hover:underline flex items-center gap-1 text-xs"><Video size={12}/> Join Call</a>
                                        ) : <span className="text-white/20 text-xs">-</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex -space-x-2">
                                            {attendees.map((uid, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-[#222] border border-[#333] overflow-hidden relative z-0 hover:z-10" title={userMap[uid]?.name || ""}>
                                                    {userMap[uid]?.metadata?.avatar_url ? <img src={userMap[uid].metadata.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[8px]">{userMap[uid]?.name?.[0]}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={(e) => toggleJoinTask(e, task)}
                                            disabled={isOver} // Disabled if meeting is over
                                            className={`px-2 py-1 rounded text-[10px] font-bold border 
                                                ${isOver ? 'bg-gray-700/20 border-gray-500/30 text-gray-500 cursor-not-allowed' : (attendees.includes(user.id) ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400')}
                                            `}
                                        >
                                            {isOver ? "Finished" : (attendees.includes(user.id) ? "Leave" : "Join")}
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 </div>
            )}
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#161616] border border-white/10 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                      <h3 className="font-bold text-lg">{editingTask ? "Edit Event" : "New Event"}</h3>
                      <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white"><X size={16} /></button>
                  </div>
                  <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                      <div><label className="text-[10px] uppercase font-bold text-white/40 block mb-1.5">Title</label><input autoFocus className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500 transition-colors" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Daily Standup" /></div>
                      <div><label className="text-[10px] uppercase font-bold text-white/40 block mb-1.5">Description</label><textarea className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500 transition-colors min-h-[80px] resize-y" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Details..." /></div>
                      <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-3"><label className="text-[10px] uppercase font-bold text-white/40 block mb-1.5">Date</label><input type="date" className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" value={formDate} onChange={e => setFormDate(e.target.value)} /></div>
                          <div><label className="text-[10px] uppercase font-bold text-white/40 block mb-1.5">Start</label><input type="time" className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} /></div>
                          <div><label className="text-[10px] uppercase font-bold text-white/40 block mb-1.5">End</label><input type="time" className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} /></div>
                      </div>
                      <div><label className="text-[10px] uppercase font-bold text-green-400 block mb-1.5 flex items-center gap-1"><Video size={10}/> Meeting Link</label><div className="flex gap-2"><input className="flex-1 bg-[#0a0a0a] border border-green-500/30 rounded-lg p-2.5 text-sm text-white outline-none focus:border-green-500" value={formMeetingLink} onChange={e => setFormMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />{formMeetingLink && <a href={formMeetingLink} target="_blank" className="p-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20"><ExternalLink size={16}/></a>}</div></div>
                      <div><label className="text-[10px] uppercase font-bold text-purple-400 block mb-1.5 flex items-center gap-1"><LinkIcon size={10}/> Link Issue</label><select className="w-full bg-[#0a0a0a] border border-purple-500/30 rounded-lg p-2.5 text-sm text-white outline-none focus:border-purple-500 appearance-none cursor-pointer" value={formIssueId} onChange={e => setFormIssueId(e.target.value)}><option value="">None</option>{availableIssues.map(issue => <option key={issue.id} value={issue.id}>[{issue.type}] {issue.title}</option>)}</select></div>
                      {editingTask && (<div className="p-3 bg-[#0a0a0a] border border-white/5 rounded-lg space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase text-white/40">Created By:</span><div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-[#222] overflow-hidden">{editingTask.creator?.metadata?.avatar_url ? <img src={editingTask.creator.metadata.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[8px]">{editingTask.creator?.name?.[0]}</div>}</div><span className="text-xs font-medium">{editingTask.creator?.name || "Unknown"}</span></div></div></div><div className="border-t border-white/5 pt-2"><div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold uppercase text-white/40">Attendees</span><button onClick={(e) => toggleJoinTask(e, editingTask)} className={`text-[10px] font-bold flex items-center gap-1 ${editingTask.metadata?.attendees?.includes(user.id) ? 'text-red-400' : 'text-blue-400'}`}>{editingTask.metadata?.attendees?.includes(user.id) ? <><UserMinus size={10}/> Leave</> : <><UserPlus size={10}/> Join</>}</button></div><div className="flex flex-wrap gap-2">{(editingTask.metadata?.attendees || []).map(uid => (<div key={uid} className="flex items-center gap-1.5 bg-[#222] pr-2 rounded-full border border-white/10"><div className="w-5 h-5 rounded-full bg-[#333] overflow-hidden">{userMap[uid]?.metadata?.avatar_url ? <img src={userMap[uid].metadata.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[8px]">{userMap[uid]?.name?.[0]}</div>}</div><span className="text-xs">{userMap[uid]?.name}</span></div>))}{(editingTask.metadata?.attendees || []).length === 0 && <span className="text-white/20 text-xs italic">No attendees yet</span>}</div></div></div>)}
                      <div className="pt-4 flex gap-3"><button onClick={handleSaveTask} className="flex-1 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200">{editingTask ? "Save Changes" : "Create Event"}</button>{editingTask && (<button onClick={handleDeleteTask} className="px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold rounded-lg hover:bg-red-500/20"><Trash2 size={16}/></button>)}</div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}