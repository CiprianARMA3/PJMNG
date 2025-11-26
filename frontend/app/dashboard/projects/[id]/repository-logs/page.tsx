"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../components/menu"; // Adjust path
import { 
  GitCommit, GitBranch, Github, Clock, User, ExternalLink, 
  Calendar as CalendarIcon, List as ListIcon, 
  ChevronLeft, ChevronRight, Loader2, AlertCircle, X 
} from "lucide-react";

// --- TYPES ---
type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string; // ISO 8601
    };
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null; 
};

type Project = {
  id: string;
  name: string;
  github_repo_url: string | null;
};

export default function RepositoryPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // --- GLOBAL STATE ---
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  
  // --- REPO DATA ---
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- CALENDAR STATE ---
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [numDaysInView, setNumDaysInView] = useState(7); 
  const [hourHeight, setHourHeight] = useState(60); // px per hour
  const [selectedCommit, setSelectedCommit] = useState<GitHubCommit | null>(null);

  // --- CONFIG ---
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const GRID_TOTAL_HEIGHT = 24 * hourHeight;

  // --- HELPER: Parse GitHub URL ---
  const getRepoDetails = (url: string) => {
    try {
      const cleanUrl = url.replace(/\/$/, "");
      const parts = cleanUrl.split("/");
      if (parts.length >= 5) return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] };
      return null;
    } catch (e) { return null; }
  };

  // --- INITIAL FETCH ---
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);

      const { data: proj } = await supabase.from("projects").select("id, name, github_repo_url").eq("id", projectId).single();
      if (proj) {
        setProject(proj);
        if (proj.github_repo_url) {
            const details = getRepoDetails(proj.github_repo_url);
            if (details) {
                try {
                    // Fetching 100 to populate the calendar better
                    const res = await fetch(`https://api.github.com/repos/${details.owner}/${details.repo}/commits?per_page=100`);
                    if (!res.ok) throw new Error("Failed to fetch commits");
                    const data = await res.json();
                    setCommits(data);
                } catch (err: any) { setError(err.message); }
            } else { setError("Invalid GitHub URL"); }
        }
      }
      setLoading(false);
    };
    init();
  }, [projectId]);

  // --- CALENDAR HELPERS ---
  const getStartOfWeek = (d: Date) => { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const n = new Date(d.setDate(diff)); n.setHours(0,0,0,0); return n; };
  const navigateDate = (dir: number) => { const n = new Date(startDate); n.setDate(startDate.getDate() + (dir * numDaysInView)); setStartDate(n); };
  const isSameDay = (d1: Date, d2Str: string) => { const d2 = new Date(d2Str); return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate(); };

  const dateStrip = useMemo(() => {
    const days = []; const base = new Date(startDate); base.setHours(0,0,0,0);
    for (let i = 0; i < numDaysInView; i++) days.push(new Date(base.getTime() + i * 86400000));
    return days;
  }, [startDate, numDaysInView]);

  // --- COMMIT CALENDAR LAYOUT LOGIC ---
  const getCommitLayout = (commit: GitHubCommit, dayCommits: GitHubCommit[]) => {
      // 1. Calculate time in minutes
      const date = new Date(commit.commit.author.date);
      const startMins = date.getHours() * 60 + date.getMinutes();
      // 2. Commits are instantaneous, so we give them a visual height of 30 mins
      const durationMins = 30; 
      const endMins = startMins + durationMins;

      // 3. Calculate overlaps to spread them horizontally
      const overlaps = dayCommits.filter(c => {
          const cDate = new Date(c.commit.author.date);
          const cStart = cDate.getHours() * 60 + cDate.getMinutes();
          const cEnd = cStart + 30;
          return startMins < cEnd && endMins > cStart;
      });
      overlaps.sort((a, b) => new Date(a.commit.author.date).getTime() - new Date(b.commit.author.date).getTime());
      
      const idx = overlaps.findIndex(c => c.sha === commit.sha);
      const width = 100 / overlaps.length;
      const left = idx * width;
      const top = (startMins / 60) * hourHeight;
      const height = (durationMins / 60) * hourHeight;

      return { 
          style: { top: `${top}px`, height: `${height}px`, left: `${left}%`, width: `${width}%`, zIndex: 10 + idx },
          timeStr: date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })
      };
  };

  const formatTimeAgo = (iso: string) => {
    const d = new Date(iso); const now = new Date();
    const diff = Math.ceil(Math.abs(now.getTime() - d.getTime()) / (86400000));
    return diff < 2 ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) return <div className="h-screen bg-[#0a0a0a] flex items-center justify-center text-white"><Loader2 className="animate-spin text-white/20"/></div>;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #262626; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>
      
      <Menu project={project} user={user} />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[#0a0a0a]">
        
        {/* --- HEADER --- */}
        <div className="flex-none h-16 mt-[60px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a] z-20">
            <div className="flex items-center gap-6">
                <h1 className="text-xl font-bold tracking-tight">Repository <span className="text-white/30 text-lg font-light">History</span></h1>
                
                {project?.github_repo_url && (
                    <div className="hidden md:flex items-center gap-2 text-[10px] uppercase font-bold text-white/40 bg-[#161616] px-3 py-1.5 rounded-lg border border-white/5">
                        <Github size={12} /> 
                        <span>{getRepoDetails(project.github_repo_url)?.owner} / {getRepoDetails(project.github_repo_url)?.repo}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* CALENDAR CONTROLS (Only visible in Calendar mode) */}
                {viewMode === 'calendar' && (
                    <div className="flex items-center bg-[#161616] rounded-md border border-white/5 p-0.5">
                        <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white"><ChevronLeft size={16}/></button>
                        <button onClick={() => setStartDate(getStartOfWeek(new Date()))} className="px-3 text-[11px] font-bold uppercase text-white/60 hover:text-white">Today</button>
                        <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-white/10 rounded text-white/60"><ChevronRight size={16}/></button>
                    </div>
                )}

                {/* VIEW SWITCHER */}
                <div className="flex bg-[#161616] rounded-lg border border-white/5 p-1">
                    <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}>
                        <ListIcon size={14} /> List
                    </button>
                    <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}>
                        <CalendarIcon size={14} /> Calendar
                    </button>
                </div>
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {!project?.github_repo_url ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><GitBranch size={32} className="text-white/40"/></div>
                    <h3 className="text-lg font-bold">No Repository Connected</h3>
                    <p className="text-sm text-white/40 max-w-xs mt-2">Add a GitHub URL to your project settings.</p>
                </div>
            ) : error ? (
                <div className="p-10 flex justify-center"><div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3"><AlertCircle size={20} /><span>{error}</span></div></div>
            ) : (
                <>
                    {/* === LIST VIEW === */}
                    {viewMode === 'list' && (
                        <div className="flex-1 overflow-y-auto p-8 animate-in fade-in duration-300">
                            <div className="max-w-4xl mx-auto relative pb-20">
                                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/10 z-0"></div>
                                <div className="space-y-6 relative z-10">
                                    {commits.map((commit, index) => (
                                        <div key={commit.sha} className="group relative flex gap-6">
                                            <div className="flex-none mt-1">
                                                <div className="w-10 h-10 rounded-full bg-[#111] border border-white/10 flex items-center justify-center group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-colors shadow-sm">
                                                    <GitCommit size={18} className="text-white/40 group-hover:text-purple-400 transition-colors" />
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all hover:shadow-lg hover:shadow-blue-900/5">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-white/90 leading-relaxed">{commit.commit.message}</p>
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden">{commit.author ? <img src={commit.author.avatar_url} className="w-full h-full object-cover"/> : <User size={12} className="m-auto mt-1 text-white/50"/>}</div>
                                                                <span className="text-xs text-white/60 font-medium">{commit.commit.author.name}</span>
                                                            </div>
                                                            <span className="text-white/10 text-[10px]">•</span>
                                                            <div className="flex items-center gap-1.5 text-xs text-white/40"><Clock size={12} />{formatTimeAgo(commit.commit.author.date)}</div>
                                                        </div>
                                                    </div>
                                                    <a href={commit.html_url} target="_blank" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-bold uppercase tracking-wide text-white/60 hover:text-white transition-all">
                                                        {commit.sha.substring(0, 7)} <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === CALENDAR VIEW (OF COMMITS) === */}
                    {viewMode === 'calendar' && (
                        <div className="flex-1 overflow-y-auto relative flex flex-col animate-in fade-in duration-300">
                             {/* Date Headers */}
                            <div className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/5 flex flex-none h-12">
                                <div className="w-14 flex-none border-r border-white/5 bg-[#0a0a0a]" />
                                <div className="flex-1 flex">
                                    {dateStrip.map((day, i) => { 
                                        const isToday = isSameDay(day, new Date().toISOString()); 
                                        return (<div key={i} className="flex-1 border-r border-white/5 flex items-center justify-center gap-2 last:border-r-0"><span className={`text-xs uppercase font-bold tracking-wider ${isToday ? 'text-purple-400' : 'text-white/40'}`}>{day.toLocaleString('default', { weekday: 'short' })}</span><div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-purple-600 text-white' : 'text-white/80'}`}>{day.getDate()}</div></div>); 
                                    })}
                                </div>
                            </div>
                            
                            {/* Time Grid */}
                            <div className="flex flex-1 relative min-h-0">
                                {/* Y-Axis Times */}
                                <div className="w-14 flex-none border-r border-white/5 bg-[#0a0a0a] relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                                    {HOURS.map(h => (<div key={h} className="absolute w-full text-right pr-2 text-xs font-medium text-white/20" style={{ top: h * hourHeight, transform: 'translateY(-50%)' }}>{h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`}</div>))}
                                </div>
                                
                                {/* The Grid */}
                                <div className="flex-1 relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                                    {/* Horizontal Lines */}
                                    {HOURS.map(h => (<div key={h} className="absolute w-full border-b border-white/5" style={{ top: h * hourHeight, height: hourHeight }}><div className="absolute top-1/2 w-full border-t border-white/[0.02] border-dashed"></div></div>))}
                                    
                                    {/* Commit Blocks */}
                                    <div className="absolute inset-0 flex h-full">
                                        {dateStrip.map((day, colIndex) => {
                                            const dayCommits = commits.filter(c => isSameDay(day, c.commit.author.date));
                                            return (
                                                <div key={colIndex} className="flex-1 border-r border-white/5 last:border-r-0 relative h-full">
                                                    {dayCommits.map(commit => {
                                                        const { style, timeStr } = getCommitLayout(commit, dayCommits);
                                                        return (
                                                            <div 
                                                                key={commit.sha} 
                                                                onClick={() => setSelectedCommit(commit)}
                                                                style={style} 
                                                                className="absolute rounded bg-blue-500/10 border border-blue-500/30 border-l-2 border-l-blue-500 p-1 cursor-pointer hover:bg-blue-500/20 hover:z-50 transition-all overflow-hidden"
                                                            >
                                                                <div className="text-[10px] font-bold text-blue-200 truncate">{commit.commit.message}</div>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <div className="w-3 h-3 rounded-full bg-white/10 overflow-hidden">
                                                                        {commit.author ? <img src={commit.author.avatar_url} className="w-full h-full object-cover"/> : <User size={8} className="text-white/50 m-auto"/>}
                                                                    </div>
                                                                    <span className="text-[9px] text-white/40">{timeStr}</span>
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
                    )}
                </>
            )}
        </div>
      </main>

      {/* --- COMMIT DETAILS MODAL --- */}
      {selectedCommit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95">
                  <button onClick={() => setSelectedCommit(null)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"><X size={16} /></button>
                  
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20"><GitCommit size={20} /></div>
                      <div>
                          <div className="text-[10px] uppercase font-bold text-white/40">Commit Details</div>
                          <div className="font-mono text-sm text-white/60">{selectedCommit.sha.substring(0,7)}</div>
                      </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-4 leading-snug">{selectedCommit.commit.message}</h3>

                  <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/5 mb-4">
                      <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40">Author</span>
                          <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{selectedCommit.commit.author.name}</span>
                              <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden">{selectedCommit.author && <img src={selectedCommit.author.avatar_url} className="w-full h-full object-cover"/>}</div>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40">Date</span>
                          <span className="text-sm font-medium">{new Date(selectedCommit.commit.author.date).toLocaleString()}</span>
                      </div>
                  </div>

                  <a href={selectedCommit.html_url} target="_blank" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                      View on GitHub <ExternalLink size={14} />
                  </a>
              </div>
          </div>
      )}
    </div>
  );
}