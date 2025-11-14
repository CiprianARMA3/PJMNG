"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";
import HomeSection from "./components/dashboard-sections/HomeSection";
import MailSection from "./components/dashboard-sections/MailSection";
import QuickActionsSection from "./components/dashboard-sections/Subscriptions";
import Subscriptions from "./components/dashboard-sections/AnalyticsSection";
import SettingsSection from "./components/dashboard-sections/SettingsSection";
import SearchSection from "./components/dashboard-sections/SearchSection";
import UserSettings from "./components/profile-settings/Settings";


import {
  Home,
  Mail,
  CreditCard,
  BarChart,
  Settings,
  Bell,
  Search,
  Grid,
  HelpCircle,
  LogOut,
} from "lucide-react";
import Breadcrumb from "./components/Breadcrumb";

const supabase = createClient();
const DEFAULT_AVATAR = "/default-avatar.png";

// Define the sections
const SECTIONS = {
  HOME: "Home Page",
  MAIL: "Messages",
  CreditCard: "Subscriptions",
  ANALYTICS: "analytics",
  SETTINGS: "settings",
  SEARCH: "search",
  PROFILE_SETTINGS: "profile-settings",
};

export default function DashboardPage() {
  const router = useRouter();
  const { user: sessionUser, loading } = useRequireAuth();
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState(SECTIONS.HOME);
  const [userLoading, setUserLoading] = useState(true);

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
        // Set a default user object if there's an error
        setUser({
          fullName: 'User',
          avatar_url: DEFAULT_AVATAR,
        });
      } else if (data) {
        const avatarUrl = data.metadata?.avatar_url || DEFAULT_AVATAR;
        setUser({
          ...data,
          avatar_url: avatarUrl ? `${avatarUrl}?t=${Date.now()}` : DEFAULT_AVATAR, // Add cache busting
          fullName: `${data.name || ''} ${data.surname || ''}`.trim() || 'User',
        });
      }
    } catch (error) {
      console.error("Error in fetchUser:", error);
      setUser({
        fullName: 'User',
        avatar_url: DEFAULT_AVATAR,
      });
    } finally {
      setUserLoading(false);
    }
  };
  
  fetchUser();
}, [sessionUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // Render content based on active section
  const renderMainContent = () => {
    switch (activeSection) {
      case SECTIONS.HOME:
        return <HomeSection userName={user?.fullName || 'User'} />;

      case SECTIONS.MAIL:
        return <MailSection />;

      case SECTIONS.CreditCard:
        return <QuickActionsSection />;

      case SECTIONS.ANALYTICS:
        return <Subscriptions />;

      case SECTIONS.SETTINGS:
        return <SettingsSection />;

      case SECTIONS.SEARCH:
        return <SearchSection />;

      case SECTIONS.PROFILE_SETTINGS:
        return <UserSettings user={user} />;

      default:
        return <HomeSection userName={user?.fullName || 'User'} />;
    }
  };

  if (loading || !user)
    return (
      <div
        role="status"
        className="flex justify-center items-center h-screen"
      >
        <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-neutral-tertiary animate-spin fill-pink"
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

  return (
    <div className="relative flex min-h-screen bg-[#0f0f10] text-gray-200 overflow-hidden">
      {/* === GLOW BACKGROUND === */}
      <div
        className="
          fixed 
          top-0 left-[-30px] 
          w-[200px] h-[100%] 
          bg-gradient-to-br 
          from-purple-600/20 
          via-purple-500/10 
          to-transparent
          blur-3xl 
          pointer-events-none 
          z-40
        "
      ></div>

      {/* === SIDEBAR === */}
      <aside className="w-16 bg-[#141417] border-r border-[#141417] flex flex-col items-center justify-between py-4 fixed top-0 left-0 h-screen z-50">        {/* Top icons */}
        <div className="flex flex-col items-center space-y-6">
          {[
            { icon: Home, section: SECTIONS.HOME },
            { icon: Mail, section: SECTIONS.MAIL },
            { icon: CreditCard, section: SECTIONS.CreditCard },
            { icon: BarChart, section: SECTIONS.ANALYTICS },
          ].map(({ icon: Icon, section }, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(section)}
              className={`p-2 rounded-xl transition ${
                activeSection === section
                  ? "text-white"
                  : "hover:bg-purple-900 hover:text-white text-gray-400"
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Bottom icons */}
        <div className="flex flex-col items-center space-y-4">
          <button className="p-2 rounded-xl hover:bg-purple-900 hover:text-white transition text-gray-400">
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-purple-900 hover:text-white transition text-gray-400"
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <button
            onClick={() => setActiveSection(SECTIONS.PROFILE_SETTINGS)}
            className="w-10 h-10 rounded-full overflow-hidden border border-gray-700 hover:ring-2 hover:ring-indigo-500 transition"
          >
            <img
              src={`${user.avatar_url}?t=${Date.now()}`} // Add cache busting here
              alt="User Avatar"
              className="w-full h-full object-cover"
              key={user.avatar_url} // Force re-render when avatar changes
            />
          </button>
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <main className="flex-1 relative p-10 z-4 ml-[150px]">
        <Breadcrumb
          items={[
            "Dashboard",
            activeSection.charAt(0).toUpperCase() +
              activeSection.slice(1),
          ]}
        />
        {renderMainContent()}
      </main>
    </div>
  );
}