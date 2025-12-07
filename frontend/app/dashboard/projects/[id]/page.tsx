"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

// Components
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
  MoreHorizontal,
  AlertTriangle, // ✅ Added for the warning banner
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

// ... (Helper: Platform Icons and ChartWidget stay the same) ...
const getPlatformIcon = (platform: string) => {
  const platformIcons: { [key: string]: any } = {
    github: Github, discord: MessageCircle, twitter: Twitter, youtube: Youtube,
    facebook: Facebook, linkedin: Linkedin, instagram: Instagram, website: Globe, default: ExternalLink,
  };
  const key = platform.replace('-link', '');
  return platformIcons[key] || platformIcons.default;
};

const ChartWidget = ({ title, icon: Icon, iconColor, children }: any) => (
  <div className="bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col h-full overflow-hidden shadow-sm hover:border-white/20 transition-colors">
    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
      <div className="flex items-center gap-2.5">
        <Icon size={16} className={iconColor} />
        <h3 className="text-sm font-semibold text-white/90 tracking-tight">{title}</h3>
      </div>
      <MoreHorizontal size={16} className="text-white/20" />
    </div>
    <div className="flex-1 p-1 bg-[#0a0a0a] min-h-0 relative flex flex-col">
      {children}
    </div>
  </div>
);

