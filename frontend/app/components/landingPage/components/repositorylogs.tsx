"use client";

import { useMemo, useState } from "react";
import { 
  GitCommit, 
  GitBranch, 
  Calendar as CalendarIcon, 
  List as ListIcon, 
  ChevronLeft, 
  ChevronRight, 
  Github, // Imported for the floating logo
} from "lucide-react";

// --- TYPES (Copied for context) ---
type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string; };
  };
  author: { login: string; avatar_url: string; html_url: string; } | null; 
};

type GitHubBranch = { name: string; commit: { sha: string; url: string }; };

// --- CONFIGURATION CHANGES FOR 4-HOUR WINDOW ---
const START_HOUR = 9; // Start at 9 AM
const END_HOUR = 13;  // End at 1 PM (13:00)
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);


// --- REPOSITORY COMMIT WIDGET (COMPACT SIZE, CALENDAR ONLY) ---
// NOTE: `initialCommits` prop is kept but ignored if mock data is generated internally.
export default function RepositoryCommitWidget() {
    
    // --- STATE & DATA GENERATION ---
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [selectedBranch] = useState<string>("main");
    
    // Config
    const numDaysInView = 3; 
    const hourHeight = 30;   
    const GRID_TOTAL_HEIGHT = (END_HOUR - START_HOUR) * hourHeight;

    // **EMBEDDED SAMPLE DATA (3 Commits + 1 Outlier) **
    const commits: GitHubCommit[] = useMemo(() => {
        const today = new Date();
        const mockData = [];

        const createCommit = (id: number, hour: number, minute: number, dayOffset: number, pfpIndex: number) => {
            const date = new Date(today);
            date.setDate(today.getDate() + dayOffset);
            date.setHours(hour, minute, 0);
            
            return {
                sha: `sha${id}`,
                html_url: "#",
                commit: {
                    message: `Feature ${id}: UI/UX Refactor`,
                    author: { name: `Dev ${id}`, email: "", date: date.toISOString() }
                },
                author: { login: `user${id}`, avatar_url: `https://i.pravatar.cc/32?img=${pfpIndex}`, html_url: "#" }
            };
        };

        // 3 Commits, all on Day 0 (Today)
        mockData.push(createCommit(1, 9, 0, 0, 47));
        mockData.push(createCommit(2, 9, 15, 0, 12)); // Overlap
        mockData.push(createCommit(3, 11, 30, 0, 88));

        // Outlier commit (Outside 9AM-1PM window)
        const dateOutside = new Date(today);
        dateOutside.setHours(8, 30, 0);
        mockData.push({
             sha: `sha_out`,
             html_url: "#",
             commit: {
                 message: `Prep: Early Morning Sync`,
                 author: { name: `Outlier`, email: "", date: dateOutside.toISOString() }
             },
             author: { login: `outlier`, avatar_url: `https://i.pravatar.cc/32?img=99`, html_url: "#" }
        });

        return mockData.sort((a, b) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime());
    }, []);

    const branches: GitHubBranch[] = [
        { name: "main", commit: { sha: "abc", url: "" } },
        { name: "feature/widget", commit: { sha: "def", url: "" } },
    ];
    
    // --- HELPER LOGIC ---
    
    const isSameDay = (d1: Date, d2Str: string) => {
        const d2 = new Date(d2Str); 
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate(); 
    };
    
    const navigateDate = (dir: number) => {
        const n = new Date(startDate); 
        n.setDate(startDate.getDate() + (dir * numDaysInView)); 
        setStartDate(n); 
    };
    
    const dateStrip = useMemo(() => {
        const days = []; 
        const base = new Date(startDate); 
        base.setHours(0,0,0,0);
        for (let i = 0; i < numDaysInView; i++) {
            days.push(new Date(base.getTime() + i * 86400000));
        }
        return days;
    }, [startDate, numDaysInView]);

    const filteredCommits = commits;
    
    const getCommitLayout = (commit: GitHubCommit, dayCommits: GitHubCommit[]) => {
        const date = new Date(commit.commit.author.date);
        const startMinsTotal = date.getHours() * 60 + date.getMinutes();
        
        const offsetMins = START_HOUR * 60;
        if (startMinsTotal < offsetMins || startMinsTotal >= END_HOUR * 60) {
            return null;
        }
        const startMinsRelative = startMinsTotal - offsetMins;

        const durationMins = 30; 
        const endMins = startMinsTotal + durationMins;
        
        const overlaps = dayCommits.filter(c => {
            const cDate = new Date(c.commit.author.date);
            const cStart = cDate.getHours() * 60 + cDate.getMinutes();
            const cEnd = cStart + 30;
            return startMinsTotal < cEnd && endMins > cStart;
        });
        
        overlaps.sort((a, b) => new Date(a.commit.author.date).getTime() - new Date(b.commit.author.date).getTime());
        const idx = overlaps.findIndex(c => c.sha === commit.sha);
        const width = 100 / overlaps.length;
        const left = idx * width;
        const top = (startMinsRelative / 60) * hourHeight;
        
        const effectiveEndMins = Math.min(endMins, END_HOUR * 60);
        const visibleDurationMins = effectiveEndMins - startMinsTotal;
        const height = (visibleDurationMins / 60) * hourHeight;

        return { 
            style: { top: `${top}px`, height: `${Math.max(height, 5)}px`, left: `${left}%`, width: `${width}%`, zIndex: 10 + idx },
            timeStr: date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })
        };
    };


    return (
        // Main Widget Container (Small size, White background)
        <div className="shadow-lg rounded-xl bg-white flex flex-col overflow-hidden font-sans relative w-[100%] max-h-[700px] border border-gray-200 text-gray-900">
            <style jsx global>{`
                /* Light mode scrollbar (Compact size) */
                .widget-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .widget-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .widget-scrollbar::-webkit-scrollbar-thumb { background: #bbb; border-radius: 2px; }
                .widget-scrollbar::-webkit-scrollbar-thumb:hover { background: #999; }
            `}</style>

            {/* --- FLOATING GITHUB LOGO (Opaque Purple) --- */}
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                 <Github size={250} className="text-purple-300 opacity-20 ml-70 rotate-15 mt-10" />
            </div>
            
            {/* --- WIDGET HEADER (GREY - h-12) --- */}
            <div className="flex-none h-12 px-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 z-10">
                
                {/* Left Side: Title & Branch Selector */}
                <div className="flex items-center gap-3 min-w-0">
                     <h2 className="text-xs font-semibold text-gray-800 flex items-center gap-1.5 flex-none">
                        <GitCommit size={12} className="text-purple-600"/> Commit Log
                     </h2>
                    
                    {/* Branch Selector (Compact Dropdown) */}
                    <div className="relative flex-none">
                        <select 
                            value={selectedBranch}
                            onChange={() => {}} // No-op change handler for simplicity
                            className="bg-white border border-gray-200 text-gray-800 text-[10px] rounded-md pl-2 pr-5 py-0.5 focus:ring-1 focus:ring-purple-500 appearance-none outline-none cursor-pointer"
                        >
                            {branches.map(b => <option key={b.name} value={b.name}>{b.name.split("/").pop()}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-1 flex items-center pointer-events-none text-gray-400">
                                <ChevronRight size={10} className="rotate-90" />
                        </div>
                    </div>
                </div>

                {/* Right Side: View Switcher (FIXED TO CALENDAR) */}
                <div className="flex bg-white rounded-md border border-gray-300 p-0.5 shadow-sm flex-none">
                    <button 
                        className={`p-1.5 rounded-md text-purple-700 transition-all bg-purple-100 cursor-default`}
                        title="Calendar View"
                    >
                        <CalendarIcon size={12}/>
                    </button>
                </div>
            </div>
            
            {/* --- WIDGET BODY (CALENDAR VIEW ONLY) --- */}
            <div className="flex-1 overflow-y-auto widget-scrollbar bg-white">
                <div className="flex flex-col h-full bg-white relative">
                    {/* Date Navigation Bar (Small size) */}
                    <div className="flex-none h-8 px-2 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
                        <button onClick={() => navigateDate(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft size={12}/></button>
                        <h2 className="text-[10px] font-bold uppercase text-gray-800">
                            {startDate.toLocaleString('default', { month: 'short', day: 'numeric' })}
                            {numDaysInView > 1 && ` - ${dateStrip[dateStrip.length-1].getDate()}`}
                        </h2>
                        <button onClick={() => navigateDate(1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight size={12}/></button>
                    </div>

                    {/* Sticky Date Headers (Even more compact) */}
                    <div className="sticky top-8 z-20 bg-white border-b border-gray-200 flex flex-none h-8">
                        <div className="w-8 flex-none border-r border-gray-200 bg-white" />
                        <div className="flex-1 flex">
                            {dateStrip.map((day, i) => { 
                                const isToday = isSameDay(day, new Date().toISOString()); 
                                return (
                                    <div key={i} className="flex-1 border-r border-gray-200 flex flex-col items-center justify-center gap-0.5 last:border-r-0">
                                        <span className={`text-[8px] uppercase font-bold tracking-wider ${isToday ? 'text-purple-600' : 'text-gray-500'}`}>
                                            {day.toLocaleString('default', { weekday: 'short' })}
                                        </span>
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isToday ? 'bg-purple-600 text-white' : 'text-gray-800'}`}>
                                            {day.getDate()}
                                        </div>
                                    </div>
                                ); 
                            })}
                        </div>
                    </div>

                    {/* Time Grid (Compact 4-Hour View) */}
                    <div className="flex flex-1 relative min-h-0 overflow-y-auto widget-scrollbar">
                        <div className="flex relative w-full flex-none" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                            {/* Time Column (9 AM to 1 PM) - Enhanced visibility */}
                            <div className="w-8 flex-none border-r border-gray-200 bg-white relative">
                                {HOURS.map(h => (
                                    <div key={h} className="absolute w-full text-right pr-1 text-[9px] font-medium text-gray-600" style={{ top: (h - START_HOUR) * hourHeight, transform: 'translateY(-50%)' }}>
                                        {h === 12 ? '12 PM' : `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`}
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                                {HOURS.map(h => (
                                    <div key={h} className="absolute w-full border-b border-gray-100" style={{ top: (h - START_HOUR) * hourHeight, height: hourHeight }}>
                                        <div className="absolute top-1/2 w-full border-t border-gray-100 border-dashed"></div>
                                    </div>
                                ))}
                                <div className="absolute inset-0 flex h-full">
                                    {dateStrip.map((day, colIndex) => {
                                        const dayCommits = filteredCommits.filter(c => isSameDay(day, c.commit.author.date));
                                        return (
                                            <div key={colIndex} className="flex-1 border-r border-gray-100 last:border-r-0 relative h-full group/col hover:bg-gray-50">
                                                {dayCommits.map(commit => {
                                                    const eventStyles = getCommitLayout(commit, dayCommits);
                                                    if (!eventStyles) return null; // Outside 4-hour window
                                                    
                                                    const { style, timeStr } = eventStyles;
                                                    return (
                                                        <div 
                                                            key={commit.sha} 
                                                            style={style} 
                                                            className="absolute rounded px-1 py-0.5 cursor-default transition-all border-l-[2px] overflow-hidden flex flex-col justify-start hover:brightness-105 shadow-sm bg-purple-100 border-l-purple-500 text-purple-800 z-[60]" 
                                                        >
                                                            <span className="text-[8px] font-bold truncate leading-none">{commit.commit.message.split(":")[0] || commit.commit.message}</span>
                                                            <span className="text-[7px] text-purple-600/70">{timeStr}</span>
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
            </div>
        </div>
    );
}