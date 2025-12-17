'use client';

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../../components/menu";
import { PhoneNumberDisplay } from "../collaborators/components/identifyPhoneNumberProvenience";
import {
    User,
    LogOut,
    Cpu,
    MessageSquare,
    Zap,
    Clock,
    Copy,
    Check,
    Activity,
    ShieldAlert,
    Calendar,
    Hash,
    Settings,
    Key,
    Code,
    GitFork,
    Map,
    Database,
    DollarSign,
    Phone,
} from "lucide-react";

// --- TYPES ---
type UserStats = {
    joined_at: string;
    total_tokens: number;
    days_active: number;
    favorite_model: string;
    estimated_cost: number;
    total_interactions: number;
    total_code_reviews: number;
    total_roadmap_chats: number;
    total_sql_chats: number;
};

// Define types for role info
type RoleInfo = {
    role: string;
    permissions: string[];
};

const calculateEstimatedCost = (tokens: number): number => {
    const costPerToken = 0.00002;
    return tokens * costPerToken;
};


export default function UserSettingsPage() {
    const supabase = createClient();
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    // --- STATE ---
    const [user, setUser] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState<UserStats | null>({
        joined_at: new Date().toISOString(),
        total_tokens: 0,
        days_active: 0,
        favorite_model: "N/A",
        estimated_cost: 0,
        total_interactions: 0,
        total_code_reviews: 0,
        total_roadmap_chats: 0,
        total_sql_chats: 0,
    });
    const [userRole, setUserRole] = useState<string>('N/A');
    const [userPermissions, setUserPermissions] = useState<string[]>([]);

    const [copiedIdValue, setCopiedIdValue] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [leaving, setLeaving] = useState(false);

    // Tabs
    const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');


    // --- DATA FETCHING ---
    useEffect(() => {
        async function load() {
            // 1. Auth & User
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !authUser) { router.push("/auth/login"); return; }

            const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single();

            const finalUser = {
                ...authUser,
                phone_number: profile?.phone_number || authUser.phone || "Not provided",
                user_metadata: {
                    ...authUser.user_metadata,
                    full_name: profile?.name
                        ? `${profile.name} ${profile.surname || ""}`.trim()
                        : authUser.user_metadata?.full_name || "User",
                    avatar_url: profile?.metadata?.avatar_url || authUser.user_metadata?.avatar_url
                }
            };
            setUser(finalUser);

            // 2. Project
            const { data: proj } = await supabase.from("projects").select("*").eq("id", projectId).single();
            setProject(proj);

            // 3. User Role/Permissions (UPDATED LOGIC)
            const { data: projectUser } = await supabase
                .from("project_users")
                .select("role_info")
                .eq("project_id", projectId)
                .eq("user_id", authUser.id)
                .single();

            if (projectUser && projectUser.role_info) {
                try {
                    // Handle potential stringified JSON vs Object
                    let parsedInfo = projectUser.role_info;

                    if (typeof parsedInfo === 'string') {
                        try {
                            parsedInfo = JSON.parse(parsedInfo);
                        } catch {
                            // Fallback: value is a simple string like "Manager"
                            setUserRole(parsedInfo);
                            setUserPermissions([]);
                            return;
                        }
                    }

                    // Extract data safely
                    if (typeof parsedInfo === 'object' && parsedInfo !== null) {
                        const info = parsedInfo as RoleInfo;
                        setUserRole(info.role || 'Member');
                        setUserPermissions(info.permissions || []);
                    } else {
                        setUserRole('Member');
                        setUserPermissions([]);
                    }
                } catch (e) {
                    console.error("Error parsing role info:", e);
                    setUserRole('Member');
                    setUserPermissions([]);
                }
            } else {
                setUserRole('Unknown');
                setUserPermissions([]);
            }

            // 4. Stats Calculation

            // Core AI Chat Sessions (ai_chats)
            const { count: chatCount } = await supabase
                .from("ai_chats")
                .select("*", { count: 'exact', head: true })
                .eq("project_id", projectId)
                .eq("user_id", authUser.id);

            // AI Interactions / Total Messages (ai_messages)
            const { data: userChatsData } = await supabase
                .from("ai_chats")
                .select("id")
                .eq("project_id", projectId)
                .eq("user_id", authUser.id);

            const chatIds = userChatsData?.map(chat => chat.id) || [];

            let totalMessagesCount = 0;
            if (chatIds.length > 0) {
                const { count: messagesCount } = await supabase
                    .from("ai_messages")
                    .select("*", { count: 'exact', head: true })
                    .in("chat_id", chatIds);
                totalMessagesCount = messagesCount || 0;
            }

            // Code Review Sessions
            const { count: codeReviewCount } = await supabase
                .from("ai_code_review_chats")
                .select("*", { count: 'exact', head: true })
                .eq("project_id", projectId)
                .eq("user_id", authUser.id);

            // Roadmap Chats
            const { count: roadmapChatCount } = await supabase
                .from("ai_roadmap_chats")
                .select("*", { count: 'exact', head: true })
                .eq("project_id", projectId)
                .eq("user_id", authUser.id);

            // SQL Chats
            const { count: sqlChatCount } = await supabase
                .from("ai_sql_chats")
                .select("*", { count: 'exact', head: true })
                .eq("project_id", projectId)
                .eq("user_id", authUser.id);


            // Token Usage and Model
            const { data: logs } = await supabase
                .from("token_usage_logs")
                .select("tokens_used, model, created_at")
                .eq("project_id", projectId)
                .eq("user_id", authUser.id)
                .order("created_at", { ascending: true });

            let totalTokens = 0;
            let firstLogDate = new Date();
            const modelCounts: Record<string, number> = {};

            if (logs && logs.length > 0) {
                firstLogDate = new Date(logs[0].created_at);
                logs.forEach(log => {
                    totalTokens += log.tokens_used;
                    modelCounts[log.model] = (modelCounts[log.model] || 0) + 1;
                });
            } else {
                firstLogDate = new Date();
            }

            const favModel = Object.keys(modelCounts).reduce((a, b) => (modelCounts[a] || 0) > (modelCounts[b] || 0) ? a : b, "N/A");
            const diffTime = Math.abs(new Date().getTime() - firstLogDate.getTime());
            const daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const estimatedCost = calculateEstimatedCost(totalTokens);

            setStats({
                joined_at: firstLogDate.toISOString(),
                total_tokens: totalTokens,
                days_active: daysActive,
                favorite_model: favModel,
                estimated_cost: estimatedCost,
                total_interactions: totalMessagesCount,
                total_code_reviews: codeReviewCount || 0,
                total_roadmap_chats: roadmapChatCount || 0,
                total_sql_chats: sqlChatCount || 0,
            });

            setLoading(false);
        }
        load();
    }, [projectId]);

    // --- ACTIONS ---
    const handleLeaveProject = async () => {
        if (!user || !projectId) return;
        if (!confirm("Are you sure you want to leave this project? This action cannot be undone.")) return;

        setLeaving(true);
        try {
            const { error } = await supabase
                .from("project_users")
                .delete()
                .eq("project_id", projectId)
                .eq("user_id", user.id);

            if (error) throw error;
            router.push("/dashboard");
        } catch (e) {
            console.error("Error leaving project:", e);
            alert("Could not leave project. You might be the sole owner or a database error occurred.");
        } finally {
            setLeaving(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedIdValue(text);
        setTimeout(() => setCopiedIdValue(null), 2000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getCopyIcon = (text: string) => {
        return copiedIdValue === text ? <Check size={16} /> : <Copy size={16} />;
    }

    if (loading) {
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
        <div className="h-screen bg-[#0a0a0a] light:bg-gray-50 text-zinc-100 light:text-black flex overflow-hidden font-sans selection:bg-white/20">

            {/* SIDEBAR */}
            <Menu project={project} user={user} />

            <main className="flex-1 flex flex-col h-full ml-64 relative bg-[#0e0e10] light:bg-white">

                {/* HEADER */}
                <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 light:border-gray-200 flex items-center justify-between bg-[#0a0a0a]/50 light:bg-white/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold tracking-tight">Settings <span className="text-white/30 light:text-black/30 text-lg font-light">Panel</span></h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 light:text-gray-600 bg-white/5 light:bg-gray-200 px-2 py-1 rounded border border-white/5 light:border-gray-300">
                            Read Only
                        </span>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-scroll custom-scrollbar-hidden mr-175">
                    <div className="w-300 px-6 py-10">

                        <div className="flex flex-col lg:flex-row min-h-[600px]">

                            {/* LEFT NAV */}
                            <nav className="w-full lg:w-72 flex-shrink-0 space-y-1 lg:border-r border-white/5 light:border-gray-200 lg:pr-8 mb-10 lg:mb-0">
                                <div className="pb-4 mb-4 border-b border-white/5 light:border-gray-200 lg:border-none">
                                    <p className="px-3 text-xs font-semibold text-zinc-500 light:text-gray-500 uppercase tracking-widest">Account</p>
                                </div>

                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                                ${activeTab === 'profile'
                                            ? 'bg-zinc-100 text-black light:bg-gray-200 light:text-black shadow-lg shadow-white/5'
                                            : 'text-zinc-400 light:text-gray-500 hover:text-zinc-100 light:hover:text-black hover:bg-white/5 light:hover:bg-gray-100'
                                        }`}
                                >
                                    <User size={16} />
                                    Public Profile
                                </button>

                                <button
                                    onClick={() => setActiveTab('account')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                                ${activeTab === 'account'
                                            ? 'bg-zinc-100 text-black light:bg-gray-200 light:text-black shadow-lg shadow-white/5'
                                            : 'text-zinc-400 light:text-gray-500 hover:text-zinc-100 light:hover:text-black hover:bg-white/5 light:hover:bg-gray-100'
                                        }`}
                                >
                                    <Activity size={16} />
                                    Project Stats
                                </button>
                            </nav>

                            {/* RIGHT CONTENT */}
                            <div className="flex-1 lg:pl-12 ">
                                <div className="max-w-4xl mx-auto space-y-10">

                                    {/* --- TAB: PROFILE (UNCHANGED) --- */}
                                    {activeTab === 'profile' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">

                                            {/* Section Header */}
                                            <div>
                                                <h2 className="text-lg font-semibold text-white light:text-black">Public Profile</h2>
                                                <p className="text-sm text-zinc-500 light:text-gray-500 mt-1">Your identity within the <b>{project?.name} </b>workspace.</p>
                                            </div>

                                            {/* PRIMARY INPUTS (GRIDDED) */}
                                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                                                {/* Inputs */}
                                                <div className="xl:col-span-2 space-y-5">

                                                    {/* Display Name */}
                                                    <div className="group">
                                                        <label className="block text-xs font-medium text-zinc-400 light:text-gray-600 mb-2 uppercase tracking-wide">Display Name</label>
                                                        <div className="flex items-center bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg px-3 py-2.5 group-hover:border-white/20 light:group-hover:border-gray-300 transition-colors">
                                                            <input
                                                                type="text"
                                                                value={user?.user_metadata?.full_name}
                                                                disabled
                                                                className="w-full bg-transparent text-sm text-zinc-400 light:text-gray-600 disabled:cursor-not-allowed focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Email Address */}
                                                    <div className="group">
                                                        <label className="block text-xs font-medium text-zinc-400 light:text-gray-600 mb-2 uppercase tracking-wide">Email Address</label>
                                                        <div className="flex items-center bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg px-3 py-2.5 group-hover:border-white/20 light:group-hover:border-gray-300 transition-colors">
                                                            <input
                                                                type="text"
                                                                value={user?.email}
                                                                disabled
                                                                className="w-full bg-transparent text-sm text-zinc-400 light:text-gray-600 disabled:cursor-not-allowed focus:outline-none"
                                                            />
                                                        </div>

                                                    </div>
                                                    <div className="group">
                                                        <label className="block text-xs font-medium text-zinc-400 light:text-gray-600 mb-2 uppercase tracking-wide flex items-center gap-2">
                                                            <Phone size={14} />
                                                            Phone Number
                                                        </label>
                                                        <div className="flex items-center bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg px-3 py-2.5 group-hover:border-white/20 light:group-hover:border-gray-300 transition-colors">
                                                            <PhoneNumberDisplay phoneNumber={user?.phone_number} />
                                                        </div>
                                                        <p className="mt-1 text-[10px] text-zinc-600 light:text-gray-400">Phone number associated with your account</p>
                                                    </div>

                                                    {/* User UUID */}
                                                    <div className="group">
                                                        <label className="block text-xs font-medium text-zinc-400 light:text-gray-600 mb-2 uppercase tracking-wide">User UUID</label>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 flex items-center bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg px-3 py-2.5 font-mono text-xs text-zinc-500 light:text-gray-500 select-all group-hover:border-white/20 light:group-hover:border-gray-300 transition-colors">
                                                                {user?.id}
                                                            </div>
                                                            <button
                                                                onClick={() => copyToClipboard(user?.id)}
                                                                className="p-2.5 bg-white/5 light:bg-gray-100 border border-white/10 light:border-gray-200 rounded-lg text-zinc-400 light:text-gray-500 hover:text-white light:hover:text-black hover:bg-white/10 light:hover:bg-gray-200 transition-colors active:scale-95"
                                                            >
                                                                {getCopyIcon(user?.id)}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Project UUID */}
                                                    <div className="group">
                                                        <label className="block text-xs font-medium text-zinc-400 light:text-gray-600 mb-2 uppercase tracking-wide">Project UUID</label>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 flex items-center bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg px-3 py-2.5 font-mono text-xs text-zinc-500 light:text-gray-500 select-all group-hover:border-white/20 light:group-hover:border-gray-300 transition-colors">
                                                                {projectId}
                                                            </div>
                                                            <button
                                                                onClick={() => copyToClipboard(projectId)}
                                                                className="p-2.5 bg-white/5 light:bg-gray-100 border border-white/10 light:border-gray-200 rounded-lg text-zinc-400 light:text-gray-500 hover:text-white light:hover:text-black hover:bg-white/10 light:hover:bg-gray-200 transition-colors active:scale-95"
                                                            >
                                                                {getCopyIcon(projectId)}
                                                            </button>
                                                        </div>
                                                    </div>

                                                </div>

                                                {/* Avatar Card */}
                                                <div className="xl:col-span-1 flex justify-center xl:justify-end">
                                                    <div className="relative group">
                                                        <div className="absolute inset-0 bg-white/5 light:bg-gray-200 rounded-full blur-2xl transform group-hover:scale-110 transition-transform duration-700 opacity-20"></div>
                                                        <img
                                                            src={user?.user_metadata?.avatar_url || `https://avatar.vercel.sh/${user?.id}`}
                                                            alt="Avatar"
                                                            className="relative w-40 h-40 rounded-full border border-white/10 light:border-gray-200 object-cover shadow-2xl bg-zinc-900 light:bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* --- ROLE AND PERMISSIONS (FULL WIDTH) --- */}
                                            <div className="pt-8 mt-8 border-t border-white/5 light:border-gray-200">
                                                <h2 className="text-lg font-semibold text-white light:text-black mb-4 flex items-center gap-2">
                                                    Role and Access
                                                </h2>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                                    {/* Role Box */}
                                                    <div className="group md:col-span-1">
                                                        <label className="block text-xs font-medium text-zinc-400 light:text-gray-600 mb-2 uppercase tracking-wide">Project Role</label>
                                                        <div className="flex items-center bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg px-3 py-2.5 transition-colors h-11">
                                                            <Settings size={16} className="text-zinc-500 light:text-gray-400 mr-2 flex-shrink-0" />
                                                            <span className="w-full text-sm font-semibold text-white light:text-black disabled:cursor-not-allowed truncate">
                                                                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Permissions List */}
                                                    <div className="group md:col-span-2">
                                                        <label className="block text-xs font-medium text-zinc-400 light:text-gray-600 mb-2 uppercase tracking-wide">Permissions Granted</label>
                                                        <div className="bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg p-3 space-y-2">
                                                            {userPermissions.length > 0 ? (
                                                                userPermissions.map((permission, index) => (
                                                                    <div key={index} className="flex items-center text-sm text-zinc-300 light:text-gray-700">
                                                                        <Check size={14} className="text-zinc-400 light:text-gray-400 mr-2 flex-shrink-0" />
                                                                        <span className="font-mono text-xs">{permission.replace(/_/g, ' ')}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-xs text-zinc-500 light:text-gray-500 italic">No explicit permissions found for this role. Access may be read-only.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    )}

                                    {/* --- TAB: ACCOUNT STATS (IMPROVED) --- */}
                                    {activeTab === 'account' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">

                                            {/* Header */}
                                            <div>
                                                <h2 className="text-lg font-semibold text-white light:text-black">Project Statistics</h2>
                                                <p className="text-sm text-zinc-500 light:text-gray-500 mt-1">Analytics derived from your interaction logs.</p>
                                            </div>

                                            {/* PRIMARY STATS (2-COLUMN GRID) */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                                {/* Stat Card 1: Time & Activity */}
                                                <div className="p-6 rounded-xl border border-white/5 light:border-gray-200 bg-white/[0.02] light:bg-white hover:bg-white/[0.04] light:hover:bg-gray-50 transition-colors group space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-3 rounded-xl bg-zinc-900 light:bg-gray-100 border border-white/5 light:border-gray-200 text-zinc-400 light:text-gray-500 group-hover:text-white light:group-hover:text-black transition-colors">
                                                                <Calendar size={24} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-zinc-500 light:text-gray-500 uppercase tracking-widest">Project Activity</p>
                                                                <h3 className="text-4xl font-bold text-white light:text-black mt-0.5">{stats?.days_active} <span className="text-xl font-normal text-zinc-600 light:text-gray-400">days</span></h3>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="pt-4 border-t border-white/5 light:border-gray-200 flex justify-between items-center text-sm text-zinc-500 light:text-gray-500">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={16} />
                                                            Joined
                                                        </div>
                                                        <span className="font-mono text-zinc-300 light:text-gray-700">{formatDate(stats?.joined_at || new Date().toISOString())}</span>
                                                    </div>
                                                </div>

                                                {/* Stat Card 2: Token Usage & Cost */}
                                                <div className="p-6 rounded-xl border border-white/5 light:border-gray-200 bg-white/[0.02] light:bg-white hover:bg-white/[0.04] light:hover:bg-gray-50 transition-colors group space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-3 rounded-xl bg-zinc-900 light:bg-gray-100 border border-white/5 light:border-gray-200 text-zinc-400 light:text-gray-500 group-hover:text-white light:group-hover:text-black transition-colors">
                                                                <Zap size={24} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-zinc-500 light:text-gray-500 uppercase tracking-widest">Total Tokens Used</p>
                                                                <h3 className="text-4xl font-bold text-white light:text-black mt-0.5">{(stats?.total_tokens || 0).toLocaleString()}</h3>
                                                            </div>
                                                        </div>
                                                        {/* <div className="text-right">
                                                    <p className="text-xs text-zinc-500">Est. Cost</p>
                                                    <p className="text-lg font-semibold text-white flex items-center justify-end">
                                                        <DollarSign size={16} className="text-green-500 mr-1"/>
                                                        {stats?.estimated_cost.toFixed(4)}
                                                    </p>
                                                </div> */}
                                                    </div>
                                                    <div className="pt-4 border-t border-white/5 light:border-gray-200 flex justify-between items-center text-sm text-zinc-500 light:text-gray-500">
                                                        <div className="flex items-center gap-2">
                                                            <Cpu size={16} />
                                                            Most Used Model
                                                        </div>
                                                        <span className="font-mono text-zinc-300 light:text-gray-700 capitalize">
                                                            {stats?.favorite_model.replace(/-/g, ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SECONDARY STATS: Specialized Usage (4-COLUMN GRID) */}
                                            <div className="pt-6">
                                                <h3 className="text-md font-semibold text-zinc-300 light:text-gray-700 mb-4">Specialized AI Usage</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                                    {/* Stat Card 3: Total Messages (formerly AI Interactions) */}
                                                    <div className="p-4 rounded-xl border border-white/5 light:border-gray-200 bg-white/[0.02] light:bg-white hover:bg-white/[0.04] light:hover:bg-gray-50 transition-colors group space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <MessageSquare size={20} className="text-zinc-400 light:text-gray-500 group-hover:text-white light:group-hover:text-black" />
                                                            <h3 className="text-2xl font-bold text-white light:text-black">{(stats?.total_interactions || 0).toLocaleString()}</h3>
                                                        </div>
                                                        <p className="text-xs font-medium text-zinc-500 light:text-gray-500 uppercase tracking-widest">Total Messages</p>
                                                        <p className="text-xs text-zinc-500 light:text-gray-500">Total prompts & responses</p>
                                                    </div>

                                                    {/* Stat Card 4: Code Reviews */}
                                                    <div className="p-4 rounded-xl border border-white/5 light:border-gray-200 bg-white/[0.02] light:bg-white hover:bg-white/[0.04] light:hover:bg-gray-50 transition-colors group space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Code size={20} className="text-zinc-400 light:text-gray-500 group-hover:text-white light:group-hover:text-black" />
                                                            <h3 className="text-2xl font-bold text-white light:text-black">{stats?.total_code_reviews}</h3>
                                                        </div>
                                                        <p className="text-xs font-medium text-zinc-500 light:text-gray-500 uppercase tracking-widest">Code Reviews</p>
                                                        <p className="text-xs text-zinc-500 light:text-gray-500">Total review sessions</p>
                                                    </div>

                                                    {/* Stat Card 5: Roadmap Sessions */}
                                                    <div className="p-4 rounded-xl border border-white/5 light:border-gray-200 bg-white/[0.02] light:bg-white hover:bg-white/[0.04] light:hover:bg-gray-50 transition-colors group space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Map size={20} className="text-zinc-400 light:text-gray-500 group-hover:text-white light:group-hover:text-black" />
                                                            <h3 className="text-2xl font-bold text-white light:text-black">{stats?.total_roadmap_chats}</h3>
                                                        </div>
                                                        <p className="text-xs font-medium text-zinc-500 light:text-gray-500 uppercase tracking-widest">Roadmap Chats</p>
                                                        <p className="text-xs text-zinc-500 light:text-gray-500">Planning discussions</p>
                                                    </div>

                                                    {/* Stat Card 6: SQL Sessions */}
                                                    <div className="p-4 rounded-xl border border-white/5 light:border-gray-200 bg-white/[0.02] light:bg-white hover:bg-white/[0.04] light:hover:bg-gray-50 transition-colors group space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Database size={20} className="text-zinc-400 light:text-gray-500 group-hover:text-white light:group-hover:text-black" />
                                                            <h3 className="text-2xl font-bold text-white light:text-black">{stats?.total_sql_chats}</h3>
                                                        </div>
                                                        <p className="text-xs font-medium text-zinc-500 light:text-gray-500 uppercase tracking-widest">SQL Sessions</p>
                                                        <p className="text-xs text-zinc-500 light:text-gray-500">Database query generation</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- DANGER ZONE (GLOBAL) --- */}
                                    <div className="pt-10 mt-10 border-t border-white/5 light:border-gray-200">
                                        <h2 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">
                                            <ShieldAlert size={16} /> Irreversible Action
                                        </h2>
                                        <div className="border border-red-500/20 rounded-lg bg-red-500/[0.03] overflow-hidden">
                                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div>
                                                    <h3 className="text-sm font-medium text-zinc-200 light:text-black">Leave this project</h3>
                                                    <p className="text-xs text-zinc-500 light:text-gray-500 mt-1.5 max-w-lg leading-relaxed">
                                                        Revokes your access to all resources, chat history, and shared files within the <strong className="text-zinc-300 light:text-gray-700">{project?.name}</strong> workspace immediately.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={handleLeaveProject}
                                                    disabled={leaving}
                                                    className="flex-shrink-0 bg-transparent hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 hover:border-red-500 px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2"
                                                >
                                                    {leaving ? "Processing..." : <><LogOut size={14} /> Leave Project</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Updated global CSS to hide the scrollbar */}
            <style jsx global>{`
            .custom-scrollbar-hidden::-webkit-scrollbar {
                width: 0 !important; /* For Chrome, Safari, and Opera */
                height: 0 !important;
            }
            .custom-scrollbar-hidden {
                -ms-overflow-style: none; /* For Internet Explorer and Edge */
                scrollbar-width: none; /* For Firefox */
            }
        `}</style>
        </div>

    );
}