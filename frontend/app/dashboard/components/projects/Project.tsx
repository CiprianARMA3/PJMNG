// frontend/app/dashboard/components/projects/Project.tsx
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
  ExternalLink,
  Calendar,
  Link as LinkIcon
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
  return LinkIcon;
};

export interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
  collaborators: number; 
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
  const iconUrl = meta["project-icon"]; // Allow fallback logic in rendering
  
  // Extract all links dynamically
  const metadataLinks = Object.entries(meta)
    .filter(([key, value]) => key.endsWith('-link') && typeof value === 'string' && value.length > 0)
    .map(([key, value]) => ({
      key,
      url: value as string,
      Icon: getPlatformIcon(key)
    }));

  if (project.github_repo_url && !metadataLinks.some(l => l.key === 'github-link')) {
    metadataLinks.push({ key: 'github-repo', url: project.github_repo_url, Icon: Github });
  }

  // Formatted Date
  const formattedDate = new Date(project.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
  });

  return (
    <div 
      onClick={handleCardClick}
      className="group relative flex flex-col w-full bg-[#111] border border-[#222] hover:border-[#333] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg"
    >
      {/* Banner Area */}
      <div className="relative h-28 w-full overflow-hidden bg-[#161616]">
        <img 
            src={bannerUrl} 
            alt={`${project.name} Banner`} 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
        
        {/* Settings Action */}
        {/* <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button 
                onClick={stopPropagation}
                className="p-1.5 bg-[#1a1a1a] hover:bg-[#222] text-neutral-400 hover:text-white border border-[#333] rounded-lg transition-colors"
            >
                <Settings size={14} />
            </button>
        </div> */}
      </div>

      {/* Content Body */}
      <div className="flex-1 px-5 pb-5 -mt-8 relative z-10 flex flex-col">
        {/* Header: Icon + Title */}
        <div className="flex items-end gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-1 shadow-lg group-hover:border-[#333] transition-colors overflow-hidden">
                 {iconUrl ? (
                     <img src={iconUrl} alt="Icon" className="w-full h-full object-cover rounded-lg" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#111] rounded-lg text-neutral-600 font-bold text-lg">
                        {project.name.substring(0, 2).toUpperCase()}
                    </div>
                 )}
            </div>
            <div className="mb-1 min-w-0 flex-1">
                <h3 className="text-lg font-medium text-white truncate group-hover:text-neutral-200 transition-colors">
                    {project.name}
                </h3>
            </div>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-500 line-clamp-2 mb-6 h-8 leading-relaxed">
            {project.description || "No description provided for this project."}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#161616] border border-[#222] rounded-lg p-2.5 flex items-center gap-3">
                 <Calendar size={14} className="text-neutral-600" />
                 <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-500 uppercase font-medium">Created</span>
                    <span className="text-xs text-neutral-300">{formattedDate}</span>
                 </div>
            </div>
            
            <div className="bg-[#161616] border border-[#222] rounded-lg p-2.5 flex items-center gap-3">
                 <Users size={14} className="text-neutral-600" />
                 <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-500 uppercase font-medium">Team</span>
                    <span className="text-xs text-neutral-300">{memberCount} Members</span>
                 </div>
            </div>
        </div>

        {/* Footer: Links & Creator */}
        <div className="mt-auto pt-4 border-t border-[#222] flex items-center justify-between">
            {/* Social Links */}
            <div className="flex items-center gap-2" onClick={stopPropagation}>
                 {metadataLinks.length > 0 ? (
                    metadataLinks.slice(0, 3).map((link) => (
                      <a 
                        key={link.key} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-1.5 rounded-md hover:bg-[#222] text-neutral-500 hover:text-white transition-colors"
                        title={link.key}
                      >
                         <link.Icon size={14} />
                      </a>
                    ))
                 ) : (
                    <span className="text-[10px] text-neutral-600 italic px-1">No links</span>
                 )}
                 {metadataLinks.length > 3 && (
                     <span className="text-[10px] text-neutral-600">+{metadataLinks.length - 3}</span>
                 )}
            </div>

            {/* Creator Badge */}
            <div className="text-[10px] text-neutral-500 flex items-center gap-1.5">
                <span>by</span>
                <span className="font-medium text-neutral-400 bg-[#161616] px-1.5 py-0.5 rounded border border-[#222]">
                    {creator}
                </span>
            </div>
        </div>

      </div>
    </div>
  );
}