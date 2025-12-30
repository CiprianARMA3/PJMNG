"use client";

import { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";
import Image from 'next/image';
import {
  Home,
  CreditCard,
  Bell,
  LogOut,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

// --- DYNAMIC SECTION IMPORTS ---
const HomeSection = lazy(() => import("./components/dashboard-sections/HomeSection"));
const MailSection = lazy(() => import("./components/dashboard-sections/Blog"));
const QuickActionsSection = lazy(() => import("./components/dashboard-sections/Subscriptions"));
const UserSettings = lazy(() => import("./components/profile-settings/Settings"));

const supabase = createClient();
const DEFAULT_AVATAR = "/default-avatar.png";

const SECTIONS = {
  HOME: "Dashboard",
  MAIL: "Blog",
  SUBS: "Subscriptions",
  PROFILE: "Profile",
};

const MAIN_MENU = [
  { icon: Home, label: "Dashboard", section: SECTIONS.HOME },
  { icon: CreditCard, label: "Subscriptions", section: SECTIONS.SUBS },
  { icon: Bell, label: "Blog", section: SECTIONS.MAIL },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user: sessionUser, loading } = useRequireAuth();
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState(SECTIONS.HOME);
  const [userLoading, setUserLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => setIsScrolled(latest > 20));

  useEffect(() => {
    const fetchUser = async () => {
      if (!sessionUser) { setUserLoading(false); return; }
      try {
        const { data } = await supabase
          .from("users")
          .select("id, email, name, surname, metadata")
          .eq("id", sessionUser.id)
          .single();

        if (data) {
          setUser({
            ...data,
            avatar_url: data.metadata?.avatar_url || DEFAULT_AVATAR,
            fullName: `${data.name || ""} ${data.surname || ""}`.trim() || "User",
          });
        }
      } catch (e) { console.error(e); } finally { setUserLoading(false); }
    };
    fetchUser();
  }, [sessionUser]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }, [router]);

  if (loading || userLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-[#0A0A0A]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Initializing...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] text-[#202124] dark:text-zinc-100 font-sans selection:bg-purple-500/30">
      
      {/* --- FLOATING ISLAND NAVIGATION --- */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
        <motion.nav
          layout
          initial={{ width: "100%", borderRadius: 0, y: 0 }}
          animate={{
            width: isScrolled ? "min(1000px, 95%)" : "100%",
            borderRadius: isScrolled ? "9999px" : "0px",
            y: isScrolled ? 20 : 0,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
          className={`
            pointer-events-auto flex items-center justify-between h-[64px] md:h-[76px] px-8 backdrop-blur-xl transition-all duration-300
            ${isScrolled 
              ? 'bg-white/80 dark:bg-[#0A0A0A]/80 border-2 border-zinc-200/50 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.08)]' 
              : 'bg-transparent border-b border-zinc-100 dark:border-zinc-900'
            }
          `}
        >
          {/* 1. LOGO */}
          <motion.div layout className="flex-1 flex justify-start">
            <a href="/" className="group flex items-center gap-1 leading-none">
              <span className="text-xl font-normal tracking-tight text-[#202124] dark:text-white">
                KAPR<span className="text-purple-600">Y</span><span className="font-black"> DEV</span>
              </span>
            </a>
          </motion.div>

          {/* 2. CENTERED MENU (STARK WHITE ACTIVE STATE) */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-100/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
            {MAIN_MENU.map(({ icon: Icon, label, section }) => {
              const isActive = activeSection === section;
              return (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`
                    relative flex items-center gap-2 px-5 py-2.5 rounded-[14px] transition-all duration-300 active:scale-95 group
                    ${isActive 
                      ? "bg-white dark:bg-white text-[#202124] dark:text-zinc-900 shadow-sm border border-zinc-200 dark:border-white" 
                      : "text-zinc-500 dark:text-zinc-400 hover:text-[#202124] dark:hover:text-white"
                    }
                  `}
                >
                  <Icon size={14} strokeWidth={isActive ? 3 : 2} />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">{label}</span>
                </button>
              );
            })}
          </div>

          {/* 3. PROFILE & LOGOUT */}
          <div className="flex-1 flex justify-end items-center gap-3">
            <button
                onClick={() => setActiveSection(SECTIONS.PROFILE)}
                className="flex items-center gap-2 p-1 pr-4 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800 rounded-full hover:border-purple-600 dark:hover:border-purple-500 transition-all active:scale-95 group"
            >
                <div className="relative">
                  <Image 
                    src={user.avatar_url} 
                    alt="User" width={32} height={32} 
                    className="rounded-full object-cover border-2 border-white dark:border-zinc-800" unoptimized 
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                </div>
                <div className="hidden lg:flex flex-col items-start leading-none">
                  <span className="text-[13px] font-black uppercase tracking-wider dark:text-zinc-300">{user.name} {user.surname}</span>
                </div>
            </button>

            <button
                onClick={handleLogout}
                className="p-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-500 transition-all active:scale-90 bg-white dark:bg-zinc-900"
            >
                <LogOut size={16} strokeWidth={3} />
            </button>
          </div>
        </motion.nav>
      </div>

      {/* --- CONTENT AREA --- */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="fixed inset-0 bg-[url('/grainy.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none -z-10" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Suspense fallback={
                <div className="w-full bg-white dark:bg-zinc-900/40 border-2 border-zinc-100 dark:border-zinc-800/50 rounded-[40px] h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" strokeWidth={3} />
                </div>
              }>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {activeSection === SECTIONS.HOME && <HomeSection userName={user.name} user={user} />}
                    {activeSection === SECTIONS.MAIL && <MailSection />}
                    {activeSection === SECTIONS.SUBS && <QuickActionsSection />}
                    {activeSection === SECTIONS.PROFILE && <UserSettings user={user} />}
                </div>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}