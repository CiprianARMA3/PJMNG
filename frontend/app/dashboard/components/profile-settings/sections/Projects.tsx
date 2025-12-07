"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Projects() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

            if (data) setProjects(data);
            setLoading(false);
        };
        fetchProjects();
    }, []);

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-white w-8 h-8" /></div>;

    return (
        <div className="container max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
                <p className="text-white/60">Manage your projects and access team workspaces</p>
            </div>

            <div className="bg-white/2 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 bg-white/5 text-sm font-medium">
                    <div className="col-span-4 text-white">Project</div>
                    <div className="col-span-2 text-center text-white">Created</div>
                    <div className="col-span-2 text-center text-white">Members</div>
                    <div className="col-span-2 text-center text-white">Status</div>
                    <div className="col-span-2 text-center text-white">Actions</div>
                </div>

                <div className="divide-y divide-white/5">
                    {projects.map((project) => (
                        <div key={project.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors items-center">
                            {/* Project Info */}
                            <div className="col-span-4 flex items-center space-x-4">
                                <img
                                    src={project.metadata?.["project-icon"] || "/default-avatar.png"}
                                    alt={project.name}
                                    className="w-10 h-10 rounded-lg object-cover border border-white/10 bg-white/5"
                                />
                                <div className="overflow-hidden">
                                    <p className="text-white font-semibold truncate">{project.name}</p>
                                    <p className="text-white/40 text-xs truncate">{project.description || "No description"}</p>
                                </div>
                            </div>

                            {/* Created Date */}
                            <div className="col-span-2 flex items-center justify-center">
                                <span className="text-white/70 text-sm">
                                    {new Date(project.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Members */}
                            <div className="col-span-2 flex items-center justify-center">
                                <span className="text-white/70 text-sm">{project.collaborators}</span>
                            </div>

                            {/* Status (Placeholder logic) */}
                            <div className="col-span-2 flex items-center justify-center">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                    Active
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex items-center justify-center space-x-2">
                                <button 
                                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                    className="bg-white/5 hover:bg-white/10 text-white/90 hover:text-white px-3 py-2 rounded-lg transition-all border border-white/10 hover:border-white/20 flex items-center space-x-1 text-xs"
                                >
                                    <ArrowRight size={14} />
                                    <span>Open</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && (
                        <div className="p-8 text-center text-white/40">No projects found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}