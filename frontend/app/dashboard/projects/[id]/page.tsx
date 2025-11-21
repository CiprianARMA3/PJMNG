import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Menu from "./components/menu";
import HEATMAP from "./components/charts/contributions-heatmap";
import PIECHART from "./components/charts/piechart";
import PIECHARTSISSUES from "./components/charts/piechart-issues";
import CALENDAR from "./components/charts/calendar";
import AIUSAGE from "./components/charts/ai-usage";
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
import Link from "next/link";

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

  return platformIcons[platform] || platformIcons.default;
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
    .single();

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

  const getAvatarUrl = () => user?.user_metadata?.avatar_url || "/default-avatar.png";

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

  const navItems = [
    { label: "Dashboard", icon: LayoutGrid, href: `/dashboard/projects/${project.id}` },
    { label: "Concepts", icon: BookOpen, href: `/dashboard/projects/${project.id}/concepts` },
    { label: "Board", icon: KanbanSquare, href: `/dashboard/projects/${project.id}/board` },
    { label: "Calendar", icon: Calendar, href: `/dashboard/projects/${project.id}/calendar` },
    { label: "Issues", icon: Bug, href: `/dashboard/projects/${project.id}/issues` },
    { label: "Workflow", icon: Workflow, href: `/dashboard/projects/${project.id}/workflow` },
    { label: "AI", icon: Bot, href: `/dashboard/projects/${project.id}/ai` },
    { label: "AI Code Review", icon: Code, href: `/dashboard/projects/${project.id}/code-review` },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex relative">

      {/* Left Sidebar */}
      <Menu project={project} user={user} />
      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto bg-[#0a0a0a]">
        <div className="mx-auto pt-16">

          {/* Project Header */}
          <div className="relative">
            {project.metadata?.["project-banner"] ? (
              <img
                src={project.metadata["project-banner"]}
                alt="Project banner"
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] to-transparent p-8">
              <div className="flex items-end justify-between">
                <div className="flex items-end gap-6">
                  {project.metadata?.["project-icon"] && (
                    <img
                      src={project.metadata["project-icon"]}
                      alt="Project logo"
                      className="w-20 h-20 rounded-2xl border-2 border-white/20 object-cover"
                    />
                  )}
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{project.name}</h1>
                    <p className="text-white/70 text-lg max-w-2xl">{project.description || "No description provided."}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {project.website_url && (
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white transition-colors"
                    >
                      <Globe size={16} />
                      Visit Website
                    </a>
                  )}
                  
                  {/* Auto-generated metadata links */}
                  {metadataLinks.map((link) => {
                    const IconComponent = getPlatformIcon(link.platform);
                    return (
                      <a
                        key={link.key}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-100 rounded-full transition-colors border border-gray-200 hover:border-gray-300"
                        title={link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                      >
                        <IconComponent className="w-5 h-5 text-gray-800" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Back Link */}
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                <ArrowLeft size={20} /> Back to Dashboard
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <HEATMAP/>
              <PIECHART />
              <PIECHARTSISSUES/>

               <div className="lg:col-span-2 ">
                <CALENDAR />
              </div>
              <AIUSAGE/>

              {/* Main Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Your existing content */}
              </div>

              {/* Sidebar Panel */}
              <div className="space-y-6">
                {/* Your existing content */}
              </div>

            </div>
          </div>
          <br /><br /><br /><br />
        </div>
      </main>
    </div>
  );
}