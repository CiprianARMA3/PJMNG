import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Menu from "./components/menu"; // MENU RE-INSERTED
import HEATMAP from "./components/charts/contributions-heatmap";
import PIECHART from "./components/charts/piechart";
import PIECHARTSISSUES from "./components/charts/piechart-issues";
import CALENDAR from "./components/charts/calendar";
import AIUSAGE from "./components/charts/ai-usage";
import Link from "next/link";

import {
  ArrowLeft,
  ExternalLink,
  Github,
  Users,
  Settings,
  Globe,
  Share2,
  ChevronRight,
  LayoutGrid,
  BookOpen,
  KanbanSquare,
  Calendar,
  Bug,
  Workflow,
  Bot,
  Code,
  MessageCircle,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Instagram,
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

  // Convert platform name (e.g., 'github-link') to key (e.g., 'github')
  const key = platform.replace('-link', '');
  return platformIcons[key] || platformIcons.default;
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/auth/login");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single() as { data: Project | null, error: any };

  if (projectError || !project) redirect("/dashboard");

  const { data: projectUser } = await supabase
    .from("project_users")
    .select("user_id")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .single();

  const isCreator = project.created_by === user.id;
  const isCollaborator = !!projectUser;

  if (!isCreator && !isCollaborator) redirect("/dashboard");

  // Get all link metadata and generate buttons
  const metadataLinks = Object.entries(project.metadata || {})
    .filter(([key, value]) => {
      // Only include keys that end with "-link", have a value, and are not project-icon or project-banner
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
      
      {/* Main Content - ml-64 added back for sidebar spacing */}
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto bg-[#0a0a0a]">
        <div className="mx-auto pt-16">

          {/* --------------------------------------------------- */}
          {/* ## Project Header & Banner */}
          {/* --------------------------------------------------- */}
          <div className="relative mt-[-10px]">
            {project.metadata?.["project-banner"] ? (
              <img
                src={project.metadata["project-banner"]}
                alt="Project banner"
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-r from-purple-800/30 to-blue-800/30"></div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] to-transparent p-8">
              <div className="flex items-end justify-between">
                <div className="flex items-end gap-6">
                  {project.metadata?.["project-icon"] && (
                    <img
                      src={project.metadata["project-icon"]}
                      alt="Project logo"
                      className="w-24 h-24 rounded-3xl border-4 border-[#0a0a0a] object-cover shadow-2xl bg-[#161616] -mb-4"
                    />
                  )}
                  <div className="-mb-2">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">{project.name}</h1>
                    <p className="text-white/70 text-base max-w-2xl">{project.description || "A collaborative and innovative project managed through the dedicated developer dashboard."}</p>
                  </div>
                </div>

                {/* Header Action Buttons (empty) */}
                <div className="flex gap-2">
                  {/* ... */}
                </div>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------- */}
          {/* ## Dashboard Content */}
          {/* --------------------------------------------------- */}
          <div className="p-8">
            
            {/* Unified Header: Back Link/Title (Left) and Project Links (Right) - MODIFIED HERE */}
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
            
            {/* Dashboard Grid - Charts rendered directly (no wrappers, as requested previously) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Chart 1: Contribution Heatmap */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><Code size={16} className="text-purple-400" /> Contribution Heatmap</h3>
                <HEATMAP/>
              </div>

              {/* Chart 2: Collaboration Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><Users size={16} className="text-blue-400" /> Collaboration Status</h3>
                <PIECHART />
              </div>

              {/* Chart 3: Issue Priority */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><Bug size={16} className="text-red-400" /> Issue Priority</h3>
                <PIECHARTSISSUES/>
              </div>

              {/* Chart 4: Calendar/Timeline (Large) */}
              <div className="lg:col-span-2 space-y-3 mt-[50px]">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><Calendar size={16} className="text-green-400" /> Project Timeline & Events</h3>
                <CALENDAR />
              </div>
              
              {/* Chart 5: AI Usage */}
              <div className="space-y-3 mt-[50px]">
                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2"><Bot size={16} className="text-pink-400" /> AI Tool Usage</h3>
                <AIUSAGE/>
              </div>
                  <br /><br /><br /><br /><br />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}