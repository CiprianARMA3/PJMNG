"use client";

import { useState, useEffect, Suspense, lazy, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";
import Image from 'next/image';
import {
  Home,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  User as UserIcon,
  Bell,
  Terminal,
  Zap,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

// Dynamic imports
const HomeSection = lazy(() => import("./components/dashboard-sections/HomeSection"));
const MailSection = lazy(() => import("./components/dashboard-sections/Blog"));
const QuickActionsSection = lazy(() => import("./components/dashboard-sections/Subscriptions"));
const SettingsSection = lazy(() => import("./components/dashboard-sections/SettingsSection"));
const UserSettings = lazy(() => import("./components/profile-settings/Settings"));

const supabase = createClient();
const DEFAULT_AVATAR = "/default-avatar.png";

const SECTIONS = {
  HOME: "Home Page",
  MAIL: "Messages",
  CreditCard: "Subscriptions",
  SETTINGS: "settings",
  PROFILE_SETTINGS: "profile-settings",
};

const MAIN_MENU = [
  { icon: Home, label: "Dashboard", section: SECTIONS.HOME },
  { icon: CreditCard, label: "Subscriptions", section: SECTIONS.CreditCard },
  { icon: Bell, label: "Blog", section: SECTIONS.MAIL },
];

const SectionSkeleton = () => (
  <div className="w-full bg-white border-2 border-zinc-100 rounded-[40px] h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] pointer-events-none" />
    <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" strokeWidth={3} />
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Syncing Node Data...</span>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user: sessionUser, loading } = useRequireAuth();
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState(SECTIONS.HOME);
  const [userLoading, setUserLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!sessionUser) {
        setUserLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, email, name, surname, metadata")
          .eq("id", sessionUser.id)
          .single();

        if (data) {
          const avatarUrl = data.metadata?.avatar_url || DEFAULT_AVATAR;
          setUser({
            ...data,
            avatar_url: avatarUrl,
            fullName: `${data.name || ""} ${data.surname || ""}`.trim() || "User",
          });
        }
      } catch (error) {
        console.error("Error in fetchUser:", error);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUser();
  }, [sessionUser]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }, [router]);

  const avatarUrl = useMemo(() => {
    return user?.avatar_url ? `${user.avatar_url}?t=${Date.now()}` : DEFAULT_AVATAR;
  }, [user?.avatar_url]);

  const sectionProps = useMemo(() => ({
    userName: user?.name || "User",
    user: user
  }), [user]);

  if (loading || userLoading || !user) {
    return (
      <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a] light:bg-white">
        {/* Spinner SVG */}
        <svg aria-hidden="true" className="inline w-8 h-8 text-neutral-400 animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-purple-100">
      
      {/* --- SUPERCHARGED ISLAND NAVIGATION --- */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none">
        <motion.nav
          layout
          initial={{ width: "100%", borderRadius: 0, y: 0 }}
          animate={{
            width: isScrolled ? "min(1200px, 95%)" : "100%",
            borderRadius: isScrolled ? "32px" : "0px",
            y: isScrolled ? 24 : 0,
            backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 1)",
            border: isScrolled ? "2px solid #f4f4f5" : "1px solid #f4f4f5",
          } as any}
          transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
          className={`
            pointer-events-auto flex items-center
            h-[64px] md:h-[76px] px-8 backdrop-blur-2xl
            ${isScrolled ? 'shadow-[0_20px_50px_rgba(0,0,0,0.05)]' : 'border-b border-zinc-100'}
          `}
        >
          {/* 1. LEFT COLUMN: LOGO (Flex-1) */}
          <div className="flex-1 flex justify-start">
            <motion.div layout>
              <a href="/" className="group flex flex-col leading-none border-r-2 border-zinc-50 pr-6">
                <span className="text-[11px] font-normal tracking-tight text-zinc-400 group-hover:text-purple-600 transition-colors">
                  KAPR<span className="text-purple-600">Y</span>
                </span>
                <span className="text-xl font-black tracking-tighter text-zinc-900 -mt-1">
                  DEV<span className="text-purple-600">.</span>
                </span>
              </a>
            </motion.div>
          </div>

          {/* 2. CENTER COLUMN: MENU MATRIX (Centered regardless of side widths) */}
          <div className="flex-none hidden md:flex items-center gap-1.5 bg-zinc-50/50 p-1 rounded-2xl border border-zinc-100 mx-4">
            {MAIN_MENU.map(({ icon: Icon, label, section }) => {
              const isActive = activeSection === section;
              return (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`
                    relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 group
                    ${isActive 
                      ? "bg-purple-50 text-purple-600 border border-purple-100 shadow-sm" 
                      : "text-zinc-400 hover:text-zinc-900 hover:bg-white"
                    }
                  `}
                >
                  <Icon size={14} strokeWidth={isActive ? 3 : 2.5} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
                </button>
              );
            })}
          </div>

          {/* 3. RIGHT COLUMN: PROFILE CLUSTER (Flex-1) */}
          <div className="flex-1 flex justify-end items-center gap-2">
            
            {/* Control Cluster Wrapper */}
            <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-[30px] border-2 border-zinc-100">
                
                {/* Profile Node */}
                <button
                    onClick={() => setActiveSection(SECTIONS.PROFILE_SETTINGS)}
                    className="flex items-center gap-3 pl-1 pr-4 py-1 bg-white border-2 border-zinc-100 hover:border-purple-600 rounded-[24px] transition-all duration-300 group shadow-sm active:scale-95"
                >
                    <div className="relative flex-shrink-0">
                    <Image
                        src={avatarUrl}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="rounded-xl w-[36px] h-[36px] object-cover border-2 border-zinc-100"
                        unoptimized
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                    </div>
                    </div>

                    <div className="hidden md:flex flex-col items-start leading-none pr-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 truncate max-w-[150px]">
                        {user?.name || "User"} {user?.surname || ""}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter mt-1">
                        {user?.email || "email"}
                    </span>
                    </div>
                </button>

                {/* System Config Node (Settings Toggle) */}


                {/* Terminate Action Node (Hover Profile area to see Logout in previous logic, or just add Terminate button here) */}
                <div className="relative group/logout">
                     <button
                        onClick={handleLogout}
                        className="p-2.5 rounded-2xl border-2 bg-white border-zinc-100 text-zinc-400 hover:border-red-500 hover:text-red-500 transition-all active:scale-90"
                    >
                        <LogOut size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className={`pt-32 pb-20 transition-all duration-500 ${isScrolled ? 'px-6' : 'px-0'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="px-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <Suspense fallback={<SectionSkeleton />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                   {activeSection === SECTIONS.HOME && <HomeSection {...sectionProps} />}
                   {activeSection === SECTIONS.MAIL && <MailSection />}
                   {activeSection === SECTIONS.CreditCard && <QuickActionsSection />}
                   {activeSection === SECTIONS.SETTINGS && <SettingsSection />}
                   {activeSection === SECTIONS.PROFILE_SETTINGS && <UserSettings user={user} />}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}