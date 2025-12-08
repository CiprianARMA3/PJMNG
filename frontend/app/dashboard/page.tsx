"use client";
import { useState, useEffect, Suspense, lazy, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";
import Image from 'next/image';
import {
  Home,
  Mail,
  CreditCard,
  BarChart,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Breadcrumb from "./components/Breadcrumb";

// Dynamic imports for all section components
const HomeSection = lazy(() => import("./components/dashboard-sections/HomeSection"));
const MailSection = lazy(() => import("./components/dashboard-sections/MailSection"));
const QuickActionsSection = lazy(() => import("./components/dashboard-sections/Subscriptions"));
const AnalyticsSection = lazy(() => import("./components/dashboard-sections/AnalyticsSection"));
const SettingsSection = lazy(() => import("./components/dashboard-sections/SettingsSection"));
const SearchSection = lazy(() => import("./components/dashboard-sections/SearchSection"));
const UserSettings = lazy(() => import("./components/profile-settings/Settings"));

const supabase = createClient();
const DEFAULT_AVATAR = "/default-avatar.png";

const SECTIONS = {
  HOME: "Home Page",
  MAIL: "Messages",
  CreditCard: "Subscriptions",
  // ANALYTICS: "analytics",
  SETTINGS: "settings",
  SEARCH: "search",
  PROFILE_SETTINGS: "profile-settings",
};

const MAIN_MENU = [
  { icon: Home, label: "Dashboard", section: SECTIONS.HOME },
  { icon: Mail, label: "Messages", section: SECTIONS.MAIL },
  { icon: CreditCard, label: "Subscriptions", section: SECTIONS.CreditCard },
  // { icon: BarChart, label: "Analytics", section: SECTIONS.ANALYTICS },
];

// Loading fallback component
const SectionSkeleton = () => (
  <div className="animate-pulse bg-white/10 rounded-lg h-64 flex items-center justify-center">
    <div className="text-white/40">Loading...</div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user: sessionUser, loading } = useRequireAuth();
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState(SECTIONS.HOME);
  const [userLoading, setUserLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          setUser({
            fullName: "User",
            avatar_url: DEFAULT_AVATAR,
          });
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
        setUser({
          fullName: "User",
          avatar_url: DEFAULT_AVATAR,
        });
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

  // Safe avatar URL with fallback (memoized)
  const avatarUrl = useMemo(() => {
    if (!user || !user.avatar_url) {
      return `${DEFAULT_AVATAR}?t=${Date.now()}`;
    }
    return user.avatar_url.includes('?')
      ? user.avatar_url
      : `${user.avatar_url}?t=${Date.now()}`;
  }, [user?.avatar_url]);

  // Memoize section props to prevent unnecessary re-renders
  const sectionProps = useMemo(() => ({
    userName: user?.fullName || "User",
    user: user
  }), [user?.fullName, user]);

  const renderMainContent = useCallback(() => {
    switch (activeSection) {
      case SECTIONS.HOME:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <HomeSection {...sectionProps} />
          </Suspense>
        );
      case SECTIONS.MAIL:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <MailSection />
          </Suspense>
        );
      case SECTIONS.CreditCard:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <QuickActionsSection />
          </Suspense>
        );
      case SECTIONS.SETTINGS:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <SettingsSection />
          </Suspense>
        );
      case SECTIONS.SEARCH:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <SearchSection />
          </Suspense>
        );
      case SECTIONS.PROFILE_SETTINGS:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <UserSettings user={user} />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <HomeSection {...sectionProps} />
          </Suspense>
        );
    }
  }, [activeSection, sectionProps, user]);

  if (loading || userLoading || !user) {
    return (
      <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-neutral-400 animate-spin fill-white"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-1">
              <span className="text-2xl font-normal tracking-tight">KAPR<span className="text-purple-600 font-normal">Y</span></span>
              <span className="text-2xl font-black tracking-tight text-white">.DEV</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {MAIN_MENU.map(({ icon: Icon, label, section }) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${activeSection === section
                      ? "text-white bg-white/10"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* User & Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white">
                <Bell className="w-5 h-5" />
              </button>

              {/* User Profile - WITH SAFE AVATAR URL */}
              <div className="relative">
                <button
                  onClick={() => setActiveSection(SECTIONS.PROFILE_SETTINGS)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Image
                    src={avatarUrl}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-lg object-cover border border-white/20"
                    key={avatarUrl}
                    unoptimized
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">
                      {user?.fullName || "User"}
                    </p>
                    <p className="text-xs text-white/50">
                      {user?.email || ""}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                  <div className={`w-full h-0.5 bg-white/60 transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                  <div className={`w-full h-0.5 bg-white/60 transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
                  <div className={`w-full h-0.5 bg-white/60 transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4">
              <div className="space-y-2">
                {MAIN_MENU.map(({ icon: Icon, label, section }) => (
                  <button
                    key={section}
                    onClick={() => {
                      setActiveSection(section);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeSection === section
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 min-h-screen z-10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto p-8">
          <Breadcrumb
            items={[
              "Dashboard",
              activeSection.charAt(0).toUpperCase() + activeSection.slice(1),
            ]}
          />
          <div className="mt-6">
            {renderMainContent()}
          </div>
        </div>
      </main>
    </div>
  );
}