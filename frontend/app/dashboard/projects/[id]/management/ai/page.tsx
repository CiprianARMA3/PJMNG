"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../../components/menu"; 
import React from "react";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';

import { 
  Search, 
  RefreshCw, 
  Filter, 
  ChevronDown, 
  Calendar,
  Zap,
  Brain,
  TrendingUp,
  CreditCard,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  Sparkles,
  Database,
  Plus,
  Wallet,
  History,
  X,
  CheckCircle2
} from "lucide-react";

// --- TYPES ---
type TokenLog = {
  id: string;
  created_at: string;
  tokens_used: number;
  model: string;
  project_id: string;
  user_id: string | null;
};

type UserMapData = {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
};

type TokenPack = {
  remaining_tokens: {
    [key: string]: number | undefined; 
  };
};

type ChartDataPoint = {
  day: string;
  tokens: number;
  fullDate: string;
};

// --- HELPER: Format Model Name ---
const formatModelName = (key: string) => {
  if (!key) return "Unknown Model";
  return key
    .replace(/-/g, ' ')
    .replace('gemini', 'Gemini')
    .replace('pro', 'Pro')
    .replace('flash', 'Flash')
    .replace('preview', 'Preview');
};

// --- COMPONENT: Simple Avatar ---
const UserAvatar = ({ name, url, size = "w-6 h-6" }: { name: string, url: string | null, size?: string }) => {
    return (
        <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${size}`}>
            <img
                src={url || `https://avatar.vercel.sh/${name}`}
                alt={name}
                className="w-full h-full rounded-full object-cover border border-white/10 shadow-sm bg-zinc-900"
            />
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function AIUsagePage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  // Modal State
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [refillAmount, setRefillAmount] = useState<number>(100000);
  const [isRefilling, setIsRefilling] = useState(false);

  // Data State
  const [logs, setLogs] = useState<TokenLog[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserMapData>>({});
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [tokenPack, setTokenPack] = useState<TokenPack['remaining_tokens']>({});
  const [totalCredits, setTotalCredits] = useState<number>(0);

  // Trend State
  const [usageTrend, setUsageTrend] = useState<number>(0); // Percentage
  const [prevWeekTotal, setPrevWeekTotal] = useState<number>(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [modelFilter, setModelFilter] = useState<string>("All Models");
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  const MODELS = [
    { id: "gemini-3-pro-preview", name: "Gemini 3 Pro", icon: Sparkles, description: "Reasoning & Coding" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", icon: Cpu, description: "Complex Tasks" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", icon: Zap, description: "Fast & Efficient" },
  ];

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setRefreshing(true);
    try {
        const id = projectId;
        if (!id) return;

        // Date Calculations
        const now = new Date();
        const dayOfWeek = now.getDay(); 
        const diffToMonday = (dayOfWeek + 6) % 7;
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const startOfPrevWeek = new Date(startOfWeek);
        startOfPrevWeek.setDate(startOfWeek.getDate() - 7);
        const endOfPrevWeek = new Date(endOfWeek);
        endOfPrevWeek.setDate(endOfWeek.getDate() - 7);

        // Fetch Data
        const [logsResponse, packResponse] = await Promise.all([
            supabase.from('token_usage_logs').select('*').eq('project_id', id).gte('created_at', startOfPrevWeek.toISOString()).order('created_at', { ascending: false }),
            supabase.from('token_packs').select('remaining_tokens').eq('project_id', id).maybeSingle() 
        ]);

        if (logsResponse.error) throw logsResponse.error;
        
        const rawLogs = logsResponse.data || [];
        setLogs(rawLogs);

        // Process Users
        const userIds = [...new Set(rawLogs.map(l => l.user_id).filter(Boolean))] as string[];
        if (userIds.length > 0) {
            const { data: usersData } = await supabase.from("users").select("id, email, name, surname, metadata").in("id", userIds);
            const mapping: Record<string, UserMapData> = {};
            (usersData || []).forEach(u => {
                mapping[u.id] = {
                    id: u.id,
                    email: u.email || "",
                    full_name: `${u.name || ""} ${u.surname || ""}`.trim() || "Unknown User",
                    avatar_url: (u.metadata as any)?.avatar_url || null
                };
            });
            setUserMap(mapping);
        }

        // Stats & Chart
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const groupedCurrentWeek = weekDays.map(day => ({ day, tokens: 0, fullDate: '' }));
        let currentWeekSum = 0;
        let prevWeekSum = 0;

        rawLogs.forEach((log) => {
            const logDate = new Date(log.created_at);
            const tokens = Number(log.tokens_used);

            if (logDate >= startOfWeek && logDate <= endOfWeek) {
                const dayIndex = (logDate.getDay() + 6) % 7;
                if (groupedCurrentWeek[dayIndex]) {
                    groupedCurrentWeek[dayIndex].tokens += tokens;
                    groupedCurrentWeek[dayIndex].fullDate = log.created_at;
                }
                currentWeekSum += tokens;
            } else if (logDate >= startOfPrevWeek && logDate <= endOfPrevWeek) {
                prevWeekSum += tokens;
            }
        });

        setChartData(groupedCurrentWeek);
        setPrevWeekTotal(prevWeekSum);

        if (prevWeekSum === 0) {
            setUsageTrend(currentWeekSum > 0 ? 100 : 0);
        } else {
            const diff = currentWeekSum - prevWeekSum;
            setUsageTrend(parseFloat(((diff / prevWeekSum) * 100).toFixed(1)));
        }

        const tokens = (packResponse.data?.remaining_tokens as TokenPack['remaining_tokens']) || {};
        setTokenPack(tokens);
        const calculatedRemaining = Object.values(tokens).reduce((acc: number, val) => acc + (val || 0), 0);
        setTotalCredits(calculatedRemaining);

    } catch (error) {
        console.error("Error fetching AI data:", error);
    } finally {
        setRefreshing(false);
    }
  };

  const handleRefill = async () => {
      setIsRefilling(true);
      try {
          // This is a simplified logic. In a real app, you'd likely pick WHICH model to refill
          // or have a specific "available_credits" pool. 
          // Here we just add to a 'general' pool or the first available key for demo purposes.
          
          const targetKey = "gemini-2.5-flash"; // Defaulting to one model for the demo
          const currentAmount = tokenPack[targetKey] || 0;
          const newAmount = currentAmount + refillAmount;
          
          const newPack = {
              ...tokenPack,
              [targetKey]: newAmount
          };

          const { error } = await supabase
            .from('token_packs')
            .upsert({ project_id: projectId, remaining_tokens: newPack });

          if (error) throw error;
          
          // Log the transaction (Optional - normally you'd have a transaction table)
          console.log("Tokens added");
          
          await fetchData();
          setIsRefillModalOpen(false);
      } catch (error) {
          console.error("Failed to add tokens", error);
      } finally {
          setIsRefilling(false);
      }
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) { router.push("/auth/login"); return; }
        
        const { data: userProfile } = await supabase.from("users").select("name, surname, metadata").eq("id", authUser.id).single();
        setUser({
            ...authUser,
            user_metadata: {
                ...authUser.user_metadata,
                full_name: userProfile?.name ? `${userProfile.name} ${userProfile.surname || ""}`.trim() : "User",
                avatar_url: userProfile?.metadata?.avatar_url
            }
        });

        const { data: projectData } = await supabase.from("projects").select("id, name, metadata").eq("id", projectId).single();
        if (projectData) {
             const iconUrl = projectData.metadata?.project_icon_url || projectData.metadata?.logo_url || null; 
             setProject({ ...projectData, icon_url: iconUrl });
        }

        await fetchData(); // Wait for data to prevent flash of empty state
        setLoading(false);
    };
    init();
  }, [projectId]);


  // --- COMPUTED STATS ---
  const filteredLogs = useMemo(() => {
      const lowerSearch = searchQuery.toLowerCase();
      return logs.filter(log => {
          const logUser = log.user_id ? userMap[log.user_id] : null;
          const userName = logUser?.full_name.toLowerCase() || "";
          
          const matchesSearch = log.model.toLowerCase().includes(lowerSearch) || 
                                log.id.toLowerCase().includes(lowerSearch) ||
                                userName.includes(lowerSearch);

          const matchesFilter = modelFilter === "All Models" || log.model === modelFilter;
          return matchesSearch && matchesFilter;
      });
  }, [logs, searchQuery, modelFilter, userMap]);

  const uniqueModels = useMemo(() => [...new Set(logs.map(l => l.model))], [logs]);
  const weeklyTotal = chartData.reduce((sum, day) => sum + day.tokens, 0);
  const dailyAverage = weeklyTotal / 7;

  // --- LOADING STATE ---
  // Using || refreshing ensures the user sees the same loading screen when updating data
 if (loading || refreshing) {
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
    <div className="h-screen bg-[#0a0a0a] text-zinc-100 flex overflow-hidden selection:bg-purple-500/30">
      
      {/* SIDEBAR */}
      <Menu project={project} user={user} />
      
      <main className="flex-1 ml-64 flex flex-col h-full bg-[#09090b] relative">
        
        {/* HEADER */}
        <div className="flex-none pt-14 px-6 bg-[#0a0a0a]/95 backdrop-blur-md z-20 border-b border-zinc-800 mt-2">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Brain size={20} className="text-purple-500" />
                Administrator AI <span className="text-white/30 text-lg font-light">Monitor</span>
                </h1>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-6 px-2.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-bold text-purple-400 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    LIVE
                </div>
            </div>
          </div>

          {/* NEW SUB-NAVIGATION MENU OPTIONS */}
          <div className="flex items-center gap-6 mt-2">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === 'overview' 
                    ? 'border-purple-500 text-white' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Usage Overview
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === 'history' 
                    ? 'border-purple-500 text-white' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Transaction History
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            
            {activeTab === 'overview' ? (
                <>
                {/* 1. DASHBOARD CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
                    
                    {/* Card 1: CREDITS & REFILL */}
                    <div className="bg-[#0C0C0E] border border-zinc-800 p-5 rounded-xl relative overflow-hidden group/credits z-10 flex flex-col justify-between h-full">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/credits:opacity-20 transition-opacity">
                            <CreditCard size={35} />
                        </div>
                        
                        <div>
                            <p className="text-zinc-500 text-[13px] uppercase font-bold tracking-widest mb-1">Available Balance</p>
                            <div className="text-4xl font-mono font-bold text-white mb-2 relative inline-block">
                                {totalCredits.toLocaleString()}
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-md mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${totalCredits > 1000 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-zinc-400">
                                    Token Status: <b className={`${totalCredits > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{totalCredits > 0 ? "Active" : "Depleted"}</b>
                                </span>
                            </div>
                        </div>

                        {/* REFILL BUTTON */}
                        <div className="mt-5 pt-4 border-t border-zinc-800/50">
                            <button 
                                    onClick={() => router.push(`/dashboard/projects/${params.id}/payments`)}
                                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
                            >
                                <Plus size={14} strokeWidth={3} />
                                Top Up Funds
                            </button>
                        </div>
                    </div>

                    {/* Card 2: USAGE & TREND */}
                    <div className="bg-[#0C0C0E] border border-zinc-800 p-5 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={35} />
                        </div>
                        <p className="text-zinc-500 text-[13px] uppercase font-bold tracking-widest mb-1">Weekly Consumption</p>
                        <div className="text-4xl font-mono font-bold text-white mb-2 flex items-center gap-3">
                            {(weeklyTotal / 1000).toFixed(1)}k
                            
                            {/* TREND INDICATOR */}
                            <div className={`text-xs px-1.5 py-0.5 rounded-md border flex items-center gap-1 font-sans font-medium
                                ${usageTrend > 0 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                    : usageTrend < 0 
                                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                }`}
                            >
                                {usageTrend > 0 ? <ArrowDownRight size={12} /> : usageTrend < 0 ? <ArrowUpRight size={12} /> : null}
                                {Math.abs(usageTrend)}%
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-md text-zinc-400">
                            <span>Previous week</span>
                            <span className="text-zinc-600">|</span>
                            <span>Avg: <span className="text-zinc-200">{dailyAverage.toFixed(0)}</span> / day</span>
                        </div>
                        <p className="text-zinc-400 text-xs mt-4">The weekly consumption doesn't affect the project's billing nor will it ever get limitations based on the token's usage.</p>
                    </div>

                    {/* Card 3: MODEL DISTRIBUTION */}
                    <div className="bg-[#0C0C0E] border border-zinc-800 p-5 rounded-xl relative overflow-hidden group flex flex-col">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LayoutGrid size={35} />
                        </div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
                            <Cpu size={12} /> Token Allocation
                        </p>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 space-y-3">
                            {Object.keys(tokenPack).length > 0 ? (
                                Object.entries(tokenPack)
                                    .sort(([keyA], [keyB]) => {
                                        const order = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-pro-preview"];
                                        const indexA = order.indexOf(keyA);
                                        const indexB = order.indexOf(keyB);
                                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                        if (indexA !== -1) return -1;
                                        if (indexB !== -1) return 1;
                                        return keyA.localeCompare(keyB);
                                    })
                                    .map(([key, value]) => {
                                        const modelConfig = MODELS.find(m => m.id === key) || {
                                            id: key, name: formatModelName(key), icon: Database, description: "General Model"
                                        };
                                        const Icon = modelConfig.icon;

                                        return (
                                            <div key={key} className="flex items-center justify-between group/item">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover/item:text-purple-400 group-hover/item:border-purple-500/30 transition-all duration-300">
                                                        <Icon size={14} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-medium text-zinc-200 truncate group-hover/item:text-white transition-colors">
                                                            {modelConfig.name}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-600 truncate">
                                                            {modelConfig.description}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right pl-4">
                                                    <span className="font-mono text-xs text-zinc-400 block">
                                                        {(value || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-xs text-zinc-600 italic gap-2">
                                    <Database size={16} className="opacity-50"/>
                                    No active token packs
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. CHART */}
                <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
                    <div className="h-[280px] w-full bg-[#0C0C0E] border border-zinc-800 rounded-xl p-4 relative">
                        <h3 className="text-xs font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                            <Zap size={12} className="text-purple-400" /> Usage Visualization (7 Days)
                        </h3>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={40}>
                                <defs>
                                    <linearGradient id="aiBarGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#4c1d95" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#525252', fontSize: 10, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#525252', fontSize: 10, fontFamily: 'monospace' }} 
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: '#ffffff05' }}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#e4e4e7' }}
                                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                                />
                                {dailyAverage > 0 && (
                                    <ReferenceLine y={dailyAverage} stroke="#3f3f46" strokeDasharray="3 3" />
                                )}
                                <Bar 
                                    dataKey="tokens" 
                                    fill="url(#aiBarGradient)" 
                                    radius={[4, 4, 0, 0]} 
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. TOOLBAR */}
                <div className="sticky top-0 bg-[#09090b]/95 backdrop-blur-sm z-10 px-6 py-4 border-y border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3 w-full max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search Request ID, Model, or User..." 
                                className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all shadow-sm font-mono" 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setShowModelMenu(!showModelMenu)} 
                                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-medium transition-all shadow-sm
                                    ${showModelMenu 
                                        ? 'bg-zinc-800 border-zinc-700 text-white' 
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
                            >
                                <Filter size={14} /> 
                                <span className="capitalize">{formatModelName(modelFilter).split(' ')[0]}...</span>
                                <ChevronDown size={12} />
                            </button>
                            
                            {showModelMenu && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-[#0C0C0E] border border-zinc-800 rounded-lg shadow-2xl z-30 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => { setModelFilter("All Models"); setShowModelMenu(false); }}
                                        className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors ${modelFilter === "All Models" ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'}`}
                                    >
                                        All Models
                                    </button>
                                    {uniqueModels.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => { setModelFilter(m); setShowModelMenu(false); }}
                                            className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors truncate ${modelFilter === m ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'}`}
                                        >
                                            {formatModelName(m)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={fetchData} 
                            disabled={refreshing}
                            className="p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* 4. LOGS TABLE */}
                <div className="min-h-[400px]">
                    <div className="grid grid-cols-12 gap-4 px-6 py-2 border-b border-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 select-none bg-zinc-900/20">
                        <div className="col-span-3 pl-2">User</div>
                        <div className="col-span-3">Request ID</div>
                        <div className="col-span-2">Model Engine</div>
                        <div className="col-span-2">Timestamp</div>
                        <div className="col-span-2 text-right pr-2">Tokens</div>
                    </div>

                    <div className="pb-10">
                        {filteredLogs.map((log, index) => {
                            const logUser = log.user_id ? userMap[log.user_id] : null;

                            return (
                            <div 
                                key={log.id} 
                                className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-zinc-800/30 items-center hover:bg-zinc-900/20 transition-colors group animate-in fade-in slide-in-from-left-4 duration-300"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                
                                {/* USER COLUMN */}
                                <div className="col-span-3 flex items-center gap-3">
                                    <UserAvatar 
                                        name={logUser?.full_name || "System"} 
                                        url={logUser?.avatar_url || null}
                                        size="w-6 h-6"
                                    />
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs font-medium text-zinc-300 truncate">
                                            {logUser?.full_name || "System Process"}
                                        </span>
                                        <span className="text-[10px] text-zinc-600 truncate">
                                            {logUser?.email || "Automated"}
                                        </span>
                                    </div>
                                </div>

                                {/* ID */}
                                <div className="col-span-3 flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500 font-mono truncate max-w-[160px] select-all">
                                        {log.id}
                                    </span>
                                </div>

                                {/* Model */}
                                <div className="col-span-2">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 text-[10px] font-medium text-zinc-300">
                                        {formatModelName(log.model)}
                                    </span>
                                </div>

                                {/* Time */}
                                <div className="col-span-2 flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                                    <Calendar size={10} />
                                    <div className="flex flex-col">
                                        <span>{new Date(log.created_at).toLocaleDateString()}</span>
                                        <span className="text-zinc-600">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                {/* Tokens */}
                                <div className="col-span-2 text-right">
                                    <span className="text-xs font-mono font-medium text-zinc-200">
                                        {log.tokens_used.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )})}

                        {filteredLogs.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-zinc-600 animate-in fade-in zoom-in-95 duration-500">
                                <Brain size={32} className="opacity-20 mb-3" />
                                <p className="text-sm">No usage logs found</p>
                            </div>
                        )}
                    </div>
                </div>
                </>
            ) : (
                // PLACEHOLDER FOR HISTORY TAB
                <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500 animate-in fade-in zoom-in-95">
                    <History size={48} className="mb-4 opacity-20" />
                    <h2 className="text-lg font-medium text-zinc-300">Transaction History</h2>
                    <p className="text-sm max-w-sm text-center mt-2">
                        This view would contain the ledger of all credit additions and manual adjustments made by administrators.
                    </p>
                </div>
            )}
        </div>
      </main>

      {/* REFILL MODAL */}
      {isRefillModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#0C0C0E] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Wallet size={20} className="text-purple-500"/> Add Tokens
                      </h3>
                      <button onClick={() => setIsRefillModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  
                  {/* Modal Body */}
                  <div className="p-6 space-y-6">
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-start gap-3">
                            <div className="mt-0.5 bg-purple-500 rounded-full p-0.5 text-black">
                                <CheckCircle2 size={12} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-purple-400">Current Balance</h4>
                                <p className="text-xs text-purple-200/70 mt-1">You currently have <span className="font-mono text-white">{totalCredits.toLocaleString()}</span> tokens active.</p>
                            </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Amount to Add</label>
                          <div className="relative">
                            <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                            <input 
                                type="number" 
                                value={refillAmount} 
                                onChange={(e) => setRefillAmount(parseInt(e.target.value) || 0)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono text-lg transition-all"
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                              {[50000, 100000, 500000].map(amt => (
                                  <button 
                                    key={amt}
                                    onClick={() => setRefillAmount(amt)}
                                    className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md border border-zinc-700 transition-colors"
                                  >
                                    +{amt.toLocaleString()}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                      <button 
                        onClick={() => setIsRefillModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleRefill}
                        disabled={isRefilling}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isRefilling ? <RefreshCw size={14} className="animate-spin"/> : <Plus size={16} strokeWidth={3} />}
                          Confirm & Add
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
    </div>
  );
}