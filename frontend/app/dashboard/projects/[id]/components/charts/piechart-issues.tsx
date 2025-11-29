"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
        // 1. Setup Strict Midnight Boundaries
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); // Start of 7 days ago

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(today.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0); // Start of 14 days ago

        // 2. Fetch all issues from the last 14 days
        const { data: rawData, error } = await supabase
          .from('issues')
          .select('created_at')
          .eq('project_id', projectId)
          .gte('created_at', fourteenDaysAgo.toISOString())
          .lte('created_at', today.toISOString());

        if (error) throw error;

        // 3. Process Data
        const last7DaysMap = new Map<string, number>();
        const chartData: ChartData[] = [];
        
        // Initialize the last 7 days chart structure (Current Week)
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            // Use local date string to match user's timezone for grouping
            const dateKey = d.toLocaleDateString('en-CA'); // YYYY-MM-DD format (local safe)
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon"
            
            last7DaysMap.set(dateKey, 0);
            chartData.push({ day: dayName, date: dateKey, issues: 0 });
        }

        let currentPeriodCount = 0;
        let previousPeriodCount = 0;

        rawData?.forEach((issue) => {
            const issueDate = new Date(issue.created_at);
            // Get YYYY-MM-DD in local time to match the map keys
            const localIssueDateKey = issueDate.toLocaleDateString('en-CA'); 

            if (issueDate >= sevenDaysAgo) {
                // THIS WEEK (Last 7 days)
                const currentCount = last7DaysMap.get(localIssueDateKey) || 0;
                last7DaysMap.set(localIssueDateKey, currentCount + 1);
                currentPeriodCount++;
            } else if (issueDate >= fourteenDaysAgo) {
                // PREVIOUS WEEK (Days 8-14)
                previousPeriodCount++;
            }
        });

        // Map processed counts back to chart array
        const finalChartData = chartData.map(item => ({
            ...item,
            issues: last7DaysMap.get(item.date) || 0
        }));

        // 4. Calculate Trend Logic
        let percentage = 0;

        if (previousPeriodCount === 0) {
            // Logic: If we had 0 issues last week...
            if (currentPeriodCount === 0) {
                percentage = 0; // 0 to 0 = No change
            } else {
                percentage = 100; // 0 to X = 100% increase (technically infinite, but 100 is standard for UI)
            }
        } else {
            // Standard Formula: ((New - Old) / Old) * 100
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

  // Helper to determine trend color and icon
  // For Issues: Increase (+) is BAD (Red), Decrease (-) is GOOD (Green)
  const isIncrease = trendPercentage > 0;
  const isDecrease = trendPercentage < 0;
  const isNeutral = trendPercentage === 0;

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
             <div className="text-2xl font-bold text-white mb-1">{totalThisWeek}</div>
             
             {/* <div className={`text-xs px-2 py-1 rounded border font-medium flex items-center gap-1 w-fit ml-auto transition-colors
                ${isIncrease ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' : ''}
                ${isDecrease ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : ''}
                ${isNeutral ? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' : ''}
             `}>
                {isIncrease && <TrendingUp size={12} />}
                {isDecrease && <TrendingDown size={12} />}
                {isNeutral && <Minus size={12} />}
                
                {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
             </div> */}
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