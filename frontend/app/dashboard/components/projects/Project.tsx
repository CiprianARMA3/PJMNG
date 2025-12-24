"use client";

import { useEffect, useState } from "react";
import {
  Github,
  Users,
  Globe,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Instagram,
  Calendar,
  Link as LinkIcon,
  ChevronRight,
  User as UserIcon,
  Layers
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

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

export default function ProjectTemplate({ project, creatorName }: { project: ProjectData, creatorName?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [creator, setCreator] = useState<string>(creatorName || "Loading...");
  const [memberCount, setMemberCount] = useState<number>(project.collaborators || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === project.created_by) {
          setCreator("You");
        } else {
          const { data: userProfile } = await supabase.from("users").select("name, surname").eq("id", project.created_by).single();
          if (userProfile) setCreator(`${userProfile.name || ''} ${userProfile.surname || ''}`.trim());
        }
        const { count } = await supabase.from("project_users").select("*", { count: "exact", head: true }).eq("project_id", project.id);
        if (count !== null) setMemberCount(count);
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, [project.id, project.created_by, supabase]);

  const meta = project.metadata || {};
  const bannerUrl = meta["project-banner"] || "/default-banner.webp";
  const iconUrl = meta["project-icon"];

  const metadataLinks = Object.entries(meta)
    .filter(([key, value]) => key.endsWith('-link') && typeof value === 'string' && value.length > 0)
    .map(([key, value]) => ({ key, url: value as string, Icon: getPlatformIcon(key) }));

  if (project.github_repo_url && !metadataLinks.some(l => l.key === 'github-link')) {
    metadataLinks.push({ key: 'github-repo', url: project.github_repo_url, Icon: Github });
  }

  const formattedDate = new Date(project.created_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
      className="group relative flex flex-col w-full bg-white dark:bg-zinc-900/40 border-2 border-zinc-100 dark:border-zinc-800 rounded-[32px] overflow-hidden cursor-pointer transition-all duration-500 hover:border-purple-600 dark:hover:border-purple-500 shadow-xl shadow-zinc-200/50 dark:shadow-none min-h-[400px]"
    >
      {/* --- BANNER INTERFACE --- */}
      <div className="relative h-40 w-full overflow-hidden bg-zinc-50 dark:bg-zinc-900">
        <img
          src={bannerUrl}
          alt="Banner"
          className="w-full h-full object-cover opacity-50 dark:opacity-30 group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0A0A0A] via-transparent to-transparent" />
        
        {/* Status Chip */}
        <div className="absolute top-6 right-6 px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full shadow-sm">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Live Project
            </span>
        </div>
      </div>

      {/* --- CORE CONTENT --- */}
      <div className="flex-1 px-8 pb-8 -mt-10 relative z-10 flex flex-col">
        {/* Project Identity Row */}
        <div className="flex items-end gap-5 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 p-1 shadow-2xl overflow-hidden shrink-0 group-hover:border-purple-200 dark:group-hover:border-purple-900 transition-colors">
            {iconUrl ? (
              <img src={iconUrl} alt="Icon" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white font-black text-2xl uppercase">
                {project.name.substring(0, 1)}
              </div>
            )}
          </div>
          <div className="mb-2 min-w-0 flex-1">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-600 dark:text-purple-400 block mb-1">Project</span>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white truncate uppercase tracking-tighter leading-none group-hover:text-purple-600 transition-colors">
              {project.name}
            </h3>
          </div>
        </div>

        {/* Description Ledger */}
        <p className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-8 leading-relaxed h-10">
          {project.description || "No description data logged for this project."}
        </p>

        {/* Matrix Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <Calendar size={16} className="text-purple-600" strokeWidth={3} />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Created</span>
              <span className="text-xs font-black text-zinc-900 dark:text-zinc-200 uppercase tracking-tight">{formattedDate}</span>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <Users size={16} className="text-purple-600" strokeWidth={3} />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Team</span>
              <span className="text-xs font-black text-zinc-900 dark:text-zinc-200 uppercase tracking-tight">{memberCount} Members</span>
            </div>
          </div>
        </div>

        {/* Footer: Asset Relays & Lead */}
        <div className="mt-auto pt-6 border-t-2 border-zinc-50 dark:border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {metadataLinks.slice(0, 3).map((link) => (
              <a
                key={link.key}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
              >
                <link.Icon size={16} strokeWidth={2.5} />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Lead</span>
            <div className="bg-zinc-900 dark:bg-white px-3 py-1 rounded-xl shadow-lg">
                <span className="text-[10px] font-black text-white dark:text-black uppercase">
                    {creator}
                </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Access Protocol Indicator */}
      {/* <div className="absolute bottom-8 right-8 p-2 rounded-full bg-purple-600 text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl shadow-purple-200">
        <ChevronRight size={20} strokeWidth={3} />
      </div> */}
    </div>
  );
}