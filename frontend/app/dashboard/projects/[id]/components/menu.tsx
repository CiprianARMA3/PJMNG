"use client";

import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { PAGE_REQUIREMENTS } from "@/utils/permissions";
import { signOut } from '@/app/actions/auth';
import {
  LayoutGrid,
  KanbanSquare,
  Calendar,
  Workflow,
  Bot,
  ChevronRight,
  LogOut,
  Search,
  Settings,
  UserCog,
  BrainCog,
  Route,
  GitBranch,
  ClipboardCheck,
  Database,
  Logs,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo } from "react";

interface MenuProps {
  project: any;
  user: any;
}

const isKeyboardEvent = (e: React.FormEvent | React.KeyboardEvent<HTMLInputElement>): e is React.KeyboardEvent<HTMLInputElement> => {
    return (e as React.KeyboardEvent<HTMLInputElement>).key !== undefined;
};

export default function Menu({ project, user }: MenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');

  // --- Permissions Hook ---
  const { checkAccess, loading } = useProjectPermissions(project.id);

  const getAvatarUrl = () =>
    user?.user_metadata?.avatar_url || "https://avatar.vercel.sh/user";

  const allSections = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", icon: LayoutGrid, href: `/dashboard/projects/${project.id}` },
      ],
    },
    {
      title: "Development",
      items: [
        { label: "Tasks", icon: ClipboardCheck, href: `/dashboard/projects/${project.id}/development/tasks` },
        { label: "Board", icon: KanbanSquare, href: `/dashboard/projects/${project.id}/development/board` },
        { label: "Events and Workflow", icon: Calendar, href: `/dashboard/projects/${project.id}/development/events-workflow` },
        { label: "Activity Overview", icon: Calendar, href: `/dashboard/projects/${project.id}/development/calendar` },
        { label: "Repository logs", icon: Logs, href: `/dashboard/projects/${project.id}/development/repository-logs` },
      ],
    },
    {
      title: "Artificial Intelligence",
      items: [
        { label: "AI Assistant", icon: Bot, href: `/dashboard/projects/${project.id}/ai/ai-assistant` },
        { label: "AI GitHub Repo Review", icon: GitBranch, href: `/dashboard/projects/${project.id}/ai/code-review` },
        { label: "AI SQL Helper", icon: Database, href: `/dashboard/projects/${project.id}/ai/sql-helper` },
        { label: "AI Roadmap Visualizer", icon: Route, href: `/dashboard/projects/${project.id}/ai/roadmap-visualizer` },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Project Settings", icon: Settings, href: `/dashboard/projects/${project.id}/settings/project-settings` },
        { label: "Collaborators", icon: UserCog, href: `/dashboard/projects/${project.id}/settings/collaborators` },
        { label: "AI Monitor", icon: BrainCog, href: `/dashboard/projects/${project.id}/settings/ai-info` },
      ],
    },
    {
      title: "Manager Settings",
      items: [
        { label: "Project Settings", icon: Settings, href: `/dashboard/projects/${project.id}/management/project-settings` },
        { label: "Workflow and Events Management", icon: Workflow, href: `/dashboard/projects/${project.id}/management/workflow-events` },
        { label: "Manage Team", icon: UserCog, href: `/dashboard/projects/${project.id}/management/team` },
        { label: "Manage AI Assistant", icon: BrainCog, href: `/dashboard/projects/${project.id}/management/ai` },
      ],
    },
  ];

  // --- Filter Logic ---
  const filteredSections = useMemo(() => {
    // Note: We do NOT return [] here during loading if we want the public pages (Dashboard)
    // to be visible immediately, but to avoid flashing restricted content, we usually wait.
    // However, since Dashboard is always allowed, we can proceed.
    if (loading) return []; 

    return allSections.map(section => {
      const allowedItems = section.items.filter(item => {
        const pathSuffix = item.href.replace(`/dashboard/projects/${project.id}`, '');
        
        // --- FORCE DASHBOARD TO BE ALWAYS VISIBLE ---
        if (pathSuffix === '' || pathSuffix === '/') return true;

        // Check other permissions
        const requiredPermId = PAGE_REQUIREMENTS[pathSuffix];
        return requiredPermId ? checkAccess(requiredPermId) : true;
      });

      return { ...section, items: allowedItems };
    }).filter(section => section.items.length > 0);
  }, [allSections, loading, checkAccess, project.id]);

  const isActive = (href: string) => pathname === href;

  // --- Search Logic ---
  const availableRoutes = useMemo(() => {
    return filteredSections.flatMap(section => section.items).map(item => ({
        label: item.label,
        href: item.href,
    }));
  }, [filteredSections]); 


  const filteredResults = availableRoutes.filter(route =>
    route.label.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const isDropdownOpen = searchQuery.length > 0;

  const handleResultClick = (href: string) => {
    setSearchQuery(''); 
    router.push(href);
  };
  
  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const isEnterPressWithResults = isKeyboardEvent(e) && e.key === 'Enter' && filteredResults.length > 0;

    if (isEnterPressWithResults) {
        handleResultClick(filteredResults[0].href);
        return;
    }

    if (query) {
      router.push(`/dashboard/projects/${project.id}/search?q=${encodeURIComponent(query)}`);
      setSearchQuery(''); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleSearchSubmit(e);
        return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
    }
  };


  return (
    <>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #404040; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #262626 transparent; }
      `}</style>

      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/[0.08] z-50 flex items-center justify-between px-4 ml-64 transition-all">
        <div className="flex items-center gap-4 w-full max-w-md">
          <div className="relative group w-full"> 
            <form onSubmit={handleSearchSubmit} className="w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors z-10" />
              <input
                type="text"
                placeholder="Search or type command..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-zinc-900/50 border border-white/5 text-sm text-zinc-200 rounded-md pl-9 pr-10 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-600 relative z-10"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10">
                  <span className="bg-white/10 text-[10px] text-zinc-400 px-1.5 py-0.5 rounded border border-white/5 font-mono">⌘K</span>
              </div>
            </form>
            
            <div className={`absolute top-full mt-2 w-full bg-[#18181b] border border-white/10 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-in-out ${isDropdownOpen ? 'max-h-64 opacity-100 p-1' : 'max-h-0 opacity-0'} z-40`}>
              {isDropdownOpen && (
                filteredResults.length > 0 ? (
                  filteredResults.map((result, index) => (
                    <button key={index} onClick={() => handleResultClick(result.href)} className="flex items-center w-full px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 rounded-md text-left transition-colors">
                      <Route className="w-4 h-4 mr-3 text-zinc-500" />
                      {result.label}
                      <ChevronRight className="ml-auto w-3 h-3 text-zinc-500" />
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-zinc-500">No quick results found. Press Enter to perform a full project search.</div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          <div className="flex items-center gap-3 pl-2 cursor-pointer group">
            <a href={`/dashboard/projects/${project.id}/settings/project-settings`}>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">{user?.user_metadata?.full_name || "User"}</p>
              </div>
            </a>
            <img src={getAvatarUrl()} alt="Avatar" className="w-7 h-7 rounded-full ring-2 ring-white/5 group-hover:ring-white/20 transition-all" />
          </div>
        </div>
      </header>

      <aside className="w-64 bg-[#0a0a0a] border-r border-white/[0.08] flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="h-14 flex items-center px-4 border-b border-white/[0.08]">
        <a href={`/dashboard/projects/${project.id}`}>
          <div className="flex items-center gap-3 w-full p-1.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
            {project.metadata?.["project-icon"] && (
                <img src={project.metadata["project-icon"]} alt="Project logo" className="w-8 h-8 rounded-2xl border-2 border-white/20 object-cover" />
            )}
            <div className="flex-1 min-w-0">
               <h2 className="text-sm font-medium text-zinc-100 truncate group-hover:text-white transition-colors">{project.name}</h2>
            </div>
          </div>
          </a>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
          {loading ? (
             <div className="flex flex-col gap-4 px-3 opacity-50">
                <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                <div className="space-y-2">
                    <div className="h-8 w-full bg-white/5 rounded animate-pulse" />
                    <div className="h-8 w-full bg-white/5 rounded animate-pulse" />
                    <div className="h-8 w-full bg-white/5 rounded animate-pulse" />
                </div>
             </div>
          ) : (
            filteredSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-3 mb-2">{section.title}</h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link key={item.label} href={item.href} className={`group flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${active ? "bg-purple-500/10 text-purple-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"}`}>
                        <item.icon className={`w-4 h-4 transition-colors ${active ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                        {item.label}
                        {active && <ChevronRight className="ml-auto w-3 h-3 text-purple-500/50" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </nav>

        <div className="p-4 border-t border-white/[0.08]">
           <button onClick={() => signOut()} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer">
              <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </div>
      </aside>
    </>
  );
}