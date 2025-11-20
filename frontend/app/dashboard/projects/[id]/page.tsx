import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Menu from "./components/menu";
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
        <div className="max-w-6xl mx-auto pt-16">

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

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
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
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors">
                    <Share2 size={16} />
                    Share
                  </button>
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

              {/* Main Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{project.collaborators}</div>
                    <div className="text-white/60 text-sm">Collaborators</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{project.max_collaborators}</div>
                    <div className="text-white/60 text-sm">Max Capacity</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{new Date(project.created_at).toLocaleDateString()}</div>
                    <div className="text-white/60 text-sm">Created</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{isCreator ? "Owner" : "Collaborator"}</div>
                    <div className="text-white/60 text-sm">Your Role</div>
                  </div>
                </div>

                {/* Project Links */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Project Links</h2>
                  <div className="space-y-3">
                    {project.website_url && (
                      <a href={project.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group">
                        <div className="flex items-center gap-3"><Globe className="w-5 h-5 text-blue-400" /> <span className="text-white">Website</span></div>
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
                      </a>
                    )}
                    {project.github_repo_url && (
                      <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group">
                        <div className="flex items-center gap-3"><Github className="w-5 h-5 text-gray-400" /> <span className="text-white">GitHub Repository</span></div>
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
                      </a>
                    )}
                    {Object.entries(project.metadata || {}).map(([key, value]) => {
                      if (key.includes("link") && value && !key.includes("project-")) {
                        const platform = key.replace("-link", "");
                        return (
                          <a key={key} href={value as string} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group">
                            <div className="flex items-center gap-3"><div className="w-5 h-5 flex items-center justify-center"><span className="text-sm capitalize">{platform[0]}</span></div><span className="text-white capitalize">{platform}</span></div>
                            <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
                          </a>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                {/* Project Description */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">About</h2>
                  <p className="text-white/70 leading-relaxed">{project.description || "No description provided."}</p>
                </div>
              </div>

              {/* Sidebar Panel */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href={`/dashboard/projects/${project.id}/settings`} className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"><Settings size={18} /> Project Settings</Link>
                    <Link href={`/dashboard/projects/${project.id}/team`} className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"><Users size={18} /> Manage Team</Link>
                  </div>
                </div>

                {/* Project Info */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Project Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-white/60">Status</span><span className="text-green-400">Active</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Created</span><span className="text-white">{new Date(project.created_at).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Collaborators</span><span className="text-white">{project.collaborators}/{project.max_collaborators}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Your Role</span><span className="text-white">{isCreator ? "Owner" : "Collaborator"}</span></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
                    <br /><br /><br /><br />
        </div>
      </main>
    </div>
  );
}
