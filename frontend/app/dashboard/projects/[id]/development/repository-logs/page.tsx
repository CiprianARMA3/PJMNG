"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

// Components
import Menu from "../../components/menu";

// Icons
import {
    GitCommit,
    GitBranch,
    Github,
    Clock,
    User,
    ExternalLink,
    Calendar as CalendarIcon,
    List as ListIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    X,
    Minimize2,
    Maximize2,
    FileCode,
    Hash,
    Search
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

type GitHubBranch = {
    name: string;
    commit: { sha: string; url: string };
};

type Project = {
    id: string;
    name: string;
    github_repo_url: string | null;
    logo_url?: string | null;
    [key: string]: any;
};

export default function RepositoryPage() {
    // --- CONFIG & HOOKS ---
    const supabase = createClient();
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const { checkAccess, loading: authLoading } = useProjectPermissions(projectId);



    // --- STATE ---

    // Data State
    const [user, setUser] = useState<any>(null);
    const [project, setProject] = useState<Project | null>(null);

    // GitHub Data
    const [commits, setCommits] = useState<GitHubCommit[]>([]);
    const [branches, setBranches] = useState<GitHubBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [selectedBranch, setSelectedBranch] = useState<string>("main");
    const [searchQuery, setSearchQuery] = useState("");

    // View State
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [numDaysInView, setNumDaysInView] = useState(7);
    const [hourHeight, setHourHeight] = useState(60);

    // Modal State
    const [selectedCommit, setSelectedCommit] = useState<GitHubCommit | null>(null);

    // Constants
    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    const GRID_TOTAL_HEIGHT = 24 * hourHeight;

    // --- HELPER: Parse GitHub URL ---
    const getRepoDetails = (url: string) => {
        try {
            const cleanUrl = url.replace(/\/$/, "");
            const parts = cleanUrl.split("/");
            if (parts.length >= 5) {
                return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] };
            }
            return null;
        } catch (e) { return null; }
    };

    const repoDetails = useMemo(() => {
        return project?.github_repo_url ? getRepoDetails(project.github_repo_url) : null;
    }, [project]);

    // --- EFFECTS ---

    // 1. Initial Fetch
    useEffect(() => {
        const init = async () => {
            if (!projectId) return;
            setLoading(true);
            if (!authLoading && !checkAccess('repository-logs')) {
                router.push(`/dashboard/projects/${projectId}`);
                return null;
            }

            try {
                // 1. Get Auth User
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
                if (authError || !authUser) {
                    router.push("/auth/login");
                    return;
                }

                // 2. Fetch User Profile (To fix Menu Name/Avatar)
                const { data: userProfile } = await supabase
                    .from("users")
                    .select("name, surname, metadata")
                    .eq("id", authUser.id)
                    .single();

                // 3. Create merged user object
                const finalUser = {
                    ...authUser,
                    user_metadata: {
                        ...authUser.user_metadata,
                        full_name: userProfile?.name
                            ? `${userProfile.name} ${userProfile.surname || ""}`.trim()
                            : authUser.user_metadata?.full_name || "User",
                        avatar_url: userProfile?.metadata?.avatar_url || authUser.user_metadata?.avatar_url
                    }
                };

                setUser(finalUser);

                // 4. Fetch Project Data
                const { data: proj, error: projectError } = await supabase
                    .from("projects")
                    .select("*")
                    .eq("id", projectId)
                    .single();

                if (projectError || !proj) {
                    router.push("/dashboard");
                    return;
                }

                setProject(proj);

            } catch (err) {
                console.error("Error initializing:", err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [projectId, router, supabase]);

    // 2. Fetch Branches
    useEffect(() => {
        const fetchBranches = async () => {
            if (!repoDetails) return;
            try {
                const res = await fetch(`https://api.github.com/repos/${repoDetails.owner}/${repoDetails.repo}/branches`);
                if (res.ok) {
                    const data = await res.json();
                    setBranches(data);
                    if (data.length > 0) {
                        const defaultBranch = data.find((b: any) => b.name === 'main') || data.find((b: any) => b.name === 'master') || data[0];
                        setSelectedBranch(defaultBranch.name);
                    }
                }
            } catch (e) { console.error(e); }
        };
        fetchBranches();
    }, [repoDetails]);

    // 3. Fetch Commits
    useEffect(() => {
        const fetchCommits = async () => {
            if (!project) return;
            if (!repoDetails) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`https://api.github.com/repos/${repoDetails.owner}/${repoDetails.repo}/commits?sha=${selectedBranch}&per_page=100`);

                if (!res.ok) {
                    if (res.status === 403) throw new Error("GitHub API Rate Limit Exceeded");
                    if (res.status === 404) throw new Error("Repo not found or private");
                    throw new Error("Failed to fetch commits");
                }

                const data = await res.json();
                setCommits(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCommits();
    }, [repoDetails, selectedBranch]);

    useEffect(() => {
        document.body.style.overflow = selectedCommit ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [selectedCommit]);

    // --- CALENDAR LOGIC ---

    const filteredCommits = useMemo(() => {
        if (!searchQuery) return commits;
        const lowerQ = searchQuery.toLowerCase();
        return commits.filter(c =>
            c.commit.message.toLowerCase().includes(lowerQ) ||
            c.commit.author.name.toLowerCase().includes(lowerQ) ||
            c.sha.includes(lowerQ)
        );
    }, [commits, searchQuery]);

    const getStartOfWeek = (d: Date) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const n = new Date(d.setDate(diff));
        n.setHours(0, 0, 0, 0);
        return n;
    };

    const navigateDate = (dir: number) => {
        const n = new Date(startDate);
        if (numDaysInView > 1) {
            n.setDate(startDate.getDate() + (dir * numDaysInView));
        } else {
            n.setDate(startDate.getDate() + dir);
        }
        setStartDate(n);
    };

    const isSameDay = (d1: Date, d2Str: string) => {
        const d2 = new Date(d2Str);
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    };

    const dateStrip = useMemo(() => {
        const days = [];
        const base = new Date(startDate);
        base.setHours(0, 0, 0, 0);
        for (let i = 0; i < numDaysInView; i++) {
            days.push(new Date(base.getTime() + i * 86400000));
        }
        return days;
    }, [startDate, numDaysInView]);

    const getCommitLayout = (commit: GitHubCommit, dayCommits: GitHubCommit[]) => {
        const date = new Date(commit.commit.author.date);
        const startMins = date.getHours() * 60 + date.getMinutes();
        const durationMins = 30;
        const endMins = startMins + durationMins;
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
            timeStr: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    };

    const formatTimeAgo = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = Math.ceil(Math.abs(now.getTime() - d.getTime()) / (86400000));
        if (diff < 2) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // --- RENDER ---

    if (loading) {
        return (
            <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a] light:bg-gray-50">
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
        <div className="flex h-screen bg-[#0a0a0a] light:bg-gray-50 text-white light:text-gray-900 overflow-hidden font-sans">
            <style jsx global>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        @media (prefers-color-scheme: light) {
            ::-webkit-scrollbar-track { background: #f9fafb; }
        }
        ::-webkit-scrollbar-thumb { background: #262626; border-radius: 4px; }
        @media (prefers-color-scheme: light) {
            ::-webkit-scrollbar-thumb { background: #d1d5db; }
        }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>

            {/* --- SIDEBAR --- */}
            <Menu project={project} user={user} />

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 ml-64 flex flex-col h-full bg-[#0a0a0a] light:bg-gray-50">

                {/* --- HEADER --- */}
                <div className="flex-none h-16 mt-[60px] px-6 border-b border-white/5 light:border-gray-200 flex items-center justify-between bg-[#0a0a0a] light:bg-white z-20">
                    <div className="flex items-center gap-6">
                        <h1 className="text-xl font-bold tracking-tight">
                            Repository <span className="text-white/30 light:text-gray-400 text-lg font-light">History</span>
                        </h1>

                        <div className="h-6 w-px bg-white/10 light:bg-gray-200"></div>

                        {/* Date Navigation (Restored to Top Bar) */}
                        <div className="flex items-center gap-3">
                            {viewMode === 'calendar' && (
                                <>
                                    <div className="flex items-center bg-[#161616] light:bg-gray-100 rounded-md border border-white/5 light:border-gray-200 p-0.5">
                                        <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-white/10 light:hover:bg-gray-200 rounded text-white/60 light:text-gray-600 hover:text-white light:hover:text-gray-900"><ChevronLeft size={16} /></button>
                                        <button onClick={() => setStartDate(getStartOfWeek(new Date()))} className="px-3 text-[11px] font-bold uppercase text-white/60 light:text-gray-600 hover:text-white light:hover:text-gray-900">Today</button>
                                        <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-white/10 light:hover:bg-gray-200 rounded text-white/60 light:text-gray-600"><ChevronRight size={16} /></button>
                                    </div>
                                    <h2 className="text-sm font-semibold text-white/90 light:text-gray-900 min-w-[140px]">
                                        {startDate.toLocaleString('default', { month: 'long', day: 'numeric' })}
                                    </h2>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Controls (Restored) */}
                        {viewMode === 'calendar' && (
                            <>
                                <div className="flex bg-[#161616] light:bg-gray-100 rounded-md border border-white/5 light:border-gray-200 p-0.5">
                                    <button onClick={() => setHourHeight(60)} className={`p-2 rounded text-white/60 light:text-gray-600 hover:text-white light:hover:text-gray-900 ${hourHeight === 60 ? 'bg-white/10 light:bg-white light:shadow-sm' : ''}`} title="Compact View"><Minimize2 size={16} /></button>
                                    <button onClick={() => setHourHeight(120)} className={`p-2 rounded text-white/60 light:text-gray-600 hover:text-white light:hover:text-gray-900 ${hourHeight === 120 ? 'bg-white/10 light:bg-white light:shadow-sm' : ''}`} title="Expanded View"><Maximize2 size={16} /></button>
                                </div>
                                <div className="hidden sm:flex bg-[#161616] light:bg-gray-100 rounded-md border border-white/5 light:border-gray-200 p-0.5">
                                    {[1, 3, 5, 7].map(n => (
                                        <button key={n} onClick={() => setNumDaysInView(n)} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${numDaysInView === n ? 'bg-white/10 light:bg-white light:shadow-sm text-white light:text-gray-900' : 'text-white/40 light:text-gray-500 hover:text-white light:hover:text-gray-900'}`}>{n} Days</button>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="h-6 w-px bg-white/10 light:bg-gray-200"></div>

                        {/* View Switcher */}
                        <div className="flex bg-[#161616] light:bg-gray-100 rounded-md border border-white/5 light:border-gray-200 p-0.5">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'list' ? 'bg-white/10 light:bg-white light:shadow-sm text-white light:text-gray-900' : 'text-white/40 light:text-gray-500 hover:text-white light:hover:text-gray-900'}`}
                            >
                                <ListIcon size={14} /> List
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'calendar' ? 'bg-white/10 light:bg-white light:shadow-sm text-white light:text-gray-900' : 'text-white/40 light:text-gray-500 hover:text-white light:hover:text-gray-900'}`}
                            >
                                <CalendarIcon size={14} /> Calendar
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- FILTERS BAR (Secondary Header) --- */}
                <div className="flex-none px-6 py-4 flex items-center justify-between gap-4 border-b border-white/5 light:border-gray-200 bg-[#0a0a0a] light:bg-white">
                    <div className="flex items-center gap-3 flex-1">
                        {/* Branch Selector */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40 light:text-gray-500">
                                <GitBranch size={14} />
                            </div>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                disabled={branches.length === 0}
                                className="bg-[#161616] light:bg-gray-100 border border-white/10 light:border-gray-200 text-white light:text-gray-900 text-xs rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 block appearance-none outline-none cursor-pointer disabled:opacity-50 min-w-[140px]"
                            >
                                {branches.length > 0 ? (
                                    branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)
                                ) : (
                                    <option>Main</option>
                                )}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-white/40 light:text-gray-500">
                                <ChevronRight size={12} className="rotate-90" />
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40 light:text-gray-500">
                                <Search size={14} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search messages or authors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#161616] light:bg-gray-100 border border-white/10 light:border-gray-200 text-white light:text-gray-900 text-xs rounded-lg pl-9 pr-4 py-2 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder:text-white/20 light:placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                <div className="flex-1 overflow-hidden relative flex flex-col bg-[#0a0a0a] light:bg-gray-50">

                    {!repoDetails ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><GitBranch size={32} className="text-white/40" /></div>
                            <h3 className="text-lg font-bold">No Repository Connected</h3>
                            <p className="text-sm text-white/40 max-w-xs mt-2">Add a GitHub URL to your project settings.</p>
                        </div>
                    ) : loading ? (
                        <div role="status" className="flex justify-center items-center h-full bg-[#0a0a0a] light:bg-gray-50">
                            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="p-10 flex justify-center">
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* List View */}
                            {viewMode === 'list' && (
                                <div className="flex-1 overflow-y-auto p-8 animate-in fade-in duration-300">
                                    <div className="max-w-4xl mx-auto relative pb-20">
                                        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/10 light:bg-gray-200 z-0"></div>
                                        <div className="space-y-6 relative z-10">
                                            {filteredCommits.length === 0 ? (
                                                <div className="pl-12 text-white/40 light:text-gray-500 italic">No commits match your search.</div>
                                            ) : (
                                                filteredCommits.map((commit) => (
                                                    <div key={commit.sha} className="group relative flex gap-6">
                                                        <div className="flex-none mt-1">
                                                            <div className="w-10 h-10 rounded-full bg-[#111] light:bg-white border border-white/10 light:border-gray-200 flex items-center justify-center group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-colors shadow-sm">
                                                                <GitCommit size={18} className="text-white/40 light:text-gray-400 group-hover:text-purple-400 transition-colors" />
                                                            </div>
                                                        </div>
                                                        <div onClick={() => setSelectedCommit(commit)} className="flex-1 bg-[#111] light:bg-white border border-white/5 light:border-gray-200 rounded-xl p-4 hover:border-white/10 light:hover:border-purple-200 transition-all hover:shadow-lg cursor-pointer">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div>
                                                                    <p className="text-sm font-medium text-white/90 light:text-gray-900 leading-relaxed">{commit.commit.message}</p>
                                                                    <div className="flex items-center gap-3 mt-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-5 h-5 rounded-full bg-white/10 light:bg-gray-100 overflow-hidden">{commit.author ? <img src={commit.author.avatar_url} className="w-full h-full object-cover" /> : <User size={12} className="m-auto mt-1 text-white/50 light:text-gray-500" />}</div>
                                                                            <span className="text-xs text-white/60 light:text-gray-600 font-medium">{commit.commit.author.name}</span>
                                                                        </div>
                                                                        <span className="text-white/10 light:text-gray-300 text-[10px]">•</span>
                                                                        <div className="flex items-center gap-1.5 text-xs text-white/40 light:text-gray-500"><Clock size={12} />{formatTimeAgo(commit.commit.author.date)}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 light:bg-gray-100 border border-white/5 light:border-gray-200 text-[10px] font-bold uppercase tracking-wide text-white/60 light:text-gray-600 group-hover:text-white light:group-hover:text-gray-900 transition-all">
                                                                    {commit.sha.substring(0, 7)} <ExternalLink size={12} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Calendar View */}
                            {viewMode === 'calendar' && (
                                <div className="flex-1 overflow-y-auto relative flex flex-col animate-in fade-in duration-300">

                                    {/* Sticky Date Headers */}
                                    <div className="sticky top-0 z-40 bg-[#0a0a0a] light:bg-white border-b border-white/5 light:border-gray-200 flex flex-none h-12">
                                        <div className="w-14 flex-none border-r border-white/5 light:border-gray-200 bg-[#0a0a0a] light:bg-gray-50" />
                                        <div className="flex-1 flex">
                                            {dateStrip.map((day, i) => {
                                                const isToday = isSameDay(day, new Date().toISOString());
                                                return (
                                                    <div key={i} className="flex-1 border-r border-white/5 light:border-gray-200 flex items-center justify-center gap-2 last:border-r-0">
                                                        <span className={`text-xs uppercase font-bold tracking-wider ${isToday ? 'text-purple-400' : 'text-white/40 light:text-gray-500'}`}>
                                                            {day.toLocaleString('default', { weekday: 'short' })}
                                                        </span>
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-purple-600 text-white' : 'text-white/80 light:text-gray-800'}`}>
                                                            {day.getDate()}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Time Grid */}
                                    <div className="flex flex-1 relative min-h-0">
                                        <div className="w-14 flex-none border-r border-white/5 light:border-gray-200 bg-[#0a0a0a] light:bg-gray-50 relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                                            {HOURS.map(h => (
                                                <div key={h} className="absolute w-full text-right pr-2 text-xs font-medium text-white/20 light:text-gray-400" style={{ top: h * hourHeight, transform: 'translateY(-50%)' }}>
                                                    {h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex-1 relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                                            {HOURS.map(h => (
                                                <div key={h} className="absolute w-full border-b border-white/5 light:border-gray-200" style={{ top: h * hourHeight, height: hourHeight }}>
                                                    <div className="absolute top-1/2 w-full border-t border-white/[0.02] light:border-gray-200/50 border-dashed"></div>
                                                </div>
                                            ))}
                                            <div className="absolute inset-0 flex h-full">
                                                {dateStrip.map((day, colIndex) => {
                                                    const dayCommits = filteredCommits.filter(c => isSameDay(day, c.commit.author.date));
                                                    return (
                                                        <div key={colIndex} className="flex-1 border-r border-white/5 light:border-gray-200 last:border-r-0 relative h-full group/col hover:bg-white/[0.01] light:hover:bg-gray-100">
                                                            {dayCommits.map(commit => {
                                                                const { style, timeStr } = getCommitLayout(commit, dayCommits);
                                                                return (
                                                                    <div key={commit.sha} onClick={() => setSelectedCommit(commit)} style={style} className="absolute rounded px-2 py-1.5 cursor-pointer transition-all border-l-[3px] overflow-hidden flex flex-col justify-start hover:brightness-110 hover:z-50 hover:shadow-lg shadow-sm bg-purple-600/10 light:bg-purple-100 border-purple-500/50 light:border-purple-300 border-l-purple-500 text-purple-100 light:text-purple-800">
                                                                        <div className="flex items-center gap-1.5 min-w-0 mb-0.5">
                                                                            <span className="text-xs font-bold truncate">{commit.commit.message}</span>
                                                                        </div>
                                                                        <span className="text-[9px] text-white/50 light:text-purple-600">{timeStr}</span>
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

            {/* --- MODAL --- */}
            {selectedCommit && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative bg-neutral-900 light:bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 light:border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-2 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 w-50 h-50 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative p-6 border-b border-white/5 light:border-gray-100 flex gap-4 bg-white/[0.02]">
                            <div className="flex-none w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <GitCommit size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 light:bg-gray-100 border border-white/10 light:border-gray-200 text-[10px] font-bold uppercase tracking-wider text-white/50 light:text-gray-500">
                                        <GitBranch size={10} /> {selectedBranch}
                                    </span>
                                    <button onClick={() => setSelectedCommit(null)} className="p-1.5 rounded-lg text-white/40 light:text-gray-400 hover:text-white light:hover:text-gray-900 hover:bg-white/10 light:hover:bg-gray-100 transition-colors"><X size={20} /></button>
                                </div>
                                <h3 className="text-xl font-bold text-white light:text-gray-900 leading-snug pr-8 break-words">{selectedCommit.commit.message}</h3>
                            </div>
                        </div>
                        <div className="relative p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-black/20 light:bg-gray-50 rounded-xl border border-white/5 light:border-gray-200 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full ring-2 ring-white/5 light:ring-gray-200 bg-white/5 light:bg-gray-200 overflow-hidden flex-none">
                                        {selectedCommit.author ? <img src={selectedCommit.author.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-white/30 light:text-gray-500" /></div>}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] uppercase font-bold text-white/30 light:text-gray-400 mb-0.5">Committed By</div>
                                        <div className="text-sm font-semibold text-white light:text-gray-900 truncate">{selectedCommit.commit.author.name}</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-black/20 light:bg-gray-50 rounded-xl border border-white/5 light:border-gray-200 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/8 light:bg-gray-200 border border-purple-500/20 flex flex-col items-center justify-center text-white-400 light:text-purple-600 flex-none">
                                        <span className="text-[8px] font-bold uppercase">{new Date(selectedCommit.commit.author.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-lg font-bold leading-none">{new Date(selectedCommit.commit.author.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-white/30 light:text-gray-400 mb-0.5">Timestamp</div>
                                        <div className="text-sm font-semibold text-white light:text-gray-900">{new Date(selectedCommit.commit.author.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase text-white/40 light:text-gray-500"><FileCode size={14} /> Commit Details</div>
                                <div className="group relative flex items-center justify-between p-4 bg-[#050505] light:bg-gray-50 rounded-xl border border-white/10 light:border-gray-200 hover:border-white/20 light:hover:border-gray-300 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-white/5 light:bg-gray-200 rounded-lg"><Hash size={16} className="text-white/40 light:text-gray-600" /></div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] text-white/30 light:text-gray-400 font-medium">Full SHA-1</span>
                                            <code className="text-xs text-purple-300 light:text-purple-600 font-mono truncate select-all">{selectedCommit.sha}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 pt-2 border-t border-white/5 light:border-gray-100 bg-white/[0.01]">
                            <a href={selectedCommit.html_url} target="_blank" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-white/5">
                                <Github size={18} /> View on GitHub <ExternalLink size={14} className="opacity-50" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}