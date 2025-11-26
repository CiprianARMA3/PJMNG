"use client";

import { Github, Users, Settings } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
// Removed: import Image from 'next/image';
import { useRouter } from "next/navigation";

// Matches your SQL Table Structure
export interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  collaborators: number;
  github_repo_url: string | null;
  metadata: {
    "project-banner"?: string | null;
    "project-icon"?: string | null;
    "github-link"?: string | null;
    "discord-link"?: string | null;
    [key: string]: any;
  } | null;
}

interface ProjectTemplateProps {
  project: ProjectData;
  creatorName?: string;
}

export default function ProjectTemplate({ project, creatorName = "You" }: ProjectTemplateProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Safe Metadata Extraction with Fallbacks
  const meta = project.metadata || {};
  const bannerUrl = meta["project-banner"] || "/default-banner.webp"; 
  const iconUrl = meta["project-icon"] || "/default-avatar.png";
  
  // Prioritize direct column, fallback to metadata
  const githubLink = project.github_repo_url || meta["github-link"]; 
  const discordLink = meta["discord-link"];
  
  const year = new Date(project.created_at).getFullYear();

  return (
    <div 
      onClick={handleCardClick}
      className="container max-w-lg mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-300 group relative"
    >
      
      {/* Banner Section */}
      <div className="relative mb-16">
        <div className="h-32 w-full relative group-hover:brightness-110 transition-all duration-500">
          
          {/* Settings Icon (Clickable independent of card) */}
          <div className="absolute top-2 right-2 z-20" onClick={stopPropagation}>
            <button className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all hover:rotate-90 backdrop-blur-md">
              <Settings size={20} />
            </button>
          </div>

          <div className="absolute inset-0">
            {/* Switched to standard <img> */}
            <img
              src={bannerUrl}
              alt={`${project.name} Banner`}
              className="object-cover w-full h-full absolute inset-0"
            />
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent"></div>
          </div>
        </div>
        
        {/* Project Logo and Name */}
        <div className="absolute -bottom-16 left-6 flex items-end z-10">
          <div className="relative border-4 border-[#121212] rounded-full p-1 bg-[#1e1e1e] shadow-lg">
            <div className="w-[80px] h-[80px] relative rounded-full overflow-hidden">
                {/* Switched to standard <img> */}
                <img
                  src={iconUrl}
                  alt={project.name}
                  className="object-cover w-full h-full"
                />
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
        {/* Description */}
        <div className="mb-6 text-white/70 min-h-[3rem]">
          <p className="text-sm line-clamp-2 leading-relaxed">
            {project.description || "No description provided for this project."}
          </p>
        </div>

        {/* Project Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-white/80 mb-6 border-b border-white/5 pb-4">
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5">
            <p className="font-semibold text-[10px] uppercase text-white/40 mb-1">Since</p>
            <p className="text-md font-medium">{year}</p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5">
            <p className="font-semibold text-[10px] uppercase text-white/40 mb-1">Team</p>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-white/60" />
              <span className="text-md font-medium">{project.collaborators}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5" onClick={stopPropagation}>
            <p className="font-semibold text-[10px] uppercase text-white/40 mb-1">Links</p>
            <div className="flex gap-3">
              {githubLink ? (
                <a href={githubLink} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white hover:scale-110 transition-all">
                   <Github size={18} />
                </a>
              ) : (
                <Github size={18} className="text-white/10 cursor-not-allowed" />
              )}
              
              {discordLink ? (
                <a href={discordLink} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#5865F2] hover:scale-110 transition-all">
                  <FaDiscord size={18} />
                </a>
              ) : (
                <FaDiscord size={18} className="text-white/10 cursor-not-allowed" />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/40">Created by</span>
          <span className="font-medium text-white/80 bg-white/5 px-2 py-1 rounded-md border border-white/5">
            {creatorName}
          </span>
        </div>
      </div>
    </div>
  );
}