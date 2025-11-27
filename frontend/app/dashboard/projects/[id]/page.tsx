"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

// Components
import Menu from "./components/menu";
import HEATMAP from "./components/charts/contributions-heatmap";
import PIECHART from "./components/charts/piechart";
import PIECHARTSISSUES from "./components/charts/piechart-issues"; // Ensure this filename matches your component
import CALENDAR from "./components/charts/calendar";
import AIUSAGE from "./components/charts/ai-usage";

import {
  ArrowLeft,
  ExternalLink,
  Github,
  Users,
  Globe,
  ChevronRight,
  Calendar as CalendarIcon,
  Bug,
  Bot,
  Code,
  MessageCircle,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Instagram,
  Loader2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  website_url: string;
  github_repo_url: string;
  created_by: string;
  collaborators: number;
  max_collaborators: number;
  metadata: any;
  created_at: string;
}

// Function to get platform icon
const getPlatformIcon = (platform: string) => {
  const platformIcons: { [key: string]: any } = {
    github: Github,
    discord: MessageCircle,
    twitter: Twitter,
    youtube: Youtube,
    facebook: Facebook,
    linkedin: Linkedin,
    instagram: Instagram,
    website: Globe,
    default: ExternalLink,
  };

  const key = platform.replace('-link', '');
  return platformIcons[key] || platformIcons.default;
};

export default function ProjectPage() {
  // 1. Hooks
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  
  // --- FIX IS HERE ---
  // We add '|| ""' to ensure projectId is always a string and never undefined
  const projectId = (Array.isArray(params.id) ? params.id[0] : params.id) || "";

  // 2. State
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<any>(null);

  // 3. Fetch Data Effect
  useEffect(() => {
    const fetchData = async () => {
      // Prevent running if ID is missing
      if (!projectId) return;

      try {
        setLoading(true);

        // Get User
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          router.push("/auth/login");
          return;
        }

        // Get Project
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projectError || !projectData) {
          console.error("Project not found");
          router.push("/dashboard");
          return;
        }

        // Get Collaborator Status (Security Check)
        const { data: projectUser } = await supabase
          .from("project_users")
          .select("user_id")
          .eq("project_id", projectId)
          .eq("user_id", authUser.id)
          .single();

        const isCreator = projectData.created_by === authUser.id;
        const isCollaborator = !!projectUser;

        if (!isCreator && !isCollaborator) {
          router.push("/dashboard"); // Unauthorized access
          return;
        }

        // Set State
        setUser(authUser);
        setProject(projectData);

      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, router, supabase]);

  // 4. Loading State

 if (loading || !project) {
    return (
      <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-neutral-400 animate-spin fill-white"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // 5. Metadata Logic
  const metadataLinks = Object.entries(project.metadata || {})
    .filter(([key, value]) => {
      return key.endsWith('-link') && 
             value && 
             value !== '' && 
             !key.includes('project-icon') && 
             !key.includes('project-banner');
    })
    .map(([key, value]) => {
      const platform = key.replace('-link', '');
      return {
        key,
        url: value as string,
        platform
      };
    });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex relative">

      {/* Left Sidebar Menu */}
      <Menu project={project} user={user} />
      
      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto bg-[#0a0a0a]">
        <div className="mx-auto pt-16">

          {/* Project Header & Banner */}
          <div className="relative mt-[-10px]">
            {project.metadata?.["project-banner"] ? (
              <img
                src={project.metadata["project-banner"]}
                alt="Project banner"
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-white/5"></div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent p-8">
              <div className="flex items-end justify-between">
                <div className="flex items-end gap-6">
                  {project.metadata?.["project-icon"] ? (
                    <img
                      src={project.metadata["project-icon"]}
                      alt="Project logo"
                      className="w-24 h-24 rounded-3xl border-4 border-[#0a0a0a] object-cover shadow-2xl bg-[#161616] -mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-3xl border-4 border-[#0a0a0a] bg-[#161616] -mb-4 flex items-center justify-center">
                        <Code className="text-white/20 w-10 h-10"/>
                    </div>
                  )}
                  <div className="-mb-2">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">{project.name}</h1>
                    <p className="text-white/70 text-base max-w-2xl line-clamp-2">{project.description || "No description has been provided."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-8">
            
            {/* Unified Header */}
            <div className="flex items-center justify-between mb-8">
              
              {/* Left Side: Navigation Trail */}
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium">
                  <ArrowLeft size={16} /> Back to All Projects
                </Link>
                <ChevronRight size={16} className="text-white/20" />
                <span className="text-sm font-medium text-white/80">Dashboard Overview</span>
              </div>
              
              {/* Right Side: Project Links */}
              {metadataLinks.length > 0 && (
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-white/60 mr-1 flex items-center gap-2">
                    <ExternalLink size={16} className="text-cyan-400" />
                  </h3>
                  
                  {metadataLinks.map((link) => {
                      const IconComponent = getPlatformIcon(link.key);
                      const platformName = link.platform.charAt(0).toUpperCase() + link.platform.slice(1);
                      return (
                        <Link 
                          key={link.key}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-colors flex items-center justify-center"
                          title={`Go to ${platformName}`}
                        >
                          <IconComponent size={18} />
                        </Link>
                      );
                  })}
                </div>
              )}
            </div>
            
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Charts - Passed projectId to all charts to be safe */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><Code size={16} className="text-purple-400" /> Contribution Heatmap</h3>
                <HEATMAP />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><Users size={16} className="text-blue-400" /> Collaboration Status</h3>
                <PIECHART />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><Bug size={16} className="text-red-400" /> Issue Priority</h3>
                
                {/* Type error is now resolved because projectId is guaranteed to be a string 
                   due to the '|| ""' fallback added at the top.
                */}
                <PIECHARTSISSUES projectId={projectId}/>
              </div>

              <div className="lg:col-span-2 space-y-3 mt-[50px]">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><CalendarIcon size={16} className="text-green-400" /> Project Timeline & Events</h3>
                <CALENDAR />
              </div>
              
              <div className="space-y-3 mt-[50px]">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><Bot size={16} className="text-pink-400" /> AI Tool Usage</h3>
                <AIUSAGE />
              </div>
              <br /><br /><br /><br /><br />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}