export default function ProjectPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  
  const projectId = (Array.isArray(params.id) ? params.id[0] : params.id) || "";

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<any>(null);
  // ✅ New state for owner status
  const [ownerStatus, setOwnerStatus] = useState<{ active: boolean; status: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);

        // 1. Get Auth User
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          router.push("/auth/login");
          return;
        }

        // 2. Fetch User Profile
        const { data: userProfile } = await supabase
          .from("users")
          .select("name, surname, metadata")
          .eq("id", authUser.id)
          .single();

        const finalUser = {
          ...authUser,
          user_metadata: {
            ...authUser.user_metadata,
            full_name: userProfile?.name 
              ? `${userProfile.name} ${userProfile.surname || ""}`.trim() 
              : authUser.user_metadata?.full_name || "User",
            avatar_url: userProfile?.metadata?.avatar_url || authUser.user_metadata?.avatar_url
          }
        };

        // 3. Fetch Project Data
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projectError || !projectData) {
          router.push("/dashboard");
          return;
        }

        // 4. ✅ Check Permissions & Owner Subscription
        const isCreator = projectData.created_by === authUser.id;

        // Fetch permissions if not creator
        if (!isCreator) {
          const { data: projectUser } = await supabase
            .from("project_users")
            .select("user_id")
            .eq("project_id", projectId)
            .eq("user_id", authUser.id)
            .maybeSingle();

          if (!projectUser) {
            router.push("/dashboard"); 
            return;
          }
        }

        // ✅ Check Owner's Subscription (Crucial Step)
        const { data: ownerData } = await supabase
          .from("users")
          .select("subscription_status, current_period_end")
          .eq("id", projectData.created_by)
          .single();

        if (ownerData) {
           const status = ownerData.subscription_status || 'inactive';
           const endDate = ownerData.current_period_end ? new Date(ownerData.current_period_end) : new Date(0);
           const isActive = ['active', 'trialing'].includes(status) || endDate > new Date();

           setOwnerStatus({ active: isActive, status });
        }

        setUser(finalUser);
        setProject(projectData);

      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, router, supabase]);

  if (loading || !project) {
    return (
      <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        {/* Spinner SVG */}
        <svg aria-hidden="true" className="inline w-8 h-8 text-neutral-400 animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  const metadataLinks = Object.entries(project.metadata || {})
    .filter(([key, value]) => key.endsWith('-link') && value)
    .map(([key, value]) => ({
      key,
      url: value as string,
      platform: key.replace('-link', '')
    }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex relative">

      <Menu project={project} user={user} />
      
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto bg-[#0a0a0a]">
        <div className="mx-auto pt-16">

          {/* ✅ WARNING BANNER FOR EXPIRED SUBSCRIPTION */}
          {ownerStatus && !ownerStatus.active && (
            <div className="bg-red-900/20 border-b border-red-500/20 px-8 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3 text-red-400">
                    <AlertTriangle size={20} className="text-red-500" />
                    <span className="font-medium text-sm">
                        This project will be <strong>AUTOMATICALLY DELETED IN 15 DAYS</strong> if the owner's subscription isn't renewed in tha period of time.
                    </span>
                </div>
                {/* Show Renew button only to the Owner */}
                {user?.id === project.created_by && (
                    <Link href="/dashboard/components/subscriptionFolder" className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-900/20">
                        Renew Subscription
                    </Link>
                )}
            </div>
          )}

          {/* Banner */}
          <div className="relative mt-[-10px]">
             {/* ... (Banner code remains same) ... */}
             {project.metadata?.["project-banner"] ? (
              <img src={project.metadata["project-banner"]} alt="Banner" className="w-full h-64 object-cover" />
            ) : (
              <div className="w-full h-64 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-white/5"></div>
            )}
             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent p-8">
              <div className="flex items-end gap-6">
                {project.metadata?.["project-icon"] ? (
                  <img src={project.metadata["project-icon"]} alt="Logo" className="w-24 h-24 rounded-3xl border-4 border-[#0a0a0a] object-cover shadow-2xl bg-[#161616] -mb-4" />
                ) : (
                  <div className="w-24 h-24 rounded-3xl border-4 border-[#0a0a0a] bg-[#161616] -mb-4 flex items-center justify-center">
                      <Code className="text-white/20 w-10 h-10"/>
                  </div>
                )}
                <div className="-mb-2">
                  <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">{project.name}</h1>
                  <p className="text-white/70 text-base max-w-2xl line-clamp-2">{project.description || "No description provided."}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium">
                  <ArrowLeft size={16} /> Back to All Projects
                </Link>
                <ChevronRight size={16} className="text-white/20" />
                <span className="text-sm font-medium text-white/80">Dashboard Overview</span>
              </div>
              
              {metadataLinks.length > 0 && (
                <div className="flex items-center gap-3">
                  {metadataLinks.map((link) => {
                      const IconComponent = getPlatformIcon(link.key);
                      return (
                        <Link key={link.key} href={link.url} target="_blank" className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-colors">
                          <IconComponent size={18} />
                        </Link>
                      );
                  })}
                </div>
              )}
            </div>
            
            {/* --- GRID LAYOUT --- */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${ownerStatus && !ownerStatus.active ? 'opacity-50 pointer-events-none filter grayscale-[0.5]' : ''}`}>
               {/* Added 'opacity-50 pointer-events-none' above to visually disable the dashboard 
                  when in Read-Only mode. You can remove this class if you want them to 
                  still click things but not perform actions.
               */}

              <div className="h-full">
                <ChartWidget title="Contribution Heatmap" icon={Code} iconColor="text-purple-400">
                   <HEATMAP />
                </ChartWidget>
              </div>

              <div className="h-full">
                <ChartWidget title="Collaboration Status" icon={Users} iconColor="text-blue-400">
                   <PIECHART />
                </ChartWidget>
              </div>

              <div className="h-full">
                <ChartWidget title="Issue Priority" icon={Bug} iconColor="text-red-400">
                   <PIECHARTSISSUES projectId={projectId}/>
                </ChartWidget>
              </div>

              <div className="lg:col-span-2 mt-[20px] h-[500px]">
                <ChartWidget title="Project Timeline & Events" icon={CalendarIcon} iconColor="text-green-400">
                   <CALENDAR />
                </ChartWidget>
              </div>
              
              <div className="mt-[20px] h-[500px]">
                <ChartWidget title="AI Tool Usage" icon={Bot} iconColor="text-pink-400">
                   <AIUSAGE projectId={projectId}/>
                </ChartWidget>
              </div>

              <div className="col-span-full h-20"></div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}