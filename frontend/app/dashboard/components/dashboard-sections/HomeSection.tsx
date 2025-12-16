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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-white/90 light:text-black/90 mb-1">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-neutral-500 light:text-neutral-600">Here are your active projects.</p>
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