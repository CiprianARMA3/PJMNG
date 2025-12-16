"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import { Info } from 'lucide-react';

// --- TYPES ---
interface AITokenUsageChartProps {
  projectId: string;
}

type ChartDataPoint = {
  day: string;
  tokens: number;
  fullDate: string; // Added for precise sorting/debugging
};

type TokenPack = {
  remaining_tokens: {
    "gemini-2.5-pro"?: number;
    "gemini-2.5-flash"?: number;
    "gemini-3-pro-preview"?: number;
    [key: string]: number | undefined;
  };
};

// --- HELPER ---
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
        // 1. Calculate Date Range (Current Week: Mon -> Sun)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
        const diffToMonday = (dayOfWeek + 6) % 7; // Adjust so Monday is 0

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // 2. Parallel Fetching
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
        if (packResponse.error && packResponse.error.code !== 'PGRST116') throw packResponse.error;

        // 3. Process Chart Data
        const logs = logsResponse.data || [];
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Initialize empty week
        const groupedData = weekDays.map(day => ({
          day,
          tokens: 0,
          fullDate: ''
        }));

        logs.forEach((log) => {
          const logDate = new Date(log.created_at);
          const dayIndex = (logDate.getDay() + 6) % 7; // Convert Sun(0) to 6, Mon(1) to 0
          if (groupedData[dayIndex]) {
            groupedData[dayIndex].tokens += Number(log.tokens_used);
            groupedData[dayIndex].fullDate = log.created_at;
          }
        });

        setData(groupedData);

        // 4. Process Remaining Tokens
        const tokens = (packResponse.data?.remaining_tokens as TokenPack['remaining_tokens']) || {};
        setModelTokens(tokens);

        // Fix: Explicitly type accumulator as number
        const calculatedRemaining = Object.values(tokens).reduce((acc: number, val) => acc + (val || 0), 0);
        setTotalCredits(calculatedRemaining);

      } catch (error) {
        console.error('Error fetching token data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // --- STATS ---
  const dailyAverage = data.length > 0
    ? data.reduce((sum, day) => sum + day.tokens, 0) / 7 // Avg over 7 days
    : 0;
  const weeklyTotal = data.reduce((sum, day) => sum + day.tokens, 0);

  // --- LOADING STATE (Matches CalendarPage) ---
  if (loading) {
    return (
      <div role="status" className="flex justify-center items-center h-full min-h-[400px] bg-[#0a0a0a] rounded-xl border border-white/5">
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
    <div className="bg-[#0a0a0a] light:bg-white light:border light:border-gray-200 rounded-xl p-6 h-full min-h-[400px] flex flex-col relative overflow-hidden group/container ">
      <style jsx global>{`
        :root {
          --chart-grid: #ffffff08;
          --chart-text: #525252;
          --chart-cursor: #ffffff05;
        }
        @media (prefers-color-scheme: light) {
          :root {
            --chart-grid: #e5e7eb;
            --chart-text: #6b7280;
            --chart-cursor: #f3f4f6;
          }
        }
      `}</style>

      {/* --- HEADER --- */}
      <div className="flex items-start justify-between mb-8 z-10">
        <div>
          <h3 className="text-white light:text-black font-bold text-lg tracking-tight">Token Usage</h3>
          <p className="text-white/40 light:text-gray-500 text-xs font-medium uppercase tracking-wider mt-1">Project consumption (Weekly)</p>
        </div>

        {/* --- CREDITS DISPLAY --- */}
        <div className="text-right relative group cursor-help z-20">
          <div className="text-2xl font-bold text-white light:text-black">
            {totalCredits.toLocaleString()}
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${totalCredits > 0 ? 'bg-purple-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-purple-400 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              Credits Available <Info size={10} className="text-white/40 light:text-gray-400" />
            </span>
          </div>

          {/* HOVER TOOLTIP (Model Breakdown) */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#161616] light:bg-white border border-white/10 light:border-gray-200 shadow-2xl rounded-lg p-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
            <p className="text-[10px] font-bold text-white/40 light:text-gray-500 uppercase mb-2 border-b border-white/5 light:border-gray-200 pb-2">Model Breakdown</p>
            <div className="space-y-2">
              {Object.entries(modelTokens).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-white/70 light:text-gray-700 capitalize truncate max-w-[120px]" title={formatModelName(key)}>
                    {formatModelName(key)}
                  </span>
                  <span className="text-white light:text-black font-mono bg-white/5 light:bg-gray-100 px-1.5 py-0.5 rounded border border-white/5 light:border-gray-200">
                    {(value || 0).toLocaleString()}
                  </span>
                </div>
              ))}
              {Object.keys(modelTokens).length === 0 && (
                <p className="text-white/20 light:text-gray-400 text-xs italic text-center py-2">No active token packs found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CHART --- */}
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={32}>
            <defs>
              <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity={1} /> {/* Purple-400 */}
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} /> {/* Violet-600 */}
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #ffffff08)" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--chart-text, #525252)', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--chart-text, #525252)', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--chart-cursor, #ffffff05)' }} />

            {data.length > 0 && weeklyTotal > 0 && (
              <ReferenceLine y={dailyAverage} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} />
            )}

            <Bar
              dataKey="tokens"
              fill="url(#aiGradient)"
              radius={[4, 4, 0, 0]}
              className="hover:brightness-110 transition-all duration-300"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* --- FOOTER STATS --- */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5 light:border-gray-200">
        <div>
          <p className="text-white/30 light:text-gray-400 text-[10px] uppercase tracking-wider font-bold mb-1">Daily Avg</p>
          <p className="text-white light:text-black font-mono text-sm">{dailyAverage.toFixed(0)} <span className="text-white/40 light:text-gray-500 text-xs">tok</span></p>
        </div>
        <div className="text-right">
          <p className="text-white/30 light:text-gray-400 text-[10px] uppercase tracking-wider font-bold mb-1">Week Total</p>
          <p className="text-white light:text-black font-mono text-sm">{(weeklyTotal / 1000).toFixed(1)}k <span className="text-white/40 light:text-gray-500 text-xs">tok</span></p>
        </div>
      </div>
    </div>
  );
};

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#161616] light:bg-white border border-white/10 light:border-gray-200 p-3 rounded-lg shadow-xl backdrop-blur-sm">
        <p className="text-white/40 light:text-gray-500 text-[10px] uppercase font-bold mb-1">{label}</p>
        <p className="text-white light:text-black font-bold text-sm">
          {payload[0].value.toLocaleString()} <span className="text-purple-400 font-normal text-xs">tokens</span>
        </p>
      </div>
    );
  }
  return null;
};

export default AITokenUsageChart;