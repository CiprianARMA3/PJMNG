"use client";
import { useState, useEffect, Suspense, lazy, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";
import Image from 'next/image';
import Link from 'next/link';
import {
  Home,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  User as UserIcon
} from "lucide-react";
import Breadcrumb from "./components/Breadcrumb";
import { signOut } from "../actions/auth";

// Dynamic imports
const HomeSection = lazy(() => import("./components/dashboard-sections/HomeSection"));
const MailSection = lazy(() => import("./components/dashboard-sections/MailSection"));
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
];

// Loading fallback
const SectionSkeleton = () => (
  <div className="animate-pulse bg-zinc-900/30 border border-zinc-800 rounded-2xl h-64 flex items-center justify-center">
    <div className="text-zinc-500 font-medium">Loading content...</div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user: sessionUser, loading } = useRequireAuth();
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState(SECTIONS.HOME);
  const [userLoading, setUserLoading] = useState(true);

  // -- DATA FETCHING --
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

        if (error) {
          console.error("Error fetching user:", error);
          setUser({ fullName: "User", avatar_url: DEFAULT_AVATAR });
        } else if (data) {
          const avatarUrl = data.metadata?.avatar_url || DEFAULT_AVATAR;
          setUser({
            ...data,
            avatar_url: avatarUrl ? `${avatarUrl}?t=${Date.now()}` : DEFAULT_AVATAR,
            fullName: `${data.name || ""} ${data.surname || ""}`.trim() || "User",
          });
        }
      } catch (error) {
        console.error("Error in fetchUser:", error);
        setUser({ fullName: "User", avatar_url: DEFAULT_AVATAR });
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
    if (!user || !user.avatar_url) return `${DEFAULT_AVATAR}?t=${Date.now()}`;
    return user.avatar_url.includes('?') ? user.avatar_url : `${user.avatar_url}?t=${Date.now()}`;
  }, [user?.avatar_url]);

  const sectionProps = useMemo(() => ({
    userName: user?.fullName || "User",
    user: user
  }), [user?.fullName, user]);

  // -- RENDER CONTENT --
  const renderMainContent = useCallback(() => {
    switch (activeSection) {
      case SECTIONS.HOME:
        return <Suspense fallback={<SectionSkeleton />}><HomeSection {...sectionProps} /></Suspense>;
      case SECTIONS.MAIL:
        return <Suspense fallback={<SectionSkeleton />}><MailSection /></Suspense>;
      case SECTIONS.CreditCard:
        return <Suspense fallback={<SectionSkeleton />}><QuickActionsSection /></Suspense>;
      case SECTIONS.SETTINGS:
        return <Suspense fallback={<SectionSkeleton />}><SettingsSection /></Suspense>;
      case SECTIONS.PROFILE_SETTINGS:
        return <Suspense fallback={<SectionSkeleton />}><UserSettings user={user} /></Suspense>;
      default:
        return <Suspense fallback={<SectionSkeleton />}><HomeSection {...sectionProps} /></Suspense>;
    }
  }, [activeSection, sectionProps, user]);

  if (loading || userLoading || !user) {
    return (
      <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        {/* Spinner SVG */}
        <svg aria-hidden="true" className="inline w-8 h-8 text-neutral-400 animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative font-sans selection:bg-purple-500/30">
      
      {/* --- DYNAMIC ISLAND NAVIGATION --- */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
        <nav className="pointer-events-auto flex items-center gap-1 p-1.5 bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50 transition-all duration-300 hover:scale-[1.01] hover:border-white/20">
          
          {/* Logo - Restored original text style inside the island container */}
          <div className="pl-4 pr-2 flex items-center gap-0.5">
              <span className="text-lg font-medium tracking-tight text-zinc-300">KAPR<span className="text-purple-500">Y</span></span>
              <span className="text-lg font-bold tracking-tight text-white">.DEV</span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

          {/* Menu Items */}
          <div className="flex items-center gap-1">
            {MAIN_MENU.map(({ icon: Icon, label, section }) => {
              const isActive = activeSection === section;
              return (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? "text-white bg-zinc-800 shadow-inner shadow-white/5" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

          {/* User Profile Pill */}
          <div className="relative group">
            <button
              onClick={() => setActiveSection(SECTIONS.PROFILE_SETTINGS)}
              className="flex items-center gap-3 pl-1 pr-1.5 py-1 rounded-full hover:bg-zinc-800 transition-all duration-300"
            >
              <div className="relative">
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full object-cover border border-white/10"
                  unoptimized
                />
                {/* Online Indicator */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#111] rounded-full"></div>
              </div>
              
            <span className="hidden md:block text-xs font-medium text-zinc-300 pr-2 group-hover:text-white transition-colors max-w-[80px] truncate">
              {user?.name} {user?.surname ? `${user.surname.charAt(0).toUpperCase()}.` : ""}
            </span>
            </button>
            
            {/* Quick Logout (Visible on Hover of Profile area) */}
            <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
               <button 
                onClick={() => signOut()} 
                className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-zinc-800 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-zinc-900 shadow-xl whitespace-nowrap"
               >
                 <LogOut size={12} />
                 Sign out
               </button>
            </div>
          </div>

        </nav>
      </div>

      {/* Main Content - Added padding-top to account for the floating island */}
      <main className="pt-32 min-h-screen z-10 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-6 pb-12">
          {/* Breadcrumbs & Header */}
          <div className="mb-8">
            <Breadcrumb
              items={[
                "Dashboard",
                activeSection === SECTIONS.HOME ? "" : activeSection.charAt(0).toUpperCase() + activeSection.slice(1),
              ].filter(Boolean)}
            />
          </div>

          {/* Content Render */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderMainContent()}
          </div>
        </div>
      </main>
    </div>
  );
}