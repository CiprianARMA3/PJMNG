"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface IssuesBarChartProps {
  projectId: string;
}

interface ChartData {
  day: string; // "Mon", "Tue"
  date: string; // "2023-10-25" (for internal comparison)
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
        // 1. Calculate Date Ranges
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(today.getDate() - 13);
        fourteenDaysAgo.setHours(0, 0, 0, 0);

        // 2. Fetch all issues from the last 14 days (to calculate trend vs previous week)
        const { data: rawData, error } = await supabase
          .from('issues')
          .select('created_at')
          .eq('project_id', projectId)
          .gte('created_at', fourteenDaysAgo.toISOString());

        if (error) throw error;

        // 3. Process Data
        const last7DaysMap = new Map<string, number>();
        const previous7DaysMap = new Map<string, number>();
        const chartData: ChartData[] = [];
        
        // Initialize the last 7 days in the chart array (so days with 0 issues still show up)
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i)); // Order: -6, -5, ... Today
            const dayKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon"
            
            last7DaysMap.set(dayKey, 0);
            chartData.push({ day: dayName, date: dayKey, issues: 0 });
        }

        // Count issues
        let currentPeriodCount = 0;
        let previousPeriodCount = 0;

        rawData?.forEach((issue) => {
            const issueDate = new Date(issue.created_at);
            const dateKey = issueDate.toISOString().split('T')[0];

            if (issueDate >= sevenDaysAgo) {
                // This week
                const currentCount = last7DaysMap.get(dateKey) || 0;
                last7DaysMap.set(dateKey, currentCount + 1);
                currentPeriodCount++;
            } else {
                // Previous week (for trend calc)
                previousPeriodCount++;
            }
        });

        // Update Chart Data Array with actual counts
        const finalChartData = chartData.map(item => ({
            ...item,
            issues: last7DaysMap.get(item.date) || 0
        }));

        // 4. Calculate Trend
        let percentage = 0;
        if (previousPeriodCount === 0) {
            percentage = currentPeriodCount > 0 ? 100 : 0;
        } else {
            percentage = ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100;
        }

        setData(finalChartData);
        setTotalThisWeek(currentPeriodCount);
        setTrendPercentage(Math.round(percentage * 10) / 10); // Round to 1 decimal

      } catch (err) {
        console.error("Error fetching chart data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 h-full min-h-[300px] flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 h-full min-h-[300px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
         <div>
            <h3 className="text-white font-semibold text-lg">Reported Issues</h3>
            <p className="text-white/40 text-xs mt-1">Last 7 Days</p>
         </div>
         
         <div className="text-right">
             {/* Total Count */}
             <div className="text-2xl font-bold text-white mb-1">{totalThisWeek}</div>
             
             {/* Dynamic Trend Badge */}
             <div className={`text-xs px-2 py-1 rounded border font-medium flex items-center gap-1 w-fit ml-auto
                ${trendPercentage >= 0 
                    ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' 
                    : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                }`}
             >
                {trendPercentage >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
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