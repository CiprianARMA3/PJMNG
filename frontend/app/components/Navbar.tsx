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

const PRODUCT_LINKS = [
    { icon: Bot, name: 'AI Assistant', desc: 'Context-aware coding help', href: '/home/products/ai' },
    { icon: GitBranch, name: 'Repo Review', desc: 'Automated PR analysis', href: '/home/products/ai/repository-review' },
    { icon: Database, name: 'SQL Helper', desc: 'Natural language to SQL', href: '/home/products/ai/sql-helper' },
    { icon: LayoutList, name: 'Roadmap', desc: 'AI-generated milestones', href: '/home/products/ai/roadmap' },
    { icon: KanbanSquare, name: 'Kanban Board', desc: 'Drag-and-drop tasks', href: '/home/products/management/kanban-board' },
    { icon: UserCog, name: 'Team', desc: 'Management made easier', href: '/home/products/management/team' },
];

const NAV_LINKS = [
    { name: 'Blog', href: '/home/blog' },
    { name: 'Enterprise', href: '/home/enterprise' },
    { name: 'Pricing', href: '/home/pricing' },
    { name: 'Contact', href: '/home/contact' },
];

const Navbar = ({ className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 20);
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
                    setAvatarUrl(profile?.metadata?.avatar_url || user.user_metadata?.avatar_url || null);
                }
            } catch (error) {
                console.error('Auth error:', error);
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, [supabase]);

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none p-4 md:p-0">
            <motion.nav
                layout
                initial={{ width: "100%", borderRadius: 0, y: 0 }}
                animate={{
                    width: isScrolled ? "min(1000px, 95%)" : "100%",
                    borderRadius: isScrolled ? "9999px" : "0px",
                    y: isScrolled ? 20 : 0,
                    backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0)",
                    paddingLeft: isScrolled ? 32 : 40,
                    paddingRight: isScrolled ? 32 : 40,
                }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                    mass: 0.8,
                }}
                onMouseLeave={() => setActiveDropdown(null)}
                className={`
                    pointer-events-auto flex items-center justify-between
                    h-[64px] md:h-[76px] backdrop-blur-xl transition-all duration-300
                    ${isScrolled 
                        ? 'border-2 border-zinc-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)]' 
                        : 'border-b border-zinc-100'
                    }
                    ${className}
                `}
            >
                {/* 1. LOGO */}
                <motion.div layout className="flex items-center shrink-0">
                    <a href="/" className="flex items-center gap-1 group">
                        <span className="text-xl md:text-2xl font-normal tracking-tight text-[#202124]">
                            KAPR<span className="text-purple-600 font-normal">Y</span><span className='font-black'> DEV</span>
                        </span>
                    </a>
                </motion.div>

                {/* 2. DESKTOP NAVIGATION */}
                <div className="hidden md:flex items-center gap-8 h-full">
                    <div className="relative h-full flex items-center" onMouseEnter={() => setActiveDropdown('product')}>
                        <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#5f6368] hover:text-[#202124] transition-colors group">
                            Product 
                            <motion.div animate={{ rotate: activeDropdown === 'product' ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown size={14} strokeWidth={3} />
                            </motion.div>
                        </button>
                        
                        <AnimatePresence>
                            {activeDropdown === 'product' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute left-1/2 -translate-x-1/2 p-6 bg-white rounded-[32px] shadow-2xl border-2 border-zinc-100 grid grid-cols-2 gap-4 z-40 w-[550px] overflow-hidden"
                                    style={{ top: "calc(100% - 10px)" }}
                                >
                                    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
                                    {PRODUCT_LINKS.map((item) => (
                                        <a key={item.name} href={item.href} className="relative z-10 flex items-start gap-4 p-4 rounded-2xl border-2 border-transparent hover:bg-zinc-50 hover:border-zinc-100 transition-all group/item">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-50 border-2 border-zinc-100 text-purple-600 flex items-center justify-center shrink-0 group-hover/item:bg-purple-600 group-hover/item:text-white transition-colors duration-300">
                                                <item.icon size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#202124] group-hover/item:text-purple-600 transition-colors">{item.name}</div>
                                                <div className="text-[11px] font-bold text-zinc-400 mt-1 leading-snug">{item.desc}</div>
                                            </div>
                                        </a>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {NAV_LINKS.map((link) => (
                         <a key={link.name} href={link.href} className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5f6368] hover:text-[#202124] transition-colors">
                            {link.name}
                         </a>
                    ))}
                </div>

                {/* 3. AUTH CLUSTER */}
                <motion.div layout className="hidden md:flex items-center gap-4">
                    {loading ? (
                        <div className="w-8 h-8 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        </div>
                    ) : (
                        <>
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <motion.a 
                                        href='/dashboard' 
                                        layout
                                        animate={{
                                            paddingLeft: isScrolled ? 20 : 24,
                                            paddingRight: isScrolled ? 20 : 24,
                                            height: isScrolled ? 40 : 44,
                                        }}
                                        className="bg-[#202124] text-white rounded-full font-black uppercase tracking-[0.15em] text-[9px] hover:bg-black flex items-center justify-center gap-2 group shadow-lg shadow-zinc-200/50"
                                    >
                                        <motion.span layout="position">Dashboard</motion.span>
                                        <ArrowRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                    </motion.a>
                                    <motion.div layout className="relative rounded-full overflow-hidden border-2 border-zinc-100 w-10 h-10 shadow-sm shrink-0">
                                        <img src={avatarUrl || '/default-avatar.png'} alt="Profile" className="w-full h-full object-cover" />
                                    </motion.div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-6">
                                    <a href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-[#5f6368] hover:text-[#202124] transition-colors">Sign In</a>
                                    <motion.a 
                                        href='/auth/register' 
                                        layout
                                        animate={{
                                            paddingLeft: isScrolled ? 20 : 24,
                                            paddingRight: isScrolled ? 20 : 24,
                                            height: isScrolled ? 40 : 44,
                                        }}
                                        className="bg-[#202124] text-white rounded-full font-black uppercase tracking-[0.15em] text-[9px] hover:bg-black flex items-center justify-center gap-2 group shadow-lg shadow-zinc-200/50"
                                    >
                                        <motion.span layout="position">Get Started</motion.span>
                                        <ArrowRight size={14} strokeWidth={3} />
                                    </motion.a>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>

                {/* 4. MOBILE TRIGGER */}
                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#5f6368] p-1 active:scale-90 transition-transform">
                    {isOpen ? <X strokeWidth={3} /> : <Menu strokeWidth={3} />}
                </button>
            </motion.nav>

            {/* 5. MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed inset-0 top-[80px] z-40 bg-white/95 backdrop-blur-md overflow-y-auto pointer-events-auto md:hidden"
                    >
                        {/* Mobile content remains same as original for usability */}
                        <div className="p-6 flex flex-col gap-10 pb-20">
                            <div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-4">Platform</div>
                                <div className="flex flex-col gap-2">
                                    {PRODUCT_LINKS.map((item) => (
                                        <a key={item.name} href={item.href} className="flex items-center gap-4 py-4 px-4 rounded-2xl hover:bg-zinc-50 border-2 border-transparent active:border-zinc-100 transition-all">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-purple-600 shrink-0 border border-zinc-100">
                                                <item.icon size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-[#202124]">{item.name}</span>
                                                <p className="text-xs font-bold text-zinc-400 mt-0.5">{item.desc}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-4">Company</div>
                                <div className="flex flex-col gap-1">
                                    {NAV_LINKS.map((link) => (
                                        <a key={link.name} href={link.href} className="text-lg font-black tracking-tighter text-[#202124] py-3 px-4 rounded-2xl hover:bg-zinc-50 active:scale-[0.98] transition-all">
                                            {link.name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-8 border-t border-zinc-100 flex flex-col gap-4">
                                {!user ? (
                                    <>
                                        <a href="/auth/login" className="px-6 py-4 rounded-2xl border-2 border-zinc-100 text-center font-black uppercase tracking-[0.2em] text-sm text-[#202124] hover:bg-zinc-50">Sign In</a>
                                        <a href="/auth/register" className="bg-[#202124] text-white px-6 py-4 rounded-2xl text-center font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-zinc-200">Get Started</a>
                                    </>
                                ) : (
                                    <a href="/dashboard" className="bg-[#202124] text-white px-6 py-4 rounded-2xl text-center font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2">
                                        Go to Dashboard <ArrowRight size={18} strokeWidth={3} />
                                    </a>
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