"use client";

import { useState } from "react";
import Link from "next/link";

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
} from "lucide-react";

const mockProject = {
    id: "demo-project",
    name: "Demo Project",
    description: "This is a 1:1 demo representation of the project dashboard. All data shown here is static mock data for demonstration purposes.",
    website_url: "https://example.com",
    github_repo_url: "https://github.com/example/demo",
    created_by: "demo-user",
    collaborators: 10,
    max_collaborators: 20,
    metadata: {
        "project-icon": "https://api.dicebear.com/7.x/shapes/svg?seed=demo",
        "project-banner": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        "github-link": "https://github.com",
        "website-link": "https://example.com",
        "discord-link": "https://discord.com"
    },
    created_at: new Date().toISOString()
};

const mockUser = {
    id: "demo-user",
    user_metadata: {
        full_name: "Demo User",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo"
    }
};

const getPlatformIcon = (platform: string) => {
    const platformIcons: { [key: string]: any } = {
        github: Github, discord: MessageCircle, twitter: Twitter, youtube: Youtube,
        facebook: Facebook, linkedin: Linkedin, instagram: Instagram, website: Globe, default: ExternalLink,
    };
    const key = platform.replace('-link', '');
    return platformIcons[key] || platformIcons.default;
};

const ChartWidget = ({ title, icon: Icon, iconColor, children }: any) => (
    <div className="bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-xl flex flex-col h-full overflow-hidden shadow-sm hover:border-white/20 light:hover:border-gray-300 transition-colors">
        <div className="px-4 py-3 border-b border-white/5 light:border-gray-100 flex items-center justify-between bg-white/[0.02] light:bg-gray-50">
            <div className="flex items-center gap-2.5">
                <Icon size={16} className={`${iconColor}`} />
                <h3 className="text-sm font-semibold text-white/90 light:text-gray-900 tracking-tight">{title}</h3>
            </div>
            <MoreHorizontal size={16} className="text-white/20 light:text-gray-400" />
        </div>
        <div className="flex-1 p-1 bg-[#0a0a0a] light:bg-white min-h-0 relative flex flex-col">
            {children}
        </div>
    </div>
);

export default function DemoProjectPage() {
    const metadataLinks = Object.entries(mockProject.metadata || {})
        .filter(([key, value]) => key.endsWith('-link') && value)
        .map(([key, value]) => ({
            key,
            url: value as string,
            platform: key.replace('-link', '')
        }));

    return (
        <div className="min-h-screen bg-[#0a0a0a] light:bg-gray-50 text-white light:text-black flex relative">
            <style jsx global>{`
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; border-left: 1px solid #222; }
        ::-webkit-scrollbar-thumb { background: #333; border: 2px solid #0a0a0a; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
            <Menu project={mockProject} user={mockUser} />

            <main className="flex-1 ml-64 min-h-screen overflow-y-auto bg-[#0a0a0a] light:bg-gray-50">
                <div className="mx-auto pt-16">

                    {/* Banner */}
                    <div className="relative mt-[-10px]">
                        {mockProject.metadata?.["project-banner"] ? (
                            <img src={mockProject.metadata["project-banner"]} alt="Banner" className="w-full h-64 object-cover" />
                        ) : (
                            <div className="w-full h-64 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-white/5 light:border-gray-200"></div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent light:from-gray-50 light:via-gray-50/80 p-8">
                            <div className="flex items-end gap-6">
                                {mockProject.metadata?.["project-icon"] ? (
                                    <img src={mockProject.metadata["project-icon"]} alt="Logo" className="w-24 h-24 rounded-3xl border-4 border-[#0a0a0a] light:border-gray-50 object-cover shadow-2xl bg-[#161616] light:bg-white -mb-4" />
                                ) : (
                                    <div className="w-24 h-24 rounded-3xl border-4 border-[#0a0a0a] light:border-gray-50 bg-[#161616] light:bg-white -mb-4 flex items-center justify-center">
                                        <Code className="text-white/20 light:text-gray-400 w-10 h-10" />
                                    </div>
                                )}
                                <div className="-mb-2">
                                    <h1 className="text-4xl font-extrabold text-white light:text-black tracking-tight mb-1">{mockProject.name}</h1>
                                    <p className="text-white/70 light:text-gray-600 text-base max-w-2xl line-clamp-2">{mockProject.description || "No description provided."}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Header / Nav */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard" className="flex items-center gap-2 text-white/50 light:text-gray-500 hover:text-white light:hover:text-black transition-colors text-sm font-medium">
                                    <ArrowLeft size={16} /> Back to All Projects
                                </Link>
                                <ChevronRight size={16} className="text-white/20 light:text-gray-300" />
                                <span className="text-sm font-medium text-white/80 light:text-gray-700">Dashboard Overview</span>
                            </div>

                            {metadataLinks.length > 0 && (
                                <div className="flex items-center gap-3">
                                    {metadataLinks.map((link) => {
                                        const IconComponent = getPlatformIcon(link.key);
                                        return (
                                            <Link key={link.key} href={link.url} target="_blank" className="p-2 bg-white/10 light:bg-gray-200 hover:bg-white/20 light:hover:bg-gray-300 rounded-full text-white/80 light:text-gray-700 transition-colors">
                                                <IconComponent size={18} />
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* --- GRID LAYOUT --- */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                    <PIECHARTSISSUES />
                                </ChartWidget>
                            </div>

                            <div className="lg:col-span-2 mt-[20px] h-[500px]">
                                <ChartWidget title="Project Timeline & Events" icon={CalendarIcon} iconColor="text-green-400">
                                    <CALENDAR />
                                </ChartWidget>
                            </div>

                            <div className="mt-[20px] h-[500px]">
                                <ChartWidget title="AI Tool Usage" icon={Bot} iconColor="text-pink-400">
                                    <AIUSAGE />
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
