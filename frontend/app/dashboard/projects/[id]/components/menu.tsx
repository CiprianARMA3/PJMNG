"use client";

import {
  LayoutGrid,
  KanbanSquare,
  Calendar,
  Bug,
  Workflow,
  Bot,
  Code,
  ChevronRight,
  Bell,
  LogOut,
  Search,
  Settings,
  Users,
  ChevronDown,
  Database,
  Logs,
  UserCog,
  BrainCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuProps {
  project: any;
  user: any;
}

export default function Menu({ project, user }: MenuProps) {
  const pathname = usePathname();
  
  const getAvatarUrl = () =>
    user?.user_metadata?.avatar_url || "https://avatar.vercel.sh/user";

  const sections = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", icon: LayoutGrid, href: `/dashboard/projects/${project.id}` },
      ],
    },
    {
      title: "Development",
      items: [
        { label: "Issues", icon: Bug, href: `/dashboard/projects/${project.id}/issues` },
        { label: "Events and Workflow", icon: Calendar, href: `/dashboard/projects/${project.id}/events-workflow` },
        { label: "Board", icon: KanbanSquare, href: `/dashboard/projects/${project.id}/board` },
        { label: "Activity Overview", icon: Calendar, href: `/dashboard/projects/${project.id}/calendar` },
        { label: "Repository logs", icon: Logs, href: `/dashboard/projects/${project.id}/repository-logs` },
      ],
    },
    {
      title: "Artificial Intelligence",
      items: [
        { label: "AI Assistant", icon: Bot, href: `/dashboard/projects/${project.id}/ai` },
        { label: "AI Code Review", icon: Code, href: `/dashboard/projects/${project.id}/code-review` },
        { label: "AI SQL Helper", icon: Database, href: `/dashboard/projects/${project.id}/ai-schema` },
        { label: "AI Roadmap Visualizer", icon: Code, href: `/dashboard/projects/${project.id}/ai-schema` },
      ],
    },
        {
      title: "Settings",
      items: [
        { label: "Project Settings", icon: Settings, href: `/dashboard/projects/${project.id}/project-settings` },
        { label: "Collaborators", icon: UserCog, href: `/dashboard/projects/${project.id}/manage-team` },
        { label: "AI Informations", icon: BrainCog, href: `/dashboard/projects/${project.id}/manage-team` },
      ],
    },
    {
      title: "Manager Settings",
      items: [
        { label: "Project Settings", icon: Settings, href: `/dashboard/projects/${project.id}/project-settings` },
        { label: "Workflow and Events Management", icon: Workflow, href: `/dashboard/projects/${project.id}/evwork-management` },
        { label: "Manage Team", icon: UserCog, href: `/dashboard/projects/${project.id}/manage-team` },
        { label: "Manage AI Assistant", icon: BrainCog, href: `/dashboard/projects/${project.id}/manage-team` },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* --- SCROLLBAR STYLES --- */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262626; /* Zinc-800 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #404040; /* Zinc-700 */
        }
        /* Firefox fallback */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #262626 transparent;
        }
      `}</style>

      {/* --- TOP BAR --- */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/[0.08] z-50 flex items-center justify-between px-4 ml-64 transition-all">
   
        {/* Left: Search */}
        <div className="flex items-center gap-4 w-full max-w-md">
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
            <input
              type="text"
              placeholder="Search or type command..."
              className="bg-zinc-900/50 border border-white/5 text-sm text-zinc-200 rounded-md pl-9 pr-10 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                <span className="bg-white/10 text-[10px] text-zinc-400 px-1.5 py-0.5 rounded border border-white/5 font-mono">⌘K</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-md hover:bg-white/5 text-zinc-400 hover:text-zinc-100 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-500 rounded-full border border-[#0a0a0a]"></span>
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          <div className="flex items-center gap-3 pl-2 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                {user?.user_metadata?.full_name || "User"}
              </p>
            </div>
            <img src={getAvatarUrl()} alt="Avatar" className="w-7 h-7 rounded-full ring-2 ring-white/5 group-hover:ring-white/20 transition-all" />
          </div>
        </div>
      </header>

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-white/[0.08] flex flex-col fixed inset-y-0 left-0 z-50">
        
        {/* Sidebar Header */}
        <div className="h-14 flex items-center px-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 w-full p-1.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
            {/* PURPLE GRADIENT ICON */}
            {project.metadata?.["project-icon"] && (
                <img
                    src={project.metadata["project-icon"]}
                    alt="Project logo"
                    className="w-8 h-8 rounded-2xl border-2 border-white/20 object-cover"
                />
            )}
            <div className="flex-1 min-w-0">
               <h2 className="text-sm font-medium text-zinc-100 truncate group-hover:text-white transition-colors">{project.name}</h2>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-3 mb-2">{section.title}</h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`
                        group flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                        ${active 
                            ? "bg-purple-500/10 text-purple-400" // Active State Purple
                            : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                        }
                      `}
                    >
                      <item.icon className={`w-4 h-4 transition-colors ${active ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                      {item.label}
                      {active && <ChevronRight className="ml-auto w-3 h-3 text-purple-500/50" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.08]">
           <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all">
              <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </div>
      </aside>
    </>
  );
}