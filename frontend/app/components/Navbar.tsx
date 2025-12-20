'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronDown,
    Menu,
    X,
    Bot,
    GitBranch,
    Database,
    LayoutList,
    KanbanSquare,
    UserCog,
    ArrowRight
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface NavbarProps {
    className?: string;
}

const Navbar = ({ className = "" }: NavbarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Auth state
    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    // Fetch the PUBLIC profile data to get the real avatar from metadata
                    const { data: profile } = await supabase
                        .from('users')
                        .select('metadata')
                        .eq('id', user.id)
                        .single();

                    if (profile && profile.metadata?.avatar_url) {
                        setAvatarUrl(profile.metadata.avatar_url);
                    } else {
                        // Fallback
                        setAvatarUrl(user.user_metadata?.avatar_url);
                    }
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, [supabase]);

    const productLinks = [
        { icon: Bot, name: 'AI Assistant', desc: 'Context-aware coding help' },
        { icon: GitBranch, name: 'Repo Review', desc: 'Automated PR analysis' },
        { icon: Database, name: 'SQL Helper', desc: 'Natural language to SQL' },
        { icon: LayoutList, name: 'Roadmap', desc: 'AI-generated milestones' },
        { icon: KanbanSquare, name: 'Kanban Board', desc: 'Drag-and-drop tasks' },
        { icon: UserCog, name: 'Team', desc: 'Management made easier' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 h-[72px] px-6 bg-white/50 backdrop-blur-xl border-b border-white/10 transition-all duration-300 shadow-sm ${className}`}
            onMouseLeave={() => setActiveDropdown(null)}
        >
            <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between">
                <div className="flex items-center gap-1 cursor-pointer z-50">
                    <a href="/" className="flex items-center gap-1">
                        <span className="text-2xl font-normal tracking-tight">KAPR<span className="text-purple-600 font-normal">Y</span></span>
                        <span className="text-2xl font-black tracking-tight text-[#202124]">.DEV</span>
                    </a>
                </div>
                <div className="hidden md:flex items-center gap-8 h-full">
                    <div
                        className="relative h-full flex items-center"
                        onMouseEnter={() => setActiveDropdown('product')}
                    >
                        <button className="flex items-center gap-1 text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors group">
                            Product <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'product' ? 'rotate-180' : ''}`} />
                        </button>
                        {activeDropdown === 'product' && (
                            <div className="absolute top-[60px] -left-10 w-[600px] p-6 bg-white rounded-2xl shadow-2xl shadow-purple-900/5 border border-gray-100 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 z-40">
                                {productLinks.map((item) => (
                                    <a key={item.name} href="#" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover/item:bg-purple-100 transition-colors">
                                            <item.icon size={20} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-[#202124]">{item.name}</div>
                                            <div className="text-xs text-[#5f6368] mt-0.5">{item.desc}</div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                    <a href="/home/blog" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Blog</a>
                    <a href="/home/enterprise" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Enterprise</a>
                    <a href="/#pricing" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Pricing</a>
                    <a href="/home/contact" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Contact Us</a>
                </div>

                {/* Auth / Dashboard Section */}
                <div className="hidden md:flex items-center gap-4">
                    {!loading && (
                        <>
                            {user ? (
                                // LOGGED IN VIEW
                                <div className="flex items-center gap-4">
                                    <a href='/dashboard' className="bg-[#202124] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 cursor-pointer" >
                                        Dashboard <ArrowRight size={14} />
                                    </a>
                                    <div className="relative h-9 w-9 rounded-full overflow-hidden border border-gray-200">
                                        <img
                                            src={avatarUrl || '/default-avatar.png'}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            ) : (
                                // LOGGED OUT VIEW
                                <>
                                    <a href="/auth/login" className="text-sm font-medium text-[#5f6368] hover:text-[#202124]">Sign In</a>
                                    <a href='/auth/register' className="bg-[#202124] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 cursor-pointer" >
                                        Get Started <ArrowRight size={14} />
                                    </a>
                                </>
                            )}
                        </>
                    )}
                </div>

                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#5f6368]">
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="absolute top-[72px] left-0 w-full h-[calc(100vh-72px)] bg-white overflow-y-auto p-6 flex flex-col gap-6 md:hidden animate-in slide-in-from-top-2 shadow-xl border-t border-gray-100">
                    <div className="space-y-4">
                        <div className="text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-2">Platform</div>
                        {productLinks.map((item) => (
                            <a key={item.name} href="#" className="flex items-center gap-3 py-2 text-[#202124]">
                                <item.icon size={20} className="text-purple-600" />
                                <span className="text-lg font-medium">{item.name}</span>
                            </a>
                        ))}
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                        {!loading && (
                            <>
                                {user ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                                                <img src={avatarUrl || '/default-avatar.png'} alt="Profile" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="font-medium text-[#202124]">{user.email}</span>
                                        </div>
                                        <a href='/dashboard' className="bg-[#202124] text-white px-5 py-3 rounded-xl text-center font-medium" >
                                            Go to Dashboard
                                        </a>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <a href="/auth/login" className="px-5 py-3 rounded-xl border border-gray-200 text-center font-medium text-[#202124]">Sign In</a>
                                        <a href="/auth/register" className="bg-[#202124] text-white px-5 py-3 rounded-xl text-center font-medium">Get Started</a>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
