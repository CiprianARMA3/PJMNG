"use client";

import { useEffect, useState } from "react";
import { 
  Github, 
  Users, 
  Settings, 
  Globe, 
  Twitter, 
  Youtube, 
  Facebook, 
  Linkedin, 
  Instagram, 
  ExternalLink 
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Helper to map platform names to icons
const getPlatformIcon = (key: string) => {
  const normalized = key.toLowerCase().replace("-link", "");
  if (normalized.includes("github")) return Github;
  if (normalized.includes("discord")) return FaDiscord;
  if (normalized.includes("twitter")) return Twitter;
  if (normalized.includes("youtube")) return Youtube;
  if (normalized.includes("facebook")) return Facebook;
  if (normalized.includes("linkedin")) return Linkedin;
  if (normalized.includes("instagram")) return Instagram;
  if (normalized.includes("website")) return Globe;
  return ExternalLink;
};

export interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
  collaborators: number; // We will override this with a fresh fetch
  github_repo_url: string | null;
  metadata: {
    "project-banner"?: string | null;
    "project-icon"?: string | null;
    [key: string]: any;
  } | null;
}

interface ProjectTemplateProps {
  project: ProjectData;
  creatorName?: string;
}

export default function ProjectTemplate({ project, creatorName }: ProjectTemplateProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [creator, setCreator] = useState<string>(creatorName || "Loading...");
  const [memberCount, setMemberCount] = useState<number>(project.collaborators || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Creator Name (if not provided)
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === project.created_by) {
            setCreator("You");
        } else {
            const { data: userProfile } = await supabase
              .from("users")
              .select("name, surname")
              .eq("id", project.created_by)
              .single();

            if (userProfile) {
              setCreator(`${userProfile.name || ''} ${userProfile.surname || ''}`.trim() || "Unknown");
            }
        }

        // 2. Fetch Real Member Count
        const { count, error } = await supabase
          .from("project_users")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id);

        if (!error && count !== null) {
          setMemberCount(count);
        }

      } catch (e) {
        console.error("Error fetching project details", e);
      }
    };

    fetchData();
  }, [project.id, project.created_by, supabase]);

  const handleCardClick = () => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Metadata Extraction
  const meta = project.metadata || {};
  const bannerUrl = meta["project-banner"] || "/default-banner.webp"; 
  const iconUrl = meta["project-icon"] || "/default-avatar.png";
  
  // Extract all links dynamically
  const metadataLinks = Object.entries(meta)
    .filter(([key, value]) => key.endsWith('-link') && typeof value === 'string' && value.length > 0)
    .map(([key, value]) => ({
      key,
      url: value as string,
      Icon: getPlatformIcon(key)
    }));

  // Also check direct github_repo_url if not in metadata
  if (project.github_repo_url && !metadataLinks.some(l => l.key === 'github-link')) {
    metadataLinks.push({ key: 'github-repo', url: project.github_repo_url, Icon: Github });
  }

  // Formatted Date: "07 Dec 2025"
  const formattedDate = new Date(project.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
  });

  return (
    <div 
      onClick={handleCardClick}
      className="container max-w-lg mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-300 group relative"
    >
      {/* Banner Section */}
      <div className="relative mb-16">
        <div className="h-32 w-full relative group-hover:brightness-110 transition-all duration-500">
          <div className="absolute top-2 right-2 z-20" onClick={stopPropagation}>
            <button className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all hover:rotate-90 backdrop-blur-md">
              <Settings size={20} />
            </button>
          </div>

          <div className="absolute inset-0">
            <img src={bannerUrl} alt={`${project.name} Banner`} className="object-cover w-full h-full absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent"></div>
          </div>
        </div>
        
        {/* Project Logo and Name */}
        <div className="absolute -bottom-16 left-6 flex items-end z-10">
          <div className="relative border-4 border-[#121212] rounded-full p-1 bg-[#1e1e1e] shadow-lg">
            <div className="w-[80px] h-[80px] relative rounded-full overflow-hidden">
                <img src={iconUrl} alt={project.name} className="object-cover w-full h-full" />
            </div>
          </div>
          
          <div className="ml-[20px] mb-2 mt-[-50px]">
            <p className="project-title text-white text-2xl font-semibold drop-shadow-md tracking-tight group-hover:text-purple-400 transition-colors">
              {project.name}
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 pb-6 pt-2">
        <div className="mb-6 text-white/70 min-h-[3rem]">
          <p className="text-sm line-clamp-2 leading-relaxed">
            {project.description || "No description provided."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-white/80 mb-6 border-b border-white/5 pb-4">
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5">
            <p className="font-semibold text-[10px] uppercase text-white/40 mb-1">Created</p>
            <p className="text-xs font-medium text-center">{formattedDate}</p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5">
            <p className="font-semibold text-[10px] uppercase text-white/40 mb-1">Members</p>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-white/60" />
              <span className="text-md font-medium">{memberCount}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5" onClick={stopPropagation}>
            <p className="font-semibold text-[10px] uppercase text-white/40 mb-1">Links</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {metadataLinks.length > 0 ? (
                metadataLinks.slice(0, 3).map((link) => (
                  <a 
                    key={link.key} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-white/60 hover:text-white hover:scale-110 transition-all"
                    title={link.key}
                  >
                     <link.Icon size={16} />
                  </a>
                ))
              ) : (
                <span className="text-[10px] text-white/30 italic">None</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-white/40">Created by</span>
          <span className="font-medium text-white/80 bg-white/5 px-2 py-1 rounded-md border border-white/5">
            {creator}
          </span>
        </div>
      </div>
    </div>
  );
}