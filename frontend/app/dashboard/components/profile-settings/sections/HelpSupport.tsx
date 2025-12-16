// frontend/app/dashboard/components/profile-settings/sections/Support.tsx

"use client";

import { useState } from "react";
import {
    Search,
    HelpCircle,
    MessageSquare,
    Mail,
    FileText,
    ExternalLink,
    Zap,
    Book,
    Code2,
    Layout,
    ChevronRight,
    Loader2
} from "lucide-react";

// --- Shared Component: Page Widget ---
const PageWidget = ({ title, icon: Icon, children, action }: any) => (
    <div className="relative z-10 w-full bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl flex flex-col overflow-visible shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] light:shadow-lg hover:border-[#333] light:hover:border-gray-300 transition-colors mb-6">
        <div className="px-5 py-4 border-b border-[#222] light:border-gray-200 flex items-center justify-between bg-[#141414] light:bg-gray-50 rounded-t-xl">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#1a1a1a] light:bg-white rounded-md border border-[#2a2a2a] light:border-gray-200">
                    <Icon size={14} className="text-neutral-400 light:text-neutral-500" />
                </div>
                <h3 className="text-sm font-medium text-neutral-300 light:text-neutral-700 tracking-wide">{title}</h3>
            </div>
            {action}
        </div>
        <div className="flex-1 p-6 bg-[#111111] light:bg-white min-h-0 relative flex flex-col rounded-b-xl text-neutral-300 light:text-neutral-600">
            {children}
        </div>
    </div>
);

