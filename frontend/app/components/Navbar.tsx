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
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

interface NavbarProps {
    className?: string;
}

const Navbar = ({ className = "" }: NavbarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    // Auth state
    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    
    // Framer motion scroll hook for better performance
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 20) {
            setIsScrolled(true);
        } else {
            setIsScrolled(false);
        }
    });

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('metadata')
                        .eq('id', user.id)
                        .single();

                    if (profile && profile.metadata?.avatar_url) {
                        setAvatarUrl(profile.metadata.avatar_url);
                    } else {
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
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <motion.nav
                layout
                initial={{ width: "100%", borderRadius: 0, y: 0 }}
                animate={{
                    width: isScrolled ? "min(850px, 95%)" : "100%",
                    borderRadius: isScrolled ? "9999px" : "0px",
                    y: isScrolled ? 20 : 0,
                    backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.5)",
                    border: isScrolled ? "1px solid rgba(228, 228, 231, 1)" : "1px solid rgba(255, 255, 255, 0.1)",
                }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                    mass: 0.8
                }}
                onMouseLeave={() => setActiveDropdown(null)}
                className={`
                    pointer-events-auto
                    flex items-center justify-between
                    h-[60px] md:h-[72px] px-6
                    backdrop-blur-xl shadow-sm
                    ${isScrolled ? 'shadow-[0_8px_30px_rgb(0,0,0,0.12)]' : ''}
                    ${className}
                `}
            >
                {/* Logo Area */}
                <motion.div layout className="flex items-center gap-1 cursor-pointer">
                    <a href="/" className="flex items-center gap-1">
                        <span className="text-2xl font-normal tracking-tight">KAPR<span className="text-purple-600 font-normal">Y</span><span className='font-black'>.DEV</span></span>
                        
                        {/* Smoothly animate the extra text out */}
                        <AnimatePresence>
                            {!isScrolled && (
                                <motion.span 
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="text-2xl font-black tracking-tight text-[#202124] overflow-hidden whitespace-nowrap"
                                >
                                    {/* Text Content here if needed */}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </a>
                </motion.div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-6 h-full">
                    <div
                        className="relative h-full flex items-center"
                        onMouseEnter={() => setActiveDropdown('product')}
                    >
                        <button className="flex items-center gap-1 text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors group">
                            Product 
                            <motion.div 
                                animate={{ rotate: activeDropdown === 'product' ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown size={14} />
                            </motion.div>
                        </button>
                        
                        {/* Animated Dropdown Menu */}
                        <AnimatePresence>
                            {activeDropdown === 'product' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className={`
                                        absolute left-1/2 -translate-x-1/2 p-6 bg-white rounded-2xl shadow-2xl border border-gray-100 grid grid-cols-2 gap-4 z-40
                                        w-[500px] lg:w-[600px]
                                    `}
                                    style={{ top: "calc(100% + 10px)" }}
                                >
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* Navigation Links */}
                    {['Blog', 'Enterprise', 'Pricing', 'Contact'].map((item) => (
                         <a key={item} href={`/home/${item.toLowerCase()}`} className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">
                            {item}
                         </a>
                    ))}
                </div>

                {/* Auth / Dashboard Section */}
                <div className="hidden md:flex items-center gap-3">
                    {!loading && (
                        <>
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <motion.a 
                                        layout
                                        href='/dashboard' 
                                        className={`
                                            bg-[#202124] text-white rounded-full font-medium hover:bg-black shadow-sm flex items-center gap-2 cursor-pointer
                                            ${isScrolled ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'}
                                        `} 
                                    >
                                        <motion.span layout>Dashboard</motion.span> 
                                        <ArrowRight size={14} />
                                    </motion.a>
                                    <motion.div layout className={`relative rounded-full overflow-hidden border border-gray-200 ${isScrolled ? 'h-8 w-8' : 'h-9 w-9'}`}>
                                        <img
                                            src={avatarUrl || '/default-avatar.png'}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>
                                </div>
                            ) : (
                                <>
                                    <a href="/auth/login" className="text-sm font-medium text-[#5f6368] hover:text-[#202124]">Sign In</a>
                                    <motion.a 
                                        layout
                                        href='/auth/register' 
                                        className={`
                                            bg-[#202124] text-white rounded-full font-medium hover:bg-black shadow-sm flex items-center gap-2 cursor-pointer
                                            ${isScrolled ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'}
                                        `} 
                                    >
                                        <motion.span layout>Get Started</motion.span> 
                                        <ArrowRight size={14} />
                                    </motion.a>
                                </>
                            )}
                        </>
                    )}
                </div>

                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#5f6368] p-1">
                    {isOpen ? <X /> : <Menu />}
                </button>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 top-[72px] z-40 bg-white/95 backdrop-blur-sm overflow-y-auto pointer-events-auto md:hidden"
                    >
                        <div className="p-6 flex flex-col gap-6">
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Navbar;