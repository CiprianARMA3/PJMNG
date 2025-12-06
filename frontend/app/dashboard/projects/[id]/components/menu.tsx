"use client";

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

// Helper type guard to check if the event is a KeyboardEvent
const isKeyboardEvent = (e: React.FormEvent | React.KeyboardEvent<HTMLInputElement>): e is React.KeyboardEvent<HTMLInputElement> => {
    return (e as React.KeyboardEvent<HTMLInputElement>).key !== undefined;
};

export default function Menu({ project, user }: MenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');

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

  const isActive = (href: string) => pathname === href;

  // Combine all navigatable items for quick search results
  const availableRoutes = useMemo(() => {
    return sections.flatMap(section => section.items).map(item => ({
        label: item.label,
        href: item.href,
    }));
  }, [project.id, sections]);


  // Filter the routes based on the search query
  const filteredResults = availableRoutes.filter(route =>
    route.label.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5); // Limit to top 5 results

  const isDropdownOpen = searchQuery.length > 0;

  // Function to handle clicking on a search result (quick navigation)
  const handleResultClick = (href: string) => {
    setSearchQuery(''); // Close the dropdown
    router.push(href);
  };
  
  // --- Search Handler Function ---
  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    
    // Check if this submission was triggered by Enter, AND if there are quick results to jump to.
    const isEnterPressWithResults = isKeyboardEvent(e) && e.key === 'Enter' && filteredResults.length > 0;

    if (isEnterPressWithResults) {
        handleResultClick(filteredResults[0].href);
        return;
    }

    if (query) {
      // General Search Redirect (if no quick results are used or if submitted normally)
      router.push(`/dashboard/projects/${project.id}/search?q=${encodeURIComponent(query)}`);
      setSearchQuery(''); // Clear input after search
    }
  };

  // --- Key Down Handler for ⌘K and Enter ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter
    if (e.key === 'Enter') {
        handleSearchSubmit(e);
        return;
    }

    // Check for ⌘K or Ctrl+K (Optional: prevent default browser behavior)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
    }
  };


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
   
        {/* Left: Search (Now positioned for dropdown) */}
        <div className="flex items-center gap-4 w-full max-w-md">
          <div className="relative group w-full"> {/* Make this relative for absolute dropdown */}
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
            
            {/* --- Search Results Dropdown (Animated Box) --- */}
            <div 
              className={`
                absolute top-full mt-2 w-full bg-[#18181b] border border-white/10 rounded-lg shadow-2xl overflow-hidden
                transition-all duration-300 ease-in-out
                ${isDropdownOpen ? 'max-h-64 opacity-100 p-1' : 'max-h-0 opacity-0'}
                z-40 
              `}
            >
              {isDropdownOpen && (
                filteredResults.length > 0 ? (
                  filteredResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultClick(result.href)}
                      className="flex items-center w-full px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 rounded-md text-left transition-colors"
                    >
                      <Route className="w-4 h-4 mr-3 text-zinc-500" /> {/* Using Route icon for navigation */}
                      {result.label}
                      <ChevronRight className="ml-auto w-3 h-3 text-zinc-500" />
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-zinc-500">
                    No quick results found. Press Enter to perform a full project search.
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* <button className="relative p-2 rounded-md hover:bg-white/5 text-zinc-400 hover:text-zinc-100 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-500 rounded-full border border-[#0a0a0a]"></span>
          </button> */}

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          <div className="flex items-center gap-3 pl-2 cursor-pointer group">
            <a href={`/dashboard/projects/${project.id}/settings/project-settings`}>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                  {user?.user_metadata?.full_name || "User"}
                </p>
              </div>
            </a>
            <img src={getAvatarUrl()} alt="Avatar" className="w-7 h-7 rounded-full ring-2 ring-white/5 group-hover:ring-white/20 transition-all" />
          </div>
        </div>
      </header>

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-white/[0.08] flex flex-col fixed inset-y-0 left-0 z-50">
        
        {/* Sidebar Header */}
        <div className="h-14 flex items-center px-4 border-b border-white/[0.08]">
        <a href={`/dashboard/projects/${project.id}`}>
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
          </a>
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