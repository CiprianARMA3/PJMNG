"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    ArrowRight,
    Loader2,
    FolderOpen,
    Users,
    Calendar,
    Search,
    LayoutGrid,
    MoreHorizontal,
    Terminal,
    ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";

// --- MOTION PROTOCOL ---
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { type: "spring", stiffness: 260, damping: 20 } 
    }
};

// --- INDUSTRIAL WIDGET: PROJECT NODE ---
const ProjectNode = ({ title, icon: Icon, children, action }: any) => (
    <div className="relative w-full bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[40px] flex flex-col overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 mb-8">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none z-0" />
        <div className="relative z-10 px-8 py-6 border-b-2 border-zinc-50 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/30">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 text-purple-600 shadow-sm">
                    <Icon size={18} strokeWidth={3} />
                </div>
                <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 block mb-0.5">
                        Active Projects
                    </span>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                        {title}
                    </h3>
                </div>
            </div>
            {action}
        </div>
        <div className="relative z-10 bg-white dark:bg-transparent min-h-0 flex flex-col">
            {children}
        </div>
    </div>
);

export default function Projects() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchProjects = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (data) {
                const projectsWithCounts = await Promise.all(
                    data.map(async (project) => {
                        const { count } = await supabase
                            .from("project_users")
                            .select("*", { count: "exact", head: true })
                            .eq("project_id", project.id);

                        return {
                            ...project,
                            memberCount: count || 0
                        };
                    })
                );
                setProjects(projectsWithCounts);
            }
            setLoading(false);
        };
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20 h-screen items-center">
                <Loader2 className="animate-spin text-purple-600 w-8 h-8" strokeWidth={3} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 font-sans">
            
            {/* --- HEADER BLOCK --- */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Terminal size={14} className="text-purple-600" strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
                            Orchestration / Matrix
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-none">
                        Active Projects<span className="text-purple-600">.</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm leading-relaxed max-w-md mt-6">
                        Manage your active deployment environments and coordinate team workspace nodes.
                    </p>
                </div>

                {/* --- SEARCH PROTOCOL --- */}
                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
                        <Search className="h-4 w-4 text-zinc-300 dark:text-zinc-600 group-focus-within:text-purple-600 transition-colors" strokeWidth={3} />
                    </div>
                    <input
                        type="text"
                        placeholder="FILTER CLUSTERS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 
                                   border-2 border-zinc-100 dark:border-zinc-800 
                                   text-zinc-900 dark:text-zinc-100 
                                   rounded-2xl pl-12 pr-5 py-4 
                                   font-black uppercase tracking-widest text-[10px] 
                                   placeholder:text-zinc-300 dark:placeholder:text-zinc-600 
                                   focus:outline-none focus:border-purple-600 dark:focus:border-purple-500 
                                   focus:bg-zinc-50/50 dark:focus:bg-zinc-900/50 
                                   transition-all shadow-sm dark:shadow-none"
                    />
                    <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                        <span className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 
                                         bg-transparent dark:bg-zinc-900/50 
                                         border border-zinc-100 dark:border-zinc-800 
                                         px-1.5 py-0.5 rounded shadow-sm dark:shadow-none 
                                         group-focus-within:hidden transition-all">
                            CMD + F
                        </span>
                    </div>
                </div>
            </header>

            {/* --- PROJECT LIST WIDGET --- */}
            <ProjectNode
                title={`Projects (${projects.length})`}
                icon={LayoutGrid}
                action={
                    <button className="text-zinc-400 hover:text-purple-600 transition-colors">
                        <MoreHorizontal size={18} strokeWidth={3} />
                    </button>
                }
            >
                {filteredProjects.length > 0 ? (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="divide-y-2 divide-zinc-50 dark:divide-zinc-900"
                    >
                        {filteredProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                variants={itemVariants}
                                className="group grid grid-cols-12 gap-4 px-8 py-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors items-center cursor-pointer"
                                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                            >
                                {/* Project Identity */}
                                <div className="col-span-12 md:col-span-5 flex items-center gap-5">
                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 shadow-sm group-hover:border-purple-200 dark:group-hover:border-purple-900 transition-colors">
                                        {project.metadata?.["project-icon"] ? (
                                            <img
                                                src={project.metadata["project-icon"]}
                                                alt={project.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 font-black text-sm uppercase">
                                                {project.name.substring(0, 2)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate group-hover:text-purple-600 transition-colors">
                                            {project.name}
                                        </h4>
                                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide truncate max-w-[240px]">
                                            {project.description || "No transmission data logged"}
                                        </p>
                                    </div>
                                </div>

                                {/* Metadata Nodes (Desktop) */}
                                <div className="hidden md:flex col-span-3 items-center gap-3">
                                    <Calendar size={14} className="text-zinc-400" strokeWidth={2.5} />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-zinc-300 dark:text-zinc-600 tracking-widest">Created</span>
                                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight">{formatDate(project.created_at)}</span>
                                    </div>
                                </div>

                                <div className="hidden md:flex col-span-2 items-center gap-3">
                                    <Users size={14} className="text-zinc-400" strokeWidth={2.5} />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-zinc-300 dark:text-zinc-600 tracking-widest">Team Size</span>
                                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight">{project.memberCount} Nodes</span>
                                    </div>
                                </div>

                                {/* Action Relay */}
                                <div className="col-span-12 md:col-span-2 flex justify-end">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-purple-600 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                                        <ChevronRight size={16} strokeWidth={3} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl flex items-center justify-center mb-6 border-2 border-zinc-100 dark:border-zinc-800">
                            <FolderOpen className="w-8 h-8 text-zinc-300 dark:text-zinc-700" strokeWidth={2} />
                        </div>
                        <h3 className="text-zinc-900 dark:text-white font-black text-lg uppercase tracking-tight mb-2">No Project have been Found</h3>
                        <p className="text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto mb-8">
                            {searchQuery ? "Adjust filter parameters to locate node." : "Initialize your first project to begin."}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => router.push('/create-project')}
                                className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all hover:opacity-90"
                            >
                                Create Project
                            </button>
                        )}
                    </div>
                )}
            </ProjectNode>
        </div>
    );
}