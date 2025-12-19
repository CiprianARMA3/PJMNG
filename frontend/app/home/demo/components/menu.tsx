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

const isKeyboardEvent = (e: React.FormEvent | React.KeyboardEvent<HTMLInputElement>): e is React.KeyboardEvent<HTMLInputElement> => {
    return (e as React.KeyboardEvent<HTMLInputElement>).key !== undefined;
};

export default function Menu({ project, user }: MenuProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');

    const getAvatarUrl = () =>
        `https://avatar.vercel.sh/${user?.user_metadata?.full_name || 'user'}`;

    const allSections = [
        {
            title: "Overview",
            items: [
                { label: "Dashboard", icon: LayoutGrid, href: `/home/demo` },
            ],
        },
        {
            title: "Development",
            items: [
                { label: "Tasks", icon: ClipboardCheck, href: `/home/demo/development/tasks` },
                { label: "Board", icon: KanbanSquare, href: `/home/demo/development/board` },
                { label: "Events and Workflow", icon: Calendar, href: `/home/demo/development/events-workflow` },
                { label: "Activity Overview", icon: Calendar, href: `/home/demo/development/calendar` },
                { label: "Repository logs", icon: Logs, href: `/home/demo/development/repository-logs` },
            ],
        },
        {
            title: "Artificial Intelligence",
            items: [
                { label: "AI Assistant", icon: Bot, href: `/home/demo/ai/ai-assistant` },
                { label: "AI GitHub Repo Review", icon: GitBranch, href: `/home/demo/ai/code-review` },
                { label: "AI SQL Helper", icon: Database, href: `/home/demo/ai/sql-helper` },
                { label: "AI Roadmap Visualizer", icon: Route, href: `/home/demo/ai/roadmap-visualizer` },
            ],
        },
        {
            title: "Settings",
            items: [
                { label: "Project Settings", icon: Settings, href: `/home/demo/settings/project-settings` },
                { label: "Collaborators", icon: UserCog, href: `/home/demo/settings/collaborators` },
                { label: "AI Monitor", icon: BrainCog, href: `/home/demo/settings/ai-info` },
            ],
        },
        {
            title: "Manager Settings",
            items: [
                { label: "Project Settings", icon: Settings, href: `/home/demo/management/project-settings` },
                { label: "Workflow and Events Management", icon: Workflow, href: `/home/demo/management/workflow-events` },
                { label: "Manage Team", icon: UserCog, href: `/home/demo/management/team` },
                { label: "Manage AI Assistant", icon: BrainCog, href: `/home/demo/management/ai` },
            ],
        },
    ];

    const isActive = (href: string) => pathname === href;

    const availableRoutes = useMemo(() => {
        return allSections.flatMap(section => section.items).map(item => ({
            label: item.label,
            href: item.href,
        }));
    }, [allSections]);


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
            router.push(`/home/demo/search?q=${encodeURIComponent(query)}`);
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

            <header className="fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a]/80 light:bg-white/80 backdrop-blur-md border-b border-white/[0.08] light:border-gray-200 z-50 flex items-center justify-between px-4 ml-64 transition-all">
                <div className="flex items-center gap-4 w-full max-w-md">
                    <div className="relative group w-full">
                        <form onSubmit={handleSearchSubmit} className="w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 light:group-focus-within:text-zinc-500 transition-colors z-10" />
                            <input
                                type="text"
                                placeholder="Search or type command..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="bg-zinc-900/50 light:bg-gray-100 border border-white/5 light:border-gray-200 text-sm text-zinc-200 light:text-black rounded-md pl-9 pr-10 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:bg-zinc-900 light:focus:bg-white transition-all placeholder:text-zinc-600 light:placeholder:text-gray-500 relative z-10"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10">
                                <span className="bg-white/10 light:bg-gray-200 text-[10px] text-zinc-400 light:text-gray-500 px-1.5 py-0.5 rounded border border-white/5 light:border-gray-200 font-mono">⌘K</span>
                            </div>
                        </form>

                        <div className={`absolute top-full mt-2 w-full bg-[#18181b] light:bg-white border border-white/10 light:border-gray-200 rounded-lg shadow-2xl light:shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${isDropdownOpen ? 'max-h-64 opacity-100 p-1' : 'max-h-0 opacity-0'} z-40`}>
                            {isDropdownOpen && (
                                filteredResults.length > 0 ? (
                                    filteredResults.map((result, index) => (
                                        <button key={index} onClick={() => handleResultClick(result.href)} className="flex items-center w-full px-3 py-2 text-sm text-zinc-200 light:text-black hover:bg-white/5 light:hover:bg-gray-100 rounded-md text-left transition-colors">
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
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-medium text-zinc-200 light:text-gray-700 group-hover:text-white light:group-hover:text-black transition-colors">{user?.user_metadata?.full_name || "Demo User"}</p>
                        </div>
                        <img src={getAvatarUrl()} alt="Avatar" className="w-7 h-7 rounded-full ring-2 ring-white/5 light:ring-gray-200 group-hover:ring-white/20 light:group-hover:ring-gray-300 transition-all" />
                    </div>
                </div>
            </header>

            <aside className="w-64 bg-[#0a0a0a] light:bg-white border-r border-white/[0.08] light:border-gray-200 flex flex-col fixed inset-y-0 left-0 z-50">
                <div className="h-14 flex items-center px-4 border-b border-white/[0.08] light:border-gray-200">
                    <Link href={`/home/demo`}>
                        <div className="flex items-center gap-3 w-full p-1.5 hover:bg-white/5 light:hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group">
                            {project.metadata?.["project-icon"] && (
                                <img src={project.metadata["project-icon"]} alt="Project logo" className="w-8 h-8 rounded-2xl border-2 border-white/20 light:border-gray-200 object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-sm font-medium text-zinc-100 light:text-black truncate group-hover:text-white light:group-hover:text-black transition-colors">{project.name}</h2>
                            </div>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
                    {allSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-3 mb-2">{section.title}</h3>
                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link key={item.label} href={item.href} className={`group flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${active ? "bg-purple-500/10 light:bg-purple-50 text-purple-400 light:text-purple-600" : "text-zinc-400 light:text-gray-500 hover:text-zinc-100 light:hover:text-black hover:bg-white/5 light:hover:bg-gray-100"}`}>
                                            <item.icon className={`w-4 h-4 transition-colors ${active ? "text-purple-400 light:text-purple-600" : "text-zinc-500 light:text-gray-400 group-hover:text-zinc-300 light:group-hover:text-gray-600"}`} />
                                            {item.label}
                                            {active && <ChevronRight className="ml-auto w-3 h-3 text-purple-500/50" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/[0.08] light:border-gray-200">
                    <Link href="/" className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-zinc-400 light:text-gray-500 hover:text-red-400 hover:bg-red-500/10 light:hover:bg-red-50 rounded-md transition-all cursor-pointer">
                        <LogOut className="w-4 h-4" /> Exit Demo
                    </Link>
                </div>
            </aside>
        </>
    );
}
