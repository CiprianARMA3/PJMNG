// calendar.tsx (Calendar3DayFixedView)

'use client';

import { useEffect, useState, useMemo } from "react";
// ... (imports remain the same)
import { useParams } from "next/navigation";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

// --- TYPES (Keeping original types for consistency) ---
type Tag = { name: string; color: string; textColor?: string };
type UserProfile = { id: string; name: string | null; metadata: { avatar_url?: string; [key: string]: any }; };
type LinkedIssue = { id: string; title: string; type: string; metadata: { tags?: Tag[]; [key: string]: any }; };
type Task = {
  id: string; project_id: string; title: string; description?: string | null;
  status: string; task_date: string; start_time: string; end_time: string;
  issue_id?: string | null; issue?: LinkedIssue | null; creator_id: string | null;
  creator?: UserProfile | null; 
  metadata: { meeting_link?: string; attendees?: string[]; tags?: Tag[]; [key: string]: any; };
};

/**
 * Calendar component fixed to 3-Day View with non-selectable view options.
 * Events are non-selectable and cannot open the detail modal.
 */
export default function Calendar3DayFixedView() {
  // --- MOCK SETUP ---
  const supabase = { from: () => ({ select: () => ({ eq: () => ({ data: [] }) }) }) } as any;
  const params = { id: 'mock-project-id' } as any;
  const projectId = params.id as string;

  // --- STATE ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserProfile>>({
    'mock_user_1': { id: 'mock_user_1', name: 'Alice', metadata: { avatar_url: 'https://i.pravatar.cc/32?img=1' } },
    'mock_user_2': { id: 'mock_user_2', name: 'Bob', metadata: { avatar_url: 'https://i.pravatar.cc/32?img=2' } },
    'mock_user_3': { id: 'mock_user_3', name: 'Charlie', metadata: { avatar_url: 'https://i.pravatar.cc/32?img=3' } },
    'mock_user_4': { id: 'mock_user_4', name: 'Dana', metadata: { avatar_url: 'https://i.pravatar.cc/32?img=4' } },
  });
  const [loading, setLoading] = useState(false); 
  
  // FIXED VIEW SETTINGS
  const numDaysInView = 3; 
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [hourHeight, setHourHeight] = useState(30); 

  // Modal State (kept for structure, but task selection removed)
  // We initialize this to null and ensure it cannot be set to a task.
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // --- CONFIG (FIXED 3 HOUR WINDOW: 9 AM to 12 PM) ---
  const START_HOUR = 9;
  const END_HOUR = 12;
  const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  // --- SCROLL LOCKING EFFECT --- (Now redundant, but kept for cleanup)
  useEffect(() => {
    // Modal will never open, so we always keep overflow unset.
    document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, []); // Empty dependency array, always unset

  // --- HELPER LOGIC --- (Unchanged)
  const getStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const newDate = new Date(d.setDate(diff));
    newDate.setHours(0,0,0,0);
    return newDate;
  };
  
  const navigateDate = (direction: number) => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + (direction * numDaysInView)); 
    setStartDate(newDate);
  };
  
  const isSameDay = (d1: Date, dateStr: string) => {
      const d2 = new Date(dateStr);
      return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };
  
  const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
  };

  // --- VISUALIZATION LOGIC & MOCK DATA --- (Unchanged)
  // ... (getEventStyle, dateStrip, currentTimeMarker, getTaskTags, mockTasks, tasksToDisplay all remain the same)
  const getEventStyle = (task: Task, dayTasks: Task[]) => {
      // ... (implementation remains the same)
      const startMinsTotal = toMinutes(task.start_time);
      const endMinsTotal = toMinutes(task.end_time);
      const durationMins = endMinsTotal - startMinsTotal;

      const offsetMins = START_HOUR * 60;
      const startMinsRelative = startMinsTotal - offsetMins;
      
      if (endMinsTotal <= offsetMins || startMinsTotal >= END_HOUR * 60) {
          return null;
      }
      
      const overlaps = dayTasks.filter(t => {
          const tStart = toMinutes(t.start_time);
          const tEnd = toMinutes(t.end_time);
          return startMinsTotal < tEnd && endMinsTotal > tStart;
      });
      overlaps.sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time) || a.id.localeCompare(b.id));
      const index = overlaps.findIndex(t => t.id === task.id);
      const total = overlaps.length;

      const top = (startMinsRelative / 60) * hourHeight;
      const height = (durationMins / 60) * hourHeight;
      const widthPercent = 100 / total;
      const leftPercent = index * widthPercent;

      const isPast = new Date(`${task.task_date}T${task.end_time}`) < new Date();
      
      const colorMap: any = {
          purple: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800' },
          red: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800' },
          blue: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
          yellow: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800' },
      };

      let theme = colorMap.purple;
      if (task.issue?.type === 'Bug') theme = colorMap.red;
      if (task.issue?.type === 'Improvement') theme = colorMap.blue;
      if (task.issue?.type === 'Task') theme = colorMap.yellow;
      
      return {
          style: {
              top: `${top}px`,
              height: `${Math.max(height, 15)}px`, 
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
  }, [startDate]); 

  const currentTimeMarker = useMemo(() => {
      const now = new Date();
      if (now.getHours() < START_HOUR || now.getHours() >= END_HOUR) return null;
      
      const isInView = dateStrip.some(d => isSameDay(d, now.toISOString()));
      if (!isInView) return null;
      
      const minsSinceStart = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
      return (minsSinceStart / 60) * hourHeight;
  }, [dateStrip, hourHeight]);

  const getTaskTags = (task: Task) => {
    const issueTags = task.issue?.metadata?.tags || [];
    const taskTags = task.metadata?.tags || [];
    return [...issueTags, ...taskTags];
  };

  const mockTasks = useMemo(() => {
    const today = new Date();
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const dateStringToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dateStringNext = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
    const dateStringAfter = `${dayAfter.getFullYear()}-${String(dayAfter.getMonth() + 1).padStart(2, '0')}-${String(dayAfter.getDate()).padStart(2, '0')}`;
        
    const taskTemplate = (id: string, time: string, duration: number, title: string, type: string, taskDate: string, attendees: string[] = ['mock_user_1', 'mock_user_2']): Task => {
        const [startH, startM] = time.split(':').map(Number);
        const endMins = startH * 60 + startM + duration;
        const endH = Math.floor(endMins / 60) % 24;
        const endM = endMins % 60;

        return {
            id, project_id: projectId, title,
            description: `Discussing the linked issue: ${title}.`, status: 'active', task_date: taskDate,
            start_time: time, end_time: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
            creator_id: 'mock_user_1', creator: userMap['mock_user_1'],
            metadata: { meeting_link: 'https://meet.google.com/abc-xyz', attendees: attendees, tags: [{ name: 'High Priority', color: '#F97316' }] },
            issue: { id: 'issue_' + id, title: 'Linked Issue: ' + title, type: type, metadata: { tags: [{ name: 'Type: ' + type, color: type === 'Bug' ? '#EF4444' : (type === 'Improvement' ? '#3B82F6' : '#A855F7') }] } }
        };
    };

    return [
        taskTemplate('t1', '09:00', 60, 'UI/UX Review', 'Feature', dateStringToday, ['mock_user_1', 'mock_user_2', 'mock_user_3']),
        taskTemplate('t2', '09:45', 60, 'API Bug Fix', 'Bug', dateStringToday, ['mock_user_1', 'mock_user_3']),
        taskTemplate('t3', '11:30', 30, 'Metrics Dashboard Setup', 'Improvement', dateStringToday, ['mock_user_4', 'mock_user_2']),
        taskTemplate('t4', '09:30', 60, 'Deployment Preparation', 'Task', dateStringNext, ['mock_user_1']),
        taskTemplate('t7', '10:30', 60, 'Security Follow-up', 'Task', dateStringNext, ['mock_user_3', 'mock_user_4']),
        taskTemplate('t5', '10:00', 60, 'Client Demo Setup', 'Feature', dateStringAfter, ['mock_user_2', 'mock_user_4']),
    ];
 }, [projectId, userMap]);
 
  const tasksToDisplay = tasks.length > 0 ? tasks : mockTasks;


  if (loading) {
    return (
      <div role="status" className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    // Outer Container with the specific absolute positioning styles
    <div className="absolute top-0 right-[-40px] left-0 bottom-[-40px] shadow-lg !rounded-r-none bg-white flex flex-col overflow-hidden font-sans relative">
        <style jsx global>{`
            /* LIGHT MODE SCROLLBAR */
            .widget-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
            .widget-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .widget-scrollbar::-webkit-scrollbar-thumb { background: #bbb; border-radius: 2px; }
            .widget-scrollbar::-webkit-scrollbar-thumb:hover { background: #999; }

            /* LIGHT MODE STRIPES */
            .past-event-striped {
                background-image: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 5px,
                    rgba(0,0,0,0.1) 5px,
                    rgba(0,0,0,0.1) 10px
                );
            }
        `}</style>
        
        {/* --- WIDGET HEADER (Main Title Area) --- */}
        <div className="flex-none h-12 px-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
             <div className="flex items-center gap-3">
                 {/* Date Navigation buttons (functional) */}
                 <div className="flex items-center bg-white rounded-md border border-gray-300 p-0.5 shadow-sm">
                    <button onClick={() => navigateDate(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft size={14}/></button>
                    <button onClick={() => setStartDate(getStartOfWeek(new Date()))} className="px-2 text-[10px] font-bold uppercase text-gray-500 hover:text-purple-600">Today</button>
                    <button onClick={() => navigateDate(1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight size={14}/></button>
                 </div>
                 {/* Date Range Display */}
                 <h2 className="text-xs font-semibold text-gray-800">
                    {startDate.toLocaleString('default', { month: 'short', day: 'numeric' })}
                    {numDaysInView > 1 && ` - ${dateStrip[dateStrip.length-1].getDate()}`}
                 </h2>
            </div>
            
            <div className="flex items-center gap-2">
                 {/* Day Count Buttons (FIXED and NON-SELECTABLE) */}
                <div className="hidden sm:flex bg-gray-100 rounded-md border border-gray-300 p-0.5 shadow-inner">
                    {[1, 3, 5, 7].map(n => (
                        <button 
                            key={n} 
                            className={`
                                px-2 py-1 rounded text-[9px] font-bold uppercase cursor-default
                                ${numDaysInView === n 
                                    ? 'bg-purple-600 text-white shadow-sm' 
                                    : 'text-gray-500'
                                }
                            `}
                        >
                            {n}D
                        </button>
                    ))}
                </div>
                {/* View Mode Indicator (FIXED to Calendar Icon, non-selectable) */}
                <div className="flex bg-white rounded-md border border-gray-300 p-0.5 shadow-sm">
                    <button 
                         className={`p-1.5 rounded-md text-gray-600 transition-all bg-purple-100 text-purple-700 cursor-default`}><CalendarIcon size={12}/>
                    </button>
                </div>
            </div>
        </div>

        {/* --- CALENDAR VIEW --- */}
        <div className="flex flex-col h-full bg-white relative">
            
            {/* Sticky Header Row */}
            <div className="flex-none h-8 sticky top-0 z-40 bg-white border-b border-gray-200 flex">
                 {/* Corner Spacer */}
                 <div className="w-10 flex-none border-r border-gray-200 bg-white" />
                 
                 {/* Day Headers */}
                 <div className="flex-1 flex">
                    {dateStrip.map((day, i) => {
                        const isToday = isSameDay(day, new Date().toISOString());
                        return (
                            <div key={i} className="flex-1 border-r border-gray-200 flex items-center justify-center gap-1.5 last:border-r-0">
                                <span className={`text-[9px] uppercase font-bold tracking-wider ${isToday ? 'text-purple-600' : 'text-gray-500'}`}>{day.toLocaleString('default', { weekday: 'short' })}</span>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isToday ? 'bg-purple-600 text-white' : 'text-gray-800'}`}>{day.getDate()}</div>
                            </div>
                        );
                    })}
                 </div>
            </div>

            {/* Main Content (Time + Grid) */}
            <div className="flex flex-1 overflow-y-auto widget-scrollbar relative">
                
                {/* Inner Content Wrapper fixed height for the 3-hour window */}
                <div className="flex relative w-full flex-none" style={{ height: (END_HOUR - START_HOUR) * hourHeight }}>
                    
                    {/* Time Column (Scrolls with grid) */}
                    <div className="w-10 flex-none border-r border-gray-200 bg-white relative">
                         {HOURS.map(h => (
                            <div key={h} className="absolute w-full text-right pr-1.5 text-[9px] font-medium text-gray-400" style={{ top: (h - START_HOUR) * hourHeight, transform: 'translateY(-50%)' }}>
                                {h === 0 ? 'Midnight' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                            </div>
                        ))}
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 relative">
                        {/* Horizontal Hour Lines */}
                        {HOURS.map(h => (
                            <div key={h} className="absolute w-full border-b border-gray-100" style={{ top: (h - START_HOUR) * hourHeight, height: hourHeight }}></div>
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
                                const dayTasks = tasksToDisplay.filter(t => isSameDay(day, t.task_date));
                                
                                return (
                                    <div key={colIndex} className="flex-1 border-r border-gray-100 last:border-r-0 relative h-full group/col">
                                        {dayTasks.map(task => {
                                            const eventStyles = getEventStyle(task, dayTasks);

                                            if (!eventStyles) return null; 

                                            const { style, theme, isPast } = eventStyles;
                                            return (
                                                <div 
                                                    key={task.id}
                                                    // MODIFICATION: Removed onClick handler
                                                    // onClick={() => setSelectedTask(task)} 
                                                    style={style}
                                                    className={`
                                                        absolute rounded-[3px] px-1 py-0.5 transition-all border-l-2 overflow-hidden flex flex-col justify-start
                                                        hover:brightness-105 hover:z-50 shadow-sm cursor-default // Changed cursor to default
                                                        ${theme.bg} ${theme.border} ${theme.text}
                                                        ${isPast ? 'past-event-striped opacity-80' : ''}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        {task.issue && (<div className={`flex-none w-1 h-1 rounded-full ${task.issue.type === 'Bug' ? 'bg-red-600' : (task.issue.type === 'Improvement' ? 'bg-blue-600' : 'bg-purple-600')}`}></div>)}
                                                        <span className="text-[9px] font-bold truncate leading-none">{task.title}</span>
                                                    </div>
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
        </div>

        {/* --- GLOBAL FIXED MODAL --- (It will never open because selectedTask is always null) */}
        {selectedTask && (
             // ... (Modal JSX remains here but will never render)
             <div className="hidden">Modal Content</div>
        )}
    </div>
  );
}