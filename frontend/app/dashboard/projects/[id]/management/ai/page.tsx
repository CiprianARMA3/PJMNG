"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../../components/menu";
import React from "react";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
// Correct import for the server action
import { fetchTokenTransactions } from './actions'; // Adjust path as needed

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
  CheckCircle2,
  DollarSign,
  Globe
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

// Interface for the server action response
interface TokenTransaction {
  id: number;
  created_at: string;
  model_key: string;
  tokens_added: number;
  amount_paid: number;
  currency: string;
  source: string;
  metadata: any;
}

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

// --- HELPER: Format Number ---
const formatNumber = (num: number) => num.toLocaleString('en-US');

// --- HELPER: Format Date ---
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// --- HELPER: Format Currency ---
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2
  }).format(amount);
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

  const { checkAccess, loading: authLoading } = useProjectPermissions(projectId);

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

  // Transaction History State
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Trend State
  const [usageTrend, setUsageTrend] = useState<number>(0);
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

  // --- DATA FETCHING FUNCTION ---
  const fetchData = async () => {
    if (!projectId) return;

    try {
      // Set loading states
      if (loading || activeTab === 'overview') setRefreshing(true);
      if (activeTab === 'history') setLoadingTransactions(true);

      // Date calculations for weekly data
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

      // --- FETCH ALL PROJECT-RELATED DATA CONCURRENTLY ---
      const [
        logsResponse,
        packResponse,
        usersResponse,
        transactionsResponse
      ] = await Promise.all([
        // 1. Token usage logs for this project
        supabase
          .from('token_usage_logs')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),

        // 2. Token packs for this project
        supabase
          .from('token_packs')
          .select('remaining_tokens')
          .eq('project_id', projectId)
          .maybeSingle(),

        // 3. All users (for mapping user IDs to names)
        supabase
          .from("users")
          .select("id, email, name, surname, metadata"),

        // 4. Transaction history using server action
        fetchTokenTransactions(projectId)
          .then(({ data, error }) => {
            if (error) {
              console.error("Failed to fetch transactions:", error);
              return [];
            }
            return data || [];
          })
      ]);

      // --- PROCESS TOKEN USAGE LOGS ---
      if (logsResponse.error) throw logsResponse.error;
      const rawLogs = logsResponse.data || [];
      setLogs(rawLogs);

      // --- PROCESS TRANSACTION DATA ---
      setTransactions(transactionsResponse as TokenTransaction[]);

      // --- PROCESS USER DATA ---
      if (usersResponse.data) {
        const mapping: Record<string, UserMapData> = {};
        usersResponse.data.forEach(u => {
          mapping[u.id] = {
            id: u.id,
            email: u.email || "",
            full_name: `${u.name || ""} ${u.surname || ""}`.trim() || "Unknown User",
            avatar_url: (u.metadata as any)?.avatar_url || null
          };
        });
        setUserMap(mapping);
      }

      // --- PROCESS CHARTS AND STATS ---
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const groupedCurrentWeek = weekDays.map(day => ({ day, tokens: 0, fullDate: '' }));
      let currentWeekSum = 0;
      let prevWeekSum = 0;

      // Filter logs for current and previous week calculations
      rawLogs.forEach((log) => {
        const logDate = new Date(log.created_at);
        const tokens = Number(log.tokens_used);

        // Current week
        if (logDate >= startOfWeek && logDate <= endOfWeek) {
          const dayIndex = (logDate.getDay() + 6) % 7;
          if (groupedCurrentWeek[dayIndex]) {
            groupedCurrentWeek[dayIndex].tokens += tokens;
            if (!groupedCurrentWeek[dayIndex].fullDate) {
              groupedCurrentWeek[dayIndex].fullDate = log.created_at;
            }
          }
          currentWeekSum += tokens;
        }
        // Previous week
        else if (logDate >= startOfPrevWeek && logDate <= endOfPrevWeek) {
          prevWeekSum += tokens;
        }
      });

      setChartData(groupedCurrentWeek);
      setPrevWeekTotal(prevWeekSum);

      // Calculate trend
      if (prevWeekSum === 0) {
        setUsageTrend(currentWeekSum > 0 ? 100 : 0);
      } else {
        const diff = currentWeekSum - prevWeekSum;
        setUsageTrend(parseFloat(((diff / prevWeekSum) * 100).toFixed(1)));
      }

      // --- PROCESS TOKEN PACKS ---
      const tokens = (packResponse.data?.remaining_tokens as TokenPack['remaining_tokens']) || {};
      setTokenPack(tokens);

      // Calculate total credits
      const calculatedRemaining = Object.values(tokens).reduce((acc: number, val) => acc + (val || 0), 0);
      setTotalCredits(calculatedRemaining);

    } catch (error) {
      console.error("Error fetching AI data:", error);
      // Optionally show error to user
    } finally {
      setRefreshing(false);
      setLoadingTransactions(false);
    }
  };

  // Handle token refill
  const handleRefill = async () => {
    setIsRefilling(true);
    try {
      const targetKey = "gemini-2.5-flash";
      const currentAmount = tokenPack[targetKey] || 0;
      const newAmount = currentAmount + refillAmount;

      const newPack = {
        ...tokenPack,
        [targetKey]: newAmount
      };

      const { error } = await supabase
        .from('token_packs')
        .upsert({
          project_id: projectId,
          remaining_tokens: newPack,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log("Tokens added successfully");

      // Refresh all data
      await fetchData();
      setIsRefillModalOpen(false);
      setRefillAmount(100000); // Reset to default
    } catch (error) {
      console.error("Failed to add tokens", error);
      alert("Failed to add tokens. Please try again.");
    } finally {
      setIsRefilling(false);
    }
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
      // Check authentication
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        router.push("/auth/login");
        return;
      }

      // Fetch user profile
      const { data: userProfile } = await supabase
        .from("users")
        .select("name, surname, metadata")
        .eq("id", authUser.id)
        .single();

      setUser({
        ...authUser,
        user_metadata: {
          ...authUser.user_metadata,
          full_name: userProfile?.name ? `${userProfile.name} ${userProfile.surname || ""}`.trim() : "User",
          avatar_url: userProfile?.metadata?.avatar_url
        }
      });

      // Fetch project details
      const { data: projectData } = await supabase
        .from("projects")
        .select("id, name, metadata")
        .eq("id", projectId)
        .single();

      if (projectData) {
        const iconUrl = projectData.metadata?.project_icon_url || projectData.metadata?.logo_url || null;
        setProject({ ...projectData, icon_url: iconUrl });
      }

      // Check permissions
      if (!authLoading && !checkAccess('manage-ai-assistant')) {
        router.push(`/dashboard/projects/${projectId}`);
        return;
      }

      // Fetch all data
      await fetchData();
      setLoading(false);
    };

    init();
  }, [projectId, authLoading]);

  // Filter logs based on search and model filter
  const filteredLogs = useMemo(() => {
    const lowerSearch = searchQuery.toLowerCase();
    return logs.filter(log => {
      const logUser = log.user_id ? userMap[log.user_id] : null;
      const userName = logUser?.full_name.toLowerCase() || "";
      const userEmail = logUser?.email.toLowerCase() || "";

      const matchesSearch =
        log.model.toLowerCase().includes(lowerSearch) ||
        log.id.toLowerCase().includes(lowerSearch) ||
        userName.includes(lowerSearch) ||
        userEmail.includes(lowerSearch);

      const matchesFilter = modelFilter === "All Models" || log.model === modelFilter;
      return matchesSearch && matchesFilter;
    });
  }, [logs, searchQuery, modelFilter, userMap]);

  // Get unique models from logs
  const uniqueModels = useMemo(() => [...new Set(logs.map(l => l.model))], [logs]);

  // Calculate weekly statistics
  const weeklyTotal = chartData.reduce((sum, day) => sum + day.tokens, 0);
  const dailyAverage = weeklyTotal / 7;

  // Calculate total spent from transactions
  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, transaction) => sum + transaction.amount_paid, 0);
  }, [transactions]);

  // --- LOADING STATE ---
  if (loading || refreshing) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        <svg
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
    <div className="h-screen bg-[#0a0a0a] light:bg-gray-50 text-zinc-100 light:text-gray-900 flex overflow-hidden selection:bg-purple-500/30">

      {/* SIDEBAR */}
      <Menu project={project} user={user} />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[#09090b] light:bg-gray-50 relative">

        {/* HEADER */}
        <div className="flex-none pt-14 px-6 bg-[#0a0a0a]/95 light:bg-white/95 backdrop-blur-md z-20 border-b border-zinc-800 light:border-gray-200 mt-2">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-white light:text-gray-900">
                <Brain size={20} className="text-purple-500" />
                Administrator AI <span className="text-white/30 light:text-gray-400 text-lg font-light">Monitor</span>
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

          {/* SUB-NAVIGATION */}
          <div className="flex items-center gap-6 mt-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'overview'
                ? 'border-purple-500 text-white light:text-purple-600'
                : 'border-transparent text-zinc-500 light:text-gray-500 hover:text-zinc-300 light:hover:text-gray-700'
                }`}
            >
              Usage Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'history'
                ? 'border-purple-500 text-white light:text-purple-600'
                : 'border-transparent text-zinc-500 light:text-gray-500 hover:text-zinc-300 light:hover:text-gray-700'
                }`}
            >
              Transaction History
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {activeTab === 'overview' ? (
            // OVERVIEW TAB CONTENT
            <>
              {/* DASHBOARD CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-6 animate-in fade-in slide-in-from-bottom-3 duration-500">

                {/* Card 1: CREDITS & REFILL */}
                <div className="bg-[#0C0C0E] light:bg-white border border-zinc-800 light:border-gray-200 p-5 rounded-xl relative overflow-hidden group/credits z-10 flex flex-col justify-between h-full shadow-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/credits:opacity-20 transition-opacity text-white light:text-gray-900">
                    <CreditCard size={35} />
                  </div>

                  <div>
                    <p className="text-zinc-500 light:text-gray-500 text-[13px] uppercase font-bold tracking-widest mb-1">Available Balance</p>
                    <div className="text-4xl font-mono font-bold text-white light:text-gray-900 mb-2 relative inline-block">
                      {totalCredits.toLocaleString()}
                    </div>

                    <div className="flex items-center gap-1.5 text-md mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${totalCredits > 1000 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-zinc-400 light:text-gray-600">
                        Token Status: <b className={`${totalCredits > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {totalCredits > 0 ? "Active" : "Depleted"}
                        </b>
                      </span>
                    </div>

                    {/* Total spent */}
                    <div className="mt-4 pt-4 border-t border-zinc-800/30 light:border-gray-200">
                      <p className="text-zinc-500 light:text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Total Spent</p>
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-amber-500" />
                        <span className="text-lg font-mono font-bold text-amber-400 light:text-amber-600">
                          {formatCurrency(totalSpent, transactions[0]?.currency || 'USD')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* REFILL BUTTON */}
                  <div className="mt-5 pt-4 border-t border-zinc-800/50 light:border-gray-200">
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
                <div className="bg-[#0C0C0E] light:bg-white border border-zinc-800 light:border-gray-200 p-5 rounded-xl relative overflow-hidden group shadow-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-white light:text-gray-900">
                    <TrendingUp size={35} />
                  </div>
                  <p className="text-zinc-500 light:text-gray-500 text-[13px] uppercase font-bold tracking-widest mb-1">Weekly Consumption</p>
                  <div className="text-4xl font-mono font-bold text-white light:text-gray-900 mb-2 flex items-center gap-3">
                    {(weeklyTotal / 1000).toFixed(1)}k

                    {/* TREND INDICATOR */}
                    <div className={`text-xs px-1.5 py-0.5 rounded-md border flex items-center gap-1 font-sans font-medium
                      ${usageTrend > 0
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : usageTrend < 0
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-zinc-800 light:bg-gray-100 border-zinc-700 light:border-gray-200 text-zinc-400 light:text-gray-600'
                      }`}
                    >
                      {usageTrend > 0 ? <ArrowDownRight size={12} /> : usageTrend < 0 ? <ArrowUpRight size={12} /> : null}
                      {Math.abs(usageTrend)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-md text-zinc-400 light:text-gray-500">
                    <span>Previous week</span>
                    <span className="text-zinc-600 light:text-gray-400">|</span>
                    <span>Avg: <span className="text-zinc-200 light:text-gray-800">{dailyAverage.toFixed(0)}</span> / day</span>
                  </div>
                  <p className="text-zinc-400 light:text-gray-500 text-xs mt-4">
                    The weekly consumption doesn't affect the project's billing nor will it ever get limitations based on the token's usage.
                  </p>
                </div>

                {/* Card 3: MODEL DISTRIBUTION */}
                <div className="bg-[#0C0C0E] light:bg-white border border-zinc-800 light:border-gray-200 p-5 rounded-xl relative overflow-hidden group flex flex-col shadow-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-white light:text-gray-900">
                    <LayoutGrid size={35} />
                  </div>
                  <p className="text-zinc-500 light:text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
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
                                <div className="w-8 h-8 rounded-lg bg-zinc-900 light:bg-gray-100 border border-zinc-800 light:border-gray-200 flex items-center justify-center text-zinc-500 light:text-gray-500 group-hover/item:text-purple-400 group-hover/item:border-purple-500/30 transition-all duration-300">
                                  <Icon size={14} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-medium text-zinc-200 light:text-gray-800 truncate group-hover/item:text-white light:group-hover/item:text-gray-900 transition-colors">
                                    {modelConfig.name}
                                  </span>
                                  <span className="text-[10px] text-zinc-600 light:text-gray-500 truncate">
                                    {modelConfig.description}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right pl-4">
                                <span className="font-mono text-xs text-zinc-400 light:text-gray-600 block">
                                  {(value || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-zinc-600 italic gap-2">
                        <Database size={16} className="opacity-50" />
                        No active token packs
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CHART */}
              <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
                <div className="h-[280px] w-full bg-[#0C0C0E] light:bg-white border border-zinc-800 light:border-gray-200 rounded-xl p-4 relative shadow-sm">
                  <h3 className="text-xs font-semibold text-zinc-400 light:text-gray-500 mb-4 flex items-center gap-2">
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
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" vertical={false} />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--axis-color)', fontSize: 10, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--axis-color)', fontSize: 10, fontFamily: 'monospace' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'var(--grid-color)' }}
                        contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: 'var(--tooltip-text)' }}
                        labelStyle={{ color: 'var(--axis-color)', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
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

              {/* TOOLBAR */}
              <div className="sticky top-0 bg-[#09090b]/95 light:bg-white/95 backdrop-blur-sm z-10 px-6 py-4 border-y border-zinc-800/50 light:border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3 w-full max-w-2xl">
                  <div className="relative flex-1 group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 light:text-gray-400 group-focus-within:text-zinc-300 light:group-focus-within:text-gray-600 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search Request ID, Model, or User..."
                      className="w-full bg-zinc-900/50 light:bg-gray-100 border border-zinc-800/80 light:border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 light:text-gray-900 placeholder:text-zinc-600 light:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 light:focus:ring-gray-300 focus:border-zinc-700 light:focus:border-gray-300 transition-all shadow-sm font-mono"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowModelMenu(!showModelMenu)}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-medium transition-all shadow-sm
                        ${showModelMenu
                          ? 'bg-zinc-800 light:bg-gray-200 border-zinc-700 light:border-gray-300 text-white light:text-gray-900'
                          : 'bg-zinc-900/50 light:bg-gray-100 border-zinc-800 light:border-gray-200 text-zinc-400 light:text-gray-600 hover:text-zinc-200 light:hover:text-gray-900 hover:bg-zinc-900 light:hover:bg-gray-200'}`}
                    >
                      <Filter size={14} />
                      <span className="capitalize">{formatModelName(modelFilter).split(' ')[0]}...</span>
                      <ChevronDown size={12} />
                    </button>

{showModelMenu && (
  <div className="absolute top-full right-0 mt-2 w-56 bg-[#0C0C0E] border border-zinc-800 rounded-lg shadow-2xl z-30 p-1.5 animate-in fade-in zoom-in-95 duration-200 light:bg-white light:border-zinc-200 light:shadow-lg">
    <button
      onClick={() => { setModelFilter("All Models"); setShowModelMenu(false); }}
      className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors 
        ${modelFilter === "All Models" 
          ? 'bg-zinc-800 text-white light:bg-zinc-100 light:text-zinc-900' 
          : 'text-zinc-400 hover:bg-zinc-800/50 light:text-zinc-600 light:hover:bg-zinc-100 light:hover:text-zinc-900'}`}
    >
      All Models
    </button>
    {uniqueModels.map(m => (
      <button
        key={m}
        onClick={() => { setModelFilter(m); setShowModelMenu(false); }}
        className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors truncate 
          ${modelFilter === m 
            ? 'bg-zinc-800 text-white light:bg-zinc-100 light:text-zinc-900' 
            : 'text-zinc-400 hover:bg-zinc-800/50 light:text-zinc-600 light:hover:bg-zinc-100 light:hover:text-zinc-900'}`}
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
                    className="p-2 bg-zinc-900/50 light:bg-gray-100 border border-zinc-800 light:border-gray-200 rounded-lg text-zinc-500 light:text-gray-500 hover:text-zinc-200 light:hover:text-gray-900 hover:bg-zinc-900 light:hover:bg-gray-200 hover:border-zinc-700 light:hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* LOGS TABLE */}
              <div className="min-h-[400px]">
                <div className="grid grid-cols-12 gap-4 px-6 py-2 border-b border-zinc-800/50 light:border-gray-200 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 light:text-gray-500 select-none bg-zinc-900/20 light:bg-gray-100">
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
                        className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-zinc-800/30 light:border-gray-200 items-center hover:bg-zinc-900/20 light:hover:bg-gray-50 transition-colors group animate-in fade-in slide-in-from-left-4 duration-300"
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
                            <span className="text-xs font-medium text-zinc-300 light:text-gray-900 truncate">
                              {logUser?.full_name || "Unknown"}
                            </span>
                            <span className="text-[10px] text-zinc-600 light:text-gray-500 truncate">
                              {logUser?.email || "Automated"}
                            </span>
                          </div>
                        </div>

                        {/* ID */}
                        <div className="col-span-3 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-900 light:bg-gray-100 border border-zinc-800 light:border-gray-200 text-[10px] text-zinc-500 light:text-gray-600 font-mono truncate max-w-[160px] select-all">
                            {log.id}
                          </span>
                        </div>

                        {/* Model */}
                        <div className="col-span-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-800 light:border-gray-200 bg-zinc-900/50 light:bg-gray-100 text-[10px] font-medium text-zinc-300 light:text-gray-700">
                            {formatModelName(log.model)}
                          </span>
                        </div>

                        {/* Time */}
                        <div className="col-span-2 flex items-center gap-1.5 text-[10px] text-zinc-500 light:text-gray-500 font-mono">
                          <Calendar size={10} />
                          <div className="flex flex-col">
                            <span>{new Date(log.created_at).toLocaleDateString()}</span>
                            <span className="text-zinc-600 light:text-gray-400">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {/* Tokens */}
                        <div className="col-span-2 text-right">
                          <span className="text-xs font-mono font-medium text-zinc-200 light:text-gray-900">
                            {log.tokens_used.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}

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
            // TRANSACTION HISTORY TAB CONTENT
            <div className="px-6 py-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="bg-[#0C0C0E] light:bg-white border border-zinc-800 light:border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-zinc-800 light:border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white light:text-gray-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-yellow-400" /> Token Top-up History
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      Total spent: <span className="text-amber-400 font-bold">
                        {formatCurrency(totalSpent, transactions[0]?.currency || 'USD')}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={fetchData}
                    disabled={refreshing || loadingTransactions}
                    className="p-2 bg-zinc-900/50 light:bg-gray-100 border border-zinc-800 light:border-gray-200 rounded-lg text-zinc-500 light:text-gray-500 hover:text-zinc-200 light:hover:text-gray-900 hover:bg-zinc-900 light:hover:bg-gray-200 hover:border-zinc-700 light:hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={refreshing || loadingTransactions ? "animate-spin" : ""} />
                  </button>
                </div>

                {loadingTransactions || refreshing ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-white/50" />
                    <span className="ml-3 text-white/50">Loading transactions...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#1e1e22] light:divide-gray-200 text-sm text-white/80 light:text-gray-900">
                      <thead className="bg-white/5 light:bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60 light:text-gray-600">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60 light:text-gray-600">
                            Tokens Added
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60 light:text-gray-600">
                            Model
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60 light:text-gray-600">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60 light:text-gray-600">
                            Source
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/60 light:text-gray-600">
                            ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e1e22] light:divide-gray-200">
                        {transactions.length > 0 ? (
                          transactions.map((transaction, index) => (
                            <tr
                              key={transaction.id}
                              className="hover:bg-white/5 light:hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-left-4 duration-300"
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                {formatDate(transaction.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-emerald-400 light:font-extrabold">
                                +{formatNumber(transaction.tokens_added)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-900/50 light:bg-gray-100 text-xs font-medium text-zinc-300 light:text-gray-700 border border-zinc-800 light:border-gray-200">
                                    {formatModelName(transaction.model_key)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Globe size={12} className="text-amber-500" />
                                  <span className="text-amber-400 font-medium">
                                    {formatCurrency(transaction.amount_paid, transaction.currency)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-500/10 light:bg-blue-50 text-blue-400 light:text-blue-600 text-xs font-medium border border-blue-500/20 light:border-blue-200">
                                  {transaction.source}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-xs text-zinc-500 light:text-gray-500">
                                #{transaction.id}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-white/50">
                              <Wallet size={24} className="mx-auto mb-2 opacity-50" />
                              No token top-up transactions found for this project.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* REFILL MODAL */}
      {isRefillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 light:bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-[#0C0C0E] light:bg-white border border-zinc-800 light:border-gray-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 light:border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white light:text-gray-900 flex items-center gap-2">
                <Wallet size={20} className="text-purple-500" /> Add Tokens
              </h3>
              <button onClick={() => setIsRefillModalOpen(false)} className="text-zinc-500 light:text-gray-400 hover:text-white light:hover:text-gray-900 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="p-4 bg-purple-500/10 light:bg-purple-50 border border-purple-500/20 light:border-purple-200 rounded-lg flex items-start gap-3">
                <div className="mt-0.5 bg-purple-500 rounded-full p-0.5 text-black">
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-400 light:text-purple-700">Current Balance</h4>
                  <p className="text-xs text-purple-200/70 light:text-purple-600 mt-1">You currently have <span className="font-mono text-white light:text-purple-900">{totalCredits.toLocaleString()}</span> tokens active.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500 light:text-gray-500 tracking-wider">Amount to Add</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 light:text-gray-400" />
                  <input
                    type="number"
                    value={refillAmount}
                    onChange={(e) => setRefillAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 light:bg-white border border-zinc-700 light:border-gray-300 rounded-lg pl-10 pr-4 py-3 text-white light:text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none font-mono text-lg transition-all"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[50000, 100000, 500000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setRefillAmount(amt)}
                      className="px-3 py-1 text-xs bg-zinc-800 light:bg-gray-100 hover:bg-zinc-700 light:hover:bg-gray-200 text-zinc-300 light:text-gray-700 rounded-md border border-zinc-700 light:border-gray-300 transition-colors"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-800 light:border-gray-200 bg-zinc-900/50 light:bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsRefillModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefill}
                disabled={isRefilling}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefilling ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
                Confirm & Add
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        :root { --grid-color: #ffffff08; --axis-color: #525252; --tooltip-bg: #18181b; --tooltip-border: #27272a; --tooltip-text: #e4e4e7; }
        @media (prefers-color-scheme: light) {
          :root { --grid-color: #00000008; --axis-color: #6b7280; --tooltip-bg: #ffffff; --tooltip-border: #e5e7eb; --tooltip-text: #1f2937; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        @media (prefers-color-scheme: light) {
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        }
      `}</style>
    </div>
  );
}