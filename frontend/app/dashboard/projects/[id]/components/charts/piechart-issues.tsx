"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface IssuesBarChartProps {
  projectId: string;
}

interface ChartData {
  day: string; 
  date: string; 
  issues: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a]/90 backdrop-blur border border-white/10 p-2 rounded-md shadow-lg z-50">
        <p className="text-white/60 text-[10px] mb-1">{label}</p>
        <p className="text-rose-400 font-bold text-sm">
          {payload[0].value} <span className="text-white font-normal">Issues</span>
        </p>
      </div>
    );
  }
  return null;
};

const IssuesBarChart = ({ projectId }: IssuesBarChartProps) => {
  const supabase = createClient();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalThisWeek, setTotalThisWeek] = useState(0);
  const [trendPercentage, setTrendPercentage] = useState(0);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!projectId) return;

      try {
        // 1. Get Today at Midnight (Start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 2. Calculate boundaries
        // Current Week: [Today-6] to [Today] (7 days inclusive)
        const startOfCurrentWeek = new Date(today);
        startOfCurrentWeek.setDate(today.getDate() - 6);

        // Previous Week: [Today-13] to [Today-7] (7 days inclusive)
        const startOfPreviousWeek = new Date(today);
        startOfPreviousWeek.setDate(today.getDate() - 13);

        // End of today (for DB Query upper limit)
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // 3. Fetch all issues from the last 14 days
        const { data: rawData, error } = await supabase
          .from('issues')
          .select('created_at')
          .eq('project_id', projectId)
          .gte('created_at', startOfPreviousWeek.toISOString())
          .lte('created_at', endOfToday.toISOString());

        if (error) throw error;

        // 4. Initialize Chart Data Structure (Last 7 days)
        const chartDataMap = new Map<string, number>();
        const chartTemplate: ChartData[] = [];

        // Loop 0 to 6 to build the last 7 days (including today)
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); 
            
            chartDataMap.set(dateKey, 0); // Initialize with 0
            chartTemplate.push({ day: dayName, date: dateKey, issues: 0 });
        }

        let currentPeriodCount = 0;
        let previousPeriodCount = 0;

        // 5. Bucket the data
        rawData?.forEach((issue) => {
            const issueDate = new Date(issue.created_at);
            // Normalize issue date to Midnight for comparison
            const normalizedIssueDate = new Date(issueDate);
            normalizedIssueDate.setHours(0, 0, 0, 0);
            
            // Generate Key for Map lookup
            const issueDateKey = issueDate.toLocaleDateString('en-CA');

            // Logic: Compare Time Values (ms) to be precise
            if (normalizedIssueDate.getTime() >= startOfCurrentWeek.getTime()) {
                // THIS WEEK
                currentPeriodCount++;
                const existingCount = chartDataMap.get(issueDateKey) || 0;
                chartDataMap.set(issueDateKey, existingCount + 1);
            } else if (normalizedIssueDate.getTime() >= startOfPreviousWeek.getTime()) {
                // PREVIOUS WEEK
                previousPeriodCount++;
            }
        });

        // 6. Merge counts into chart template
        const finalChartData = chartTemplate.map(item => ({
            ...item,
            issues: chartDataMap.get(item.date) || 0
        }));

        // 7. Calculate Trend
        let percentage = 0;
        if (previousPeriodCount === 0) {
            percentage = currentPeriodCount > 0 ? 100 : 0;
        } else {
            percentage = ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100;
        }

        setData(finalChartData);
        setTotalThisWeek(currentPeriodCount);
        setTrendPercentage(Math.round(percentage * 10) / 10);

      } catch (err) {
        console.error("Error fetching chart data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [projectId]);

  // Determine colors
  const isIncrease = trendPercentage > 0;
  const isDecrease = trendPercentage < 0;
  const isNeutral = trendPercentage === 0;

 if (loading) {
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
    <div className="bg-[#0a0a0a]  rounded-xl p-6 h-full min-h-[300px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
         <div>
            <h3 className="text-white font-semibold text-lg">Reported Issues</h3>
            <p className="text-white/40 text-xs mt-1">Last 7 Days</p>
         </div>
         
         <div className="text-right">
             <div className="text-2xl font-bold text-white mb-1">{totalThisWeek}</div>
             
             <div className={`text-xs px-2 py-1 rounded border font-medium flex items-center gap-1 w-fit ml-auto transition-colors
                ${isIncrease ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' : ''}
                ${isDecrease ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : ''}
                ${isNeutral ? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' : ''}
             `}>
                {isIncrease && <TrendingUp size={12} />}
                {isDecrease && <TrendingDown size={12} />}
                {isNeutral && <Minus size={12} />}
                
                {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
             </div>
         </div>
      </div>
      
      <div className="flex-1 flex items-end w-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barSize={32}>
            <defs>
              <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#be123c" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#525252', fontSize: 11 }} 
                dy={10} 
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#525252', fontSize: 11 }} 
                allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
            <Bar 
              dataKey="issues" 
              fill="url(#roseGradient)" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IssuesBarChart;