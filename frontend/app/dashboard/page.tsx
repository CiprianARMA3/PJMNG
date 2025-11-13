"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";
import {
  Home,
  Mail,
  Zap,
  BarChart,
  Settings,
  Bell,
  Search,
  Grid,
  HelpCircle,
  LogOut,
} from "lucide-react";

const supabase = createClient();
const DEFAULT_AVATAR = "/default-avatar.png";

export default function DashboardPage() {
  const router = useRouter();
  const { user: sessionUser, loading } = useRequireAuth();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!sessionUser) return;
      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, surname, metadata")
        .eq("id", sessionUser.id)
        .single();

      if (!error && data) {
        setUser({
          ...data,
          avatar_url: data.metadata?.avatar_url || DEFAULT_AVATAR,
        });
      }
    };
    fetchUser();
  }, [sessionUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (loading || !user)
    return <div className="p-6 text-gray-600">Loading...</div>;

  return (
    <div className="relative flex min-h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* === SIDEBAR === */}
      <div className="absolute inset-[-200px] blur-[50px] pointer-events-none z-1" style={{ background: "linear-gradient(90deg, rgba(155,119,255,0.35) 0%, rgba(255,255,255,0.6) 20%, rgba(255,255,255,1) 100%)", }} ></div>
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center justify-between py-4 z-2  ">
        {/* Top icons */}
        <div className="flex flex-col items-center space-y-6">
          <button className="p-2 rounded-xl hover:bg-gray-100 transition">
            <Home className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 rounded-xl hover:bg-gray-100 transition">
            <Mail className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 rounded-xl hover:bg-gray-100 transition">
            <Zap className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 rounded-xl hover:bg-gray-100 transition">
            <BarChart className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 rounded-xl hover:bg-gray-100 transition">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 rounded-xl hover:bg-gray-100 transition">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 rounded-xl hover:bg-gray-100 transition">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        

        {/* Bottom icons */}
        <div className="flex flex-col items-center space-y-4">
          <button className="p-2 rounded-xl hover:bg-gray-100 transition">
            <Grid className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 rounded-xl hover:bg-gray-100 transition">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-gray-100 transition">
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>

          {/* Avatar */}
          <button
            onClick={() => router.push("/profile")}
            className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 hover:ring-2 hover:ring-indigo-400 transition"
          >
            <img
              src={user.avatar_url}
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <main className="flex-1 relative p-10 z-4 ml-[150px]">
        <h1 className="text-3xl font-semibold mb-2 text-gray-900 z-5">
          Welcome back {user.name || "there"}!
        </h1>
        <p className="text-gray-500 mb-8">Here are your projects:</p>
        {/* Add your project components here */}
      </main>
    </div>
  );
}
