// frontend/app/dashboard/components/profile-settings/sections/Projects.tsx

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
    MoreHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// --- Shared Component: Page Widget ---
const PageWidget = ({ title, icon: Icon, children, action }: any) => (
    <div className="relative z-10 w-full bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl flex flex-col overflow-visible shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] light:shadow-lg hover:border-[#333] light:hover:border-gray-300 transition-colors">
        <div className="px-5 py-4 border-b border-[#222] light:border-gray-200 flex items-center justify-between bg-[#141414] light:bg-gray-50 rounded-t-xl">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#1a1a1a] light:bg-white rounded-md border border-[#2a2a2a] light:border-gray-200">
                    <Icon size={14} className="text-neutral-400 light:text-neutral-500" />
                </div>
                <h3 className="text-sm font-medium text-neutral-300 light:text-neutral-700 tracking-wide">{title}</h3>
            </div>
            {action}
        </div>
        <div className="flex-1 bg-[#111111] light:bg-white min-h-0 relative flex flex-col rounded-b-xl text-neutral-300 light:text-neutral-600">
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

            // Fetch projects where the user is a member
            // Note: This logic depends on your specific RLS policies. 
            // Assuming this endpoint returns projects relevant to the user.
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (data) {
                // Fetch member counts for each project
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
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-neutral-600 w-6 h-6" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 font-sans">
            {/* Header */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
    
    {/* LEFT: ORCHESTRATION TITLES */}
    <div className="space-y-1">
        {/* Status Label */}
        <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                Active Projects
            </span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 uppercase leading-none">
            Projects<span className="text-purple-600">.</span>
        </h1>

        {/* Description */}
        <p className="text-zinc-500 font-bold text-sm leading-relaxed max-w-md mt-4">
            Manage your active deployment environments and coordinate team workspaces.
        </p>
    </div>

    {/* RIGHT: SEARCH PROTOCOL */}
    <div className="relative group w-full md:w-80">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-300 group-focus-within:text-purple-600 transition-colors" strokeWidth={3} />
        </div>
        <input
            type="text"
            placeholder="FILTER CLUSTERS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-zinc-100 text-zinc-900 rounded-2xl pl-12 pr-5 py-4 font-black uppercase tracking-widest text-[10px] placeholder:text-zinc-300 focus:outline-none focus:border-purple-600 focus:bg-zinc-50/50 transition-all shadow-sm"
        />
        
        {/* Subtle Input Shortcut Decorator */}
        <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
            <span className="text-[9px] font-black text-zinc-200 border border-zinc-100 px-1.5 py-0.5 rounded shadow-sm group-focus-within:hidden transition-all">
                CMD + F
            </span>
        </div>
    </div>
</div>

            {/* Projects List Widget */}
            <PageWidget
                title={`All Projects (${projects.length})`}
                icon={LayoutGrid}
                action={
                    <button className="text-neutral-500 hover:text-white light:hover:text-black transition-colors">
                        <MoreHorizontal size={16} />
                    </button>
                }
            >
                {filteredProjects.length > 0 ? (
                    <div className="divide-y divide-[#222] light:divide-gray-200">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                className="group grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#161616] light:hover:bg-gray-50 transition-colors items-center"
                            >
                                {/* Project Info */}
                                <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#2a2a2a] light:border-gray-200 bg-[#1a1a1a] light:bg-gray-100 flex-shrink-0">
                                        {project.metadata?.["project-icon"] ? (
                                            <img
                                                src={project.metadata["project-icon"]}
                                                alt={project.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                                <FolderOpen size={18} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-medium text-neutral-200 light:text-neutral-800 truncate group-hover:text-white light:group-hover:text-black transition-colors">
                                            {project.name}
                                        </h4>
                                        <p className="text-xs text-neutral-500 truncate max-w-[200px]">
                                            {project.description || "No description provided"}
                                        </p>
                                    </div>
                                </div>

                                {/* Meta Data (Hidden on mobile) */}
                                <div className="hidden md:flex col-span-3 items-center gap-2 text-neutral-500">
                                    <Calendar size={12} />
                                    <span className="text-xs">{formatDate(project.created_at)}</span>
                                </div>

                                <div className="hidden md:flex col-span-2 items-center gap-2 text-neutral-500">
                                    <Users size={12} />
                                    <span className="text-xs">{project.memberCount} Members</span>
                                </div>

                                {/* Actions */}
                                <div className="col-span-12 md:col-span-2 flex justify-end">
                                    <button
                                        onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                        className="w-full md:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-[#1a1a1a] light:bg-white hover:bg-[#222] light:hover:bg-gray-50 text-neutral-400 light:text-neutral-600 hover:text-white light:hover:text-black border border-[#2a2a2a] light:border-gray-200 hover:border-[#333] light:hover:border-gray-300 rounded-lg transition-all text-xs font-medium group-hover:shadow-md"
                                    >
                                        <span>Open</span>
                                        <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 bg-[#161616] light:bg-gray-50 rounded-xl flex items-center justify-center mb-4 border border-[#222] light:border-gray-200">
                            <FolderOpen className="w-6 h-6 text-neutral-600" />
                        </div>
                        <h3 className="text-neutral-300 font-medium text-sm mb-1">No projects found</h3>
                        <p className="text-neutral-500 text-xs max-w-xs mx-auto mb-6">
                            {searchQuery ? "Try adjusting your search terms." : "You haven't created or joined any projects yet."}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => router.push('/create-project')}
                                className="px-4 py-2 text-xs font-semibold bg-white light:bg-black text-black light:text-white rounded-lg hover:bg-neutral-200 light:hover:bg-neutral-800 transition-colors"
                            >
                                Create Project
                            </button>
                        )}
                    </div>
                )}
            </PageWidget>
        </div>
    );
}