// --- Mock Data: Help Articles ---
const commonArticles = [
    { id: 1, title: "Getting started with Projects", category: "Basics", readTime: "3 min" },
    { id: 2, title: "Managing team roles & permissions", category: "Team", readTime: "5 min" },
    { id: 3, title: "Understanding your billing invoice", category: "Billing", readTime: "2 min" },
    { id: 4, title: "API Authentication guide", category: "Developers", readTime: "8 min" },
];

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTicketSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            alert("Ticket submitted successfully! We'll be in touch shortly.");
        }, 1500);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 font-sans">

            {/* Header & System Status */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-medium text-white/90 light:text-black/90 mb-1">Help Center</h1>
                    <p className="text-sm text-neutral-500 light:text-neutral-600">Find answers, documentation, and get in touch with our team.</p>
                </div>
                <a href="#" className="flex items-center gap-2 px-3 py-1.5 bg-[#161616] light:bg-white border border-[#222] light:border-gray-200 hover:border-[#333] light:hover:border-gray-300 rounded-lg transition-colors group">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-neutral-400 light:text-neutral-600 font-medium group-hover:text-neutral-300 light:group-hover:text-neutral-800 transition-colors">All Systems Operational</span>
                    <ExternalLink size={12} className="text-neutral-600 light:text-neutral-400 group-hover:text-neutral-400 light:group-hover:text-neutral-600" />
                </a>
            </div>

            {/* Search Section */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-neutral-500 group-focus-within:text-white light:group-focus-within:text-black transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Search documentation, tutorials, and FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#111] light:bg-white border border-[#222] light:border-gray-200 text-neutral-200 light:text-black text-sm rounded-xl block w-full pl-12 pr-4 py-4 placeholder-neutral-600 light:placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:bg-[#161616] light:focus:bg-gray-50 focus:ring-1 focus:ring-neutral-500/20 transition-all shadow-lg light:shadow-md"
                />
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl p-5 hover:border-[#333] light:hover:border-gray-300 transition-colors group cursor-pointer shadow-sm light:shadow-md">
                    <div className="w-10 h-10 bg-[#1a1a1a] light:bg-gray-50 rounded-lg flex items-center justify-center border border-[#2a2a2a] light:border-gray-200 mb-4 group-hover:scale-105 transition-transform">
                        <Book className="w-5 h-5 text-neutral-400 light:text-neutral-500" />
                    </div>
                    <h3 className="text-sm font-medium text-white light:text-black mb-1">Documentation</h3>
                    <p className="text-xs text-neutral-500 light:text-neutral-600 mb-4 leading-relaxed">
                        Comprehensive guides and API references for developers.
                    </p>
                    <span className="text-xs font-medium text-neutral-300 light:text-neutral-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                        Browse Docs <ChevronRight size={12} />
                    </span>
                </div>

                <div className="bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl p-5 hover:border-[#333] light:hover:border-gray-300 transition-colors group cursor-pointer shadow-sm light:shadow-md">
                    <div className="w-10 h-10 bg-[#1a1a1a] light:bg-gray-50 rounded-lg flex items-center justify-center border border-[#2a2a2a] light:border-gray-200 mb-4 group-hover:scale-105 transition-transform">
                        <Layout className="w-5 h-5 text-neutral-400 light:text-neutral-500" />
                    </div>
                    <h3 className="text-sm font-medium text-white light:text-black mb-1">Tutorials</h3>
                    <p className="text-xs text-neutral-500 light:text-neutral-600 mb-4 leading-relaxed">
                        Step-by-step videos and walkthroughs to master the platform.
                    </p>
                    <span className="text-xs font-medium text-neutral-300 light:text-neutral-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                        Watch Tutorials <ChevronRight size={12} />
                    </span>
                </div>

                <div className="bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl p-5 hover:border-[#333] light:hover:border-gray-300 transition-colors group cursor-pointer shadow-sm light:shadow-md">
                    <div className="w-10 h-10 bg-[#1a1a1a] light:bg-gray-50 rounded-lg flex items-center justify-center border border-[#2a2a2a] light:border-gray-200 mb-4 group-hover:scale-105 transition-transform">
                        <MessageSquare className="w-5 h-5 text-neutral-400 light:text-neutral-500" />
                    </div>
                    <h3 className="text-sm font-medium text-white light:text-black mb-1">Community Forum</h3>
                    <p className="text-xs text-neutral-500 light:text-neutral-600 mb-4 leading-relaxed">
                        Connect with other users, ask questions, and share tips.
                    </p>
                    <span className="text-xs font-medium text-neutral-300 light:text-neutral-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                        Join Community <ChevronRight size={12} />
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Popular Articles Widget */}
                <div className="lg:col-span-2">
                    <PageWidget title="Popular Articles" icon={Zap}>
                        <div className="divide-y divide-[#222] light:divide-gray-200 -mx-6 -my-2">
                            {commonArticles.map((article) => (
                                <a
                                    key={article.id}
                                    href="#"
                                    className="flex items-center justify-between px-6 py-4 hover:bg-[#161616] light:hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                            <FileText size={16} className="text-neutral-600 light:text-neutral-400 group-hover:text-neutral-400 light:group-hover:text-neutral-600 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm text-neutral-300 light:text-neutral-700 group-hover:text-white light:group-hover:text-black transition-colors font-medium">
                                                {article.title}
                                            </h4>
                                            <span className="text-xs text-neutral-500 light:text-neutral-500 mt-0.5 block">
                                                {article.category} • {article.readTime} read
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-neutral-700 light:text-neutral-400 group-hover:text-neutral-500 light:group-hover:text-neutral-600 transition-colors" />
                                </a>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#222] light:border-gray-200 text-center">
                            <button className="text-xs font-medium text-neutral-400 light:text-neutral-600 hover:text-white light:hover:text-black transition-colors">
                                View all 42 articles
                            </button>
                        </div>
                    </PageWidget>
                </div>

                {/* Contact Widget */}
                <div className="lg:col-span-1">
                    <PageWidget title="Contact Support" icon={Mail}>
                        <div className="space-y-4">
                            <div className="bg-[#161616] light:bg-gray-50 rounded-lg p-4 border border-[#222] light:border-gray-200">
                                <h4 className="text-sm font-medium text-white light:text-black mb-2">Technical Support</h4>
                                <p className="text-xs text-neutral-500 light:text-neutral-600 mb-4">
                                    For bugs, technical issues, and platform errors. Average response time: &lt; 2hrs.
                                </p>
                                <button
                                    onClick={() => alert("Chat widget would open here")}
                                    className="w-full py-2 bg-white light:bg-black hover:bg-neutral-200 light:hover:bg-neutral-800 text-black light:text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <MessageSquare size={14} />
                                    Start Live Chat
                                </button>
                            </div>

                            <form onSubmit={handleTicketSubmit} className="space-y-3 pt-2">
                                <p className="text-xs text-neutral-400 light:text-neutral-600 font-medium px-1">Or send us an email</p>

                                <div className="space-y-2">
                                    <select className="w-full bg-[#161616] light:bg-gray-50 border border-[#333] light:border-gray-200 rounded-lg text-xs text-neutral-300 light:text-neutral-700 px-3 py-2 focus:outline-none focus:border-neutral-500">
                                        <option>General Inquiry</option>
                                        <option>Billing Issue</option>
                                        <option>Feature Request</option>
                                        <option>Report a Bug</option>
                                    </select>

                                    <textarea
                                        rows={3}
                                        placeholder="Describe your issue..."
                                        className="w-full bg-[#161616] light:bg-gray-50 border border-[#333] light:border-gray-200 rounded-lg text-xs text-neutral-300 light:text-neutral-700 px-3 py-2 focus:outline-none focus:border-neutral-500 resize-none placeholder-neutral-600 light:placeholder-neutral-400"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-2 bg-[#1a1a1a] light:bg-white hover:bg-[#222] light:hover:bg-gray-50 text-neutral-300 light:text-neutral-700 hover:text-white light:hover:text-black border border-[#2a2a2a] light:border-gray-200 hover:border-[#333] light:hover:border-gray-300 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                    {isSubmitting ? "Sending..." : "Submit Ticket"}
                                </button>
                            </form>
                        </div>
                    </PageWidget>
                </div>
            </div>
        </div>
    );
}