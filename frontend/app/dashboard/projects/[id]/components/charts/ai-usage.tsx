"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'; 
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Info } from 'lucide-react'; // Optional icon for UX

// 1. Define Props Interface
interface AITokenUsageChartProps {
  projectId: string;
}

// 2. Define Data Shapes
type ChartDataPoint = {
  day: string;
  tokens: number;
};

type TokenPack = {
  remaining_tokens: {
    "gemini-2.5-pro"?: number;
    "gemini-2.5-flash"?: number;
    "gemini-3-pro-preview"?: number;
    [key: string]: number | undefined; 
  };
};

// Helper for cleaner model names
const formatModelName = (key: string) => {
  return key
    .replace(/-/g, ' ')
    .replace('gemini', 'Gemini')
    .replace('pro', 'Pro')
    .replace('flash', 'Flash')
    .replace('preview', 'Preview');
};

const AITokenUsageChart = ({ projectId }: AITokenUsageChartProps) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [modelTokens, setModelTokens] = useState<TokenPack['remaining_tokens']>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // --- Date Logic ---
        const now = new Date();
        const dayOfWeek = now.getDay(); 
        const diffToMonday = (dayOfWeek + 6) % 7; 
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // --- Fetching ---
        const [logsResponse, packResponse] = await Promise.all([
          supabase
            .from('token_usage_logs')
            .select('created_at, tokens_used')
            .eq('project_id', projectId)
            .gte('created_at', startOfWeek.toISOString())
            .lte('created_at', endOfWeek.toISOString()),

          supabase
            .from('token_packs')
            .select('remaining_tokens')
            .eq('project_id', projectId)
            .maybeSingle() 
        ]);

        if (logsResponse.error) throw logsResponse.error;
        if (packResponse.error) throw packResponse.error;

        // --- Process Chart ---
        const logs = logsResponse.data;
        const weekTemplate = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const groupedData = weekTemplate.map(day => ({ day, tokens: 0 }));

        logs?.forEach((log) => {
          const logDate = new Date(log.created_at);
          const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(logDate);
          const dayIndex = groupedData.findIndex(item => item.day === dayName);
          if (dayIndex !== -1) {
            groupedData[dayIndex].tokens += Number(log.tokens_used);
          }
        });
        setData(groupedData);

        // --- Process Tokens ---
        const tokens = (packResponse.data?.remaining_tokens as TokenPack['remaining_tokens']) || {};
        setModelTokens(tokens); 

        // FIX IS HERE: Added ": number" to the accumulator argument
        const calculatedRemaining = Object.values(tokens).reduce((acc: number, val) => acc + (val || 0), 0);
        
        setTotalCredits(calculatedRemaining);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);
  // Stats Calculations
  const dailyAverage = data.length > 0 
    ? data.reduce((sum, day) => sum + day.tokens, 0) / data.length 
    : 0;
  const weeklyTotal = data.reduce((sum, day) => sum + day.tokens, 0);

  if (loading) {
    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 h-full min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 h-full min-h-[400px] flex flex-col relative overflow-hidden group/container">
      {/* <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" /> */}

      {/* Header */}
      <div className="flex items-start justify-between mb-8 z-10">
        <div>
          <h3 className="text-white font-semibold text-lg">Token Usage</h3>
          <p className="text-white/40 text-sm">Project consumption (Weekly)</p>
        </div>

        {/* --- CREDITS SECTION WITH HOVER BREAKDOWN --- */}
        <div className="text-right relative group cursor-help">
            
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
            {totalCredits.toLocaleString()}
          </div>
          
          <div className="flex items-center justify-end gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${totalCredits > 0 ? 'bg-purple-500 animate-pulse' : 'bg-red-500'}`} />
             <span className="text-purple-400 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                Credits Left <Info size={10} className="text-white" />
             </span>
          </div>

          {/* Breakdown Tooltip */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#0f0f0f] border border-white/10 shadow-2xl rounded-lg p-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50 backdrop-blur-xl">
             <p className="text-xs font-semibold text-white/40 uppercase mb-2 border-b border-white/5 pb-2">Model Breakdown</p>
             <div className="space-y-2">
                {Object.entries(modelTokens).map(([key, value]) => (
                   <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-white/70 capitalize truncate max-w-[120px]" title={formatModelName(key)}>
                        {formatModelName(key)}
                      </span>
                      <span className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded">
                        {(value || 0).toLocaleString()}
                      </span>
                   </div>
                ))}
                {Object.keys(modelTokens).length === 0 && (
                    <p className="text-white/20 text-xs italic text-center py-2">No active token packs</p>
                )}
             </div>
          </div>

        </div>
        {/* --- END CREDITS SECTION --- */}
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={28}>
            <defs>
              <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#737373', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#737373', fontSize: 11 }} 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
            {data.length > 0 && (
                <ReferenceLine y={dailyAverage} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
            )}
            <Bar dataKey="tokens" fill="url(#aiGradient)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-1">Daily Average</p>
          <p className="text-white font-medium">{dailyAverage.toFixed(0)} tokens</p>
        </div>
        <div className="text-right">
           <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-1">Weekly Total</p>
           <p className="text-white font-medium">{(weeklyTotal / 1000).toFixed(1)}k tokens</p>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-white/60 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">
          {payload[0].value.toLocaleString()} <span className="text-purple-400 font-normal">tokens</span>
        </p>
      </div>
    );
  }
  return null;
};

export default AITokenUsageChart;