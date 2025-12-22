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
    ArrowRight,
    Loader2
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

interface NavbarProps {
    className?: string;
}

// --- 1. PRODUCT LINKS CONSTANT ---
const productLinks = [
    { icon: Bot, name: 'AI Assistant', desc: 'Context-aware coding help', href: '/home/products/ai' },
    { icon: GitBranch, name: 'Repo Review', desc: 'Automated PR analysis', href: '/home/products/ai/repository-review' },
    { icon: Database, name: 'SQL Helper', desc: 'Natural language to SQL', href: '/home/products/ai/sql-helper' },
    { icon: LayoutList, name: 'Roadmap', desc: 'AI-generated milestones', href: '/home/products/ai/roadmap' },
    { icon: KanbanSquare, name: 'Kanban Board', desc: 'Drag-and-drop tasks', href: '#' },
    { icon: UserCog, name: 'Team', desc: 'Management made easier', href: '#' },
];

const navLinks = [
    { name: 'Blog', href: '/home/blog' },
    { name: 'Enterprise', href: '/home/enterprise' },
    { name: 'Pricing', href: '/home/pricing' },
    { name: 'Contact', href: '/home/contact' },
];

const Navbar = ({ className = "" }: NavbarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    // Auth state
    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    
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

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <motion.nav
                layout
                initial={{ width: "100%", borderRadius: 0, y: 0 }}
                animate={{
                    width: isScrolled ? "min(850px, 95%)" : "100%",
                    borderRadius: isScrolled ? "9999px" : "0px",
                    y: isScrolled ? 20 : 0,
                    backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.5)",
                    border: isScrolled ? "2px solid rgba(244, 244, 245, 1)" : "1px solid rgba(255, 255, 255, 0.1)",
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
                        <span className="text-2xl font-normal tracking-tight text-[#202124]">
                            KAPR<span className="text-purple-600 font-normal">Y</span><span className='font-black'>.DEV</span>
                        </span>
                    </a>
                </motion.div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-6 h-full">
                    <div
                        className="relative h-full flex items-center"
                        onMouseEnter={() => setActiveDropdown('product')}
                    >
                        <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#5f6368] hover:text-[#202124] transition-colors group">
                            Product 
                            <motion.div 
                                animate={{ rotate: activeDropdown === 'product' ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown size={14} strokeWidth={3} />
                            </motion.div>
                        </button>
                        
                        <AnimatePresence>
                            {activeDropdown === 'product' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className={`
                                        absolute left-1/2 -translate-x-1/2 p-6 bg-white rounded-[40px] shadow-2xl border-2 border-zinc-100 grid grid-cols-2 gap-4 z-40
                                        w-[550px] lg:w-[600px] overflow-hidden
                                    `}
                                    style={{ top: "calc(100% + 15px)" }}
                                >
                                    {/* GRAINY TEXTURE OVERLAY */}
                                    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none z-0" />
                                    
                                    {productLinks.map((item) => (
                                        <a 
                                            key={item.name} 
                                            href={item.href} 
                                            className="relative z-10 flex items-start gap-4 p-4 rounded-3xl border-2 border-transparent hover:bg-zinc-50 hover:border-zinc-100 transition-all group/item"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-zinc-50 border-2 border-zinc-100 text-purple-600 flex items-center justify-center shrink-0 group-hover/item:bg-purple-600 group-hover/item:text-white group-hover/item:border-purple-600 transition-all duration-300">
                                                <item.icon size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                {/* MODIFIED: text-sm font-bold instead of font-black uppercase */}
                                                <div className="text-sm font-bold text-[#202124] group-hover/item:text-purple-600 transition-colors">
                                                    {item.name}
                                                </div>
                                                <div className="text-[11px] font-bold text-zinc-400 mt-1 leading-snug">
                                                    {item.desc}
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {navLinks.map((link) => (
                         <a key={link.name} href={link.href} className="text-[10px] font-black uppercase tracking-widest text-[#5f6368] hover:text-[#202124] transition-colors">
                            {link.name}
                         </a>
                    ))}
                </div>

                {/* Auth Section */}
                <div className="hidden md:flex items-center gap-3">
                    {loading ? (
                        <div className="flex items-center justify-center w-8 h-8">
                            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        </div>
                    ) : (
                        <>
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <motion.a 
                                        layout
                                        href='/dashboard' 
                                        className={`
                                            bg-[#202124] text-white rounded-2xl font-black uppercase tracking-[0.2em] 
                                            hover:bg-black hover:shadow-2xl hover:-translate-y-0.5 transition-all 
                                            active:scale-95 flex items-center justify-center gap-2 group 
                                            shadow-xl shadow-zinc-200/50 cursor-pointer
                                            ${isScrolled ? 'px-4 py-2 text-[9px]' : 'px-6 py-3 text-[10px]'}
                                        `}
                                    >
                                        <motion.span layout>Dashboard</motion.span> 
                                        <ArrowRight size={14} strokeWidth={3} />
                                    </motion.a>
                                    <motion.div layout className={`relative rounded-full overflow-hidden border-2 border-zinc-100 ${isScrolled ? 'h-8 w-8' : 'h-10 w-10'}`}>
                                        <img src={avatarUrl || '/default-avatar.png'} alt="Profile" className="w-full h-full object-cover" />
                                    </motion.div>
                                </div>
                            ) : (
                                <>
                                    <a href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-[#5f6368] hover:text-[#202124]">Sign In</a>
                                    <motion.a 
                                        layout
                                        href='/auth/register' 
                                        className={`
                                            bg-[#202124] text-white rounded-2xl font-black uppercase tracking-[0.2em] 
                                            hover:bg-black shadow-xl shadow-zinc-200/50 flex items-center gap-2 cursor-pointer transition-all
                                            ${isScrolled ? 'px-4 py-2 text-[9px]' : 'px-6 py-3 text-[10px]'}
                                        `} 
                                    >
                                        <motion.span layout>Get Started</motion.span> 
                                        <ArrowRight size={14} strokeWidth={3} />
                                    </motion.a>
                                </>
                            )}
                        </>
                    )}
                </div>

                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#5f6368] p-1">
                    {isOpen ? <X strokeWidth={3} /> : <Menu strokeWidth={3} />}
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
                        className="fixed inset-0 top-[60px] md:top-[72px] z-40 bg-white/95 backdrop-blur-sm overflow-y-auto pointer-events-auto md:hidden"
                    >
                        <div className="p-6 flex flex-col gap-8 pb-20">
                            {/* Platform Section */}
                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em] mb-2 opacity-50 px-4">Platform</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {productLinks.map((item) => (
                                        <a key={item.name} href={item.href} className="flex items-center gap-4 py-4 px-4 rounded-2xl border-2 border-transparent hover:bg-zinc-50 hover:border-zinc-100 transition-all">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-purple-600 shrink-0">
                                                <item.icon size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-[#202124]">{item.name}</span>
                                                <p className="text-xs font-bold text-zinc-500 mt-0.5">{item.desc}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Navigation Section */}
                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-[#5f6368] uppercase tracking-[0.2em] mb-2 opacity-50 px-4">Company</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {navLinks.map((link) => (
                                        <a key={link.name} href={link.href} className="text-lg font-black tracking-tighter text-[#202124] py-3 px-4 rounded-2xl hover:bg-zinc-50 transition-all">
                                            {link.name}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Auth Section */}
                            <div className="pt-8 border-t-2 border-zinc-100 flex flex-col gap-6">
                                {loading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                    </div>
                                ) : (
                                    <>
                                        {user ? (
                                            <div className="flex flex-col gap-6">
                                                <div className="flex items-center gap-4 px-4">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-100 shadow-sm">
                                                        <img src={avatarUrl || '/default-avatar.png'} alt="Profile" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-[#202124] truncate max-w-[200px]">{user.email}</span>
                                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Active Session</span>
                                                    </div>
                                                </div>
                                                
                                                <a 
                                                    href='/dashboard' 
                                                    className="bg-[#202124] text-white px-6 py-4 rounded-2xl text-center font-black uppercase tracking-[0.2em] text-sm hover:bg-black shadow-xl shadow-zinc-200/50 mx-2 flex items-center justify-center gap-2 group"
                                                >
                                                    Go to Dashboard
                                                    <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3 px-2">
                                                <a href="/auth/login" className="px-6 py-4 rounded-2xl border-2 border-zinc-100 text-center font-black uppercase tracking-[0.2em] text-sm text-[#202124] hover:bg-zinc-50 transition-all">
                                                    Sign In
                                                </a>
                                                <a href="/auth/register" className="bg-[#202124] text-white px-6 py-4 rounded-2xl text-center font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all">
                                                    Get Started
                                                </a>
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