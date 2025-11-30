"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
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
          // .eq("created_by", user.id)
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
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2 text-white">
            Welcome back, <span className="text-purple-400">{userName}</span>!
          </h1>
          <p className="text-gray-400">Here are your active projects:</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 pb-10">
        {/* 1. Render Projects */}
        {projects.map((project) => (
          <ProjectTemplate 
            key={project.id} 
            project={project} 
            creatorName={userName} 
          />
        ))}

        {/* 2. Render Button as the Next Item */}
        {/* - min-h matches the project card height so it centers vertically 
            - ml-4 adds that specific left margin you requested
            - no border, no background
        */}
        <div className="flex items-center justify-start min-h-[300px] ml-4">
           <AddProjectButton />
        </div>
      </div>
    </div>
  );
}