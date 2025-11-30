"use client";

import { useEffect, useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, ReferenceLine 
} from 'recharts';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface IssuesBarChartProps {
  projectId: string;
}

type ChartDataPoint = {
  day: string;
  issues: number;
  fullDate: string;
};

const IssuesBarChart = ({ projectId }: IssuesBarChartProps) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [totalThisWeek, setTotalThisWeek] = useState<number>(0);
  const [trendPercentage, setTrendPercentage] = useState<number>(0);
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

        // 2. Calculate previous week for trend comparison
        const startOfPreviousWeek = new Date(startOfWeek);
        startOfPreviousWeek.setDate(startOfWeek.getDate() - 7);
        const endOfPreviousWeek = new Date(startOfPreviousWeek);
        endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6);
        endOfPreviousWeek.setHours(23, 59, 59, 999);

        // 3. Parallel Fetching for current and previous week
        const [currentWeekResponse, previousWeekResponse] = await Promise.all([
          supabase
            .from('issues')
            .select('created_at')
            .eq('project_id', projectId)
            .gte('created_at', startOfWeek.toISOString())
            .lte('created_at', endOfWeek.toISOString()),

          supabase
            .from('issues')
            .select('created_at')
            .eq('project_id', projectId)
            .gte('created_at', startOfPreviousWeek.toISOString())
            .lte('created_at', endOfPreviousWeek.toISOString())
        ]);

        if (currentWeekResponse.error) throw currentWeekResponse.error;
        if (previousWeekResponse.error) throw previousWeekResponse.error;

        // 4. Process Chart Data
        const currentWeekIssues = currentWeekResponse.data || [];
        const previousWeekIssues = previousWeekResponse.data || [];
        
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        // Initialize empty week
        const groupedData = weekDays.map(day => ({ 
            day, 
            issues: 0, 
            fullDate: '' 
        }));

        currentWeekIssues.forEach((issue) => {
          const issueDate = new Date(issue.created_at);
          const dayIndex = (issueDate.getDay() + 6) % 7; // Convert Sun(0) to 6, Mon(1) to 0
          if (groupedData[dayIndex]) {
            groupedData[dayIndex].issues += 1;
            groupedData[dayIndex].fullDate = issue.created_at;
          }
        });
        
        setData(groupedData);

        // 5. Calculate Trend
        const currentWeekCount = currentWeekIssues.length;
        const previousWeekCount = previousWeekIssues.length;
        
        setTotalThisWeek(currentWeekCount);

        let percentage = 0;
        if (previousWeekCount === 0) {
            percentage = currentWeekCount > 0 ? 100 : 0;
        } else {
            percentage = ((currentWeekCount - previousWeekCount) / previousWeekCount) * 100;
        }

        setTrendPercentage(Math.round(percentage * 10) / 10);

      } catch (error) {
        console.error('Error fetching issues data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // --- STATS ---
  const dailyAverage = data.length > 0 
    ? data.reduce((sum, day) => sum + day.issues, 0) / 7
    : 0;
  const weeklyTotal = data.reduce((sum, day) => sum + day.issues, 0);

  // Determine colors
  const isIncrease = trendPercentage > 0;
  const isDecrease = trendPercentage < 0;
  const isNeutral = trendPercentage === 0;

  // --- LOADING STATE ---
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
    <div className="bg-[#0a0a0a] rounded-xl p-6 h-full min-h-[400px] flex flex-col relative overflow-hidden group/container">
      
      {/* --- HEADER --- */}
      <div className="flex items-start justify-between mb-8 z-10">
        <div>
          <h3 className="text-white font-bold text-lg tracking-tight">Reported Issues</h3>
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Project issues (Weekly)</p>
        </div>

        {/* --- ISSUES COUNT DISPLAY --- */}
        <div className="text-right relative group cursor-help z-20">
          <div className="text-2xl font-bold text-white">
            {totalThisWeek.toLocaleString()}
          </div>
          
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              isIncrease ? 'bg-rose-500 animate-pulse' : 
              isDecrease ? 'bg-emerald-500' : 'bg-zinc-500'
            }`} />
            <span className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
              isIncrease ? 'text-rose-400' : 
              isDecrease ? 'text-emerald-400' : 'text-zinc-400'
            }`}>
              Weekly Trend <Info size={10} className="text-white/40" />
            </span>
          </div>

          {/* HOVER TOOLTIP (Trend Breakdown) */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#161616] border border-white/10 shadow-2xl rounded-lg p-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
            <p className="text-[10px] font-bold text-white/40 uppercase mb-2 border-b border-white/5 pb-2">Trend Analysis</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">This Week</span>
                <span className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  {totalThisWeek.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Weekly Change</span>
                <span className={`font-mono px-1.5 py-0.5 rounded border ${
                  isIncrease ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' :
                  isDecrease ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                  'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
                }`}>
                  {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CHART --- */}
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={32}>
            <defs>
              <linearGradient id="issuesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} /> {/* Rose-500 */}
                <stop offset="100%" stopColor="#be123c" stopOpacity={0.6} /> {/* Rose-700 */}
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#525252', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#525252', fontSize: 10, fontFamily: 'monospace' }} 
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
            
            {data.length > 0 && weeklyTotal > 0 && (
                <ReferenceLine y={dailyAverage} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} />
            )}
            
            <Bar 
                dataKey="issues" 
                fill="url(#issuesGradient)" 
                radius={[4, 4, 0, 0]} 
                className="hover:brightness-110 transition-all duration-300"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* --- FOOTER STATS --- */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
        <div>
          <p className="text-white/30 text-[10px] uppercase tracking-wider font-bold mb-1">Daily Avg</p>
          <p className="text-white font-mono text-sm">{dailyAverage.toFixed(1)} <span className="text-white/40 text-xs">issues</span></p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            {isIncrease && <TrendingUp size={12} className="text-rose-400" />}
            {isDecrease && <TrendingDown size={12} className="text-emerald-400" />}
            {isNeutral && <Minus size={12} className="text-zinc-400" />}
            <p className="text-white/30 text-[10px] uppercase tracking-wider font-bold">Week Trend</p>
          </div>
          <p className={`font-mono text-sm ${
            isIncrease ? 'text-rose-400' : 
            isDecrease ? 'text-emerald-400' : 'text-zinc-400'
          }`}>
            {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
          </p>
        </div>
      </div>
    </div>
  );
};

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#161616] border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-sm">
        <p className="text-white/40 text-[10px] uppercase font-bold mb-1">{label}</p>
        <p className="text-white font-bold text-sm">
          {payload[0].value.toLocaleString()} <span className="text-rose-400 font-normal text-xs">issues</span>
        </p>
      </div>
    );
  }
  return null;
};

export default IssuesBarChart;