// frontend/app/dashboard/components/dashboard-sections/HomeSection.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, FolderOpen } from "lucide-react";
import ProjectTemplate, { ProjectData } from "../projects/Project";
import AddProjectButton from "../projects/component/addMore";

interface HomeSectionProps {
  user: any;
  userName: string;
}

export default function HomeSection({ user, userName }: HomeSectionProps) {
  const supabase = createClient();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
          <span className="text-xs text-neutral-500 font-medium">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
    
    {/* LEFT: SESSION GREETING */}
    <div className="space-y-1">
        {/* Session Metadata Tag */}
        <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                Authorized Node / Session Initialized
            </span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 uppercase leading-none">
            Welcome back, {userName}<span className="text-purple-600">.</span>
        </h1>

        {/* Description */}
      <p className="text-zinc-500 font-bold text-sm leading-relaxed max-w-md mt-4">
          Audit your active workspace clusters and monitor real-time status across the development ecosystem of your projects.
      </p>
    </div>
</div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        {/* Render Active Projects */}
        {projects.map((project) => (
          <ProjectTemplate
            key={project.id}
            project={project}
            creatorName={userName}
          />
        ))}

        {/* Render "Create New" Card as the last item */}
        <AddProjectButton />
      </div>
    </div>
  );
}