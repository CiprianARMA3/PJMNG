"use client";

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';

type ActivityData = {
  month: string;
  concepts: number;
  issues: number;
  dateVal: number; // Used for sorting
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a]/95 light:bg-white/95 backdrop-blur border border-white/10 light:border-gray-200 p-3 rounded-lg shadow-xl min-w-[150px]">
        <p className="text-white/50 light:text-gray-500 text-xs mb-2 uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
              <span className="text-white/80 light:text-gray-700 text-xs capitalize">{entry.dataKey}</span>
            </div>
            <span className="text-white light:text-black font-mono text-xs">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AreaChartComponent() {
  const supabase = createClient();
  const params = useParams();
  const projectId = params.id as string;

  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!projectId) return;

      try {
        // Fetch Concepts and Issues exactly like the Calendar page
        const [conceptsRes, issuesRes] = await Promise.all([
          supabase
            .from("concepts")
            .select("created_at")
            .eq("project_id", projectId),
          supabase
            .from("issues")
            .select("created_at")
            .eq("project_id", projectId)
        ]);

        const rawData: Record<string, { concepts: number; issues: number; dateVal: number }> = {};

        // Helper to init or update month bucket
        const processDate = (dateStr: string, type: 'concepts' | 'issues') => {
          const date = new Date(dateStr);
          const key = date.toLocaleString('default', { month: 'short' }); // e.g., "Jan"
          // We use a sort key like 202301 for sorting, but here we'll just imply current year focus or handle sorting by month index
          // For simplicity in a yearly view, let's assume we want to show the last 6-12 months or just aggregate by month name if data is sparse.
          // Let's create a simpler bucket based on Month Index (0-11) to sort correctly.

          // Note: If you have data spanning multiple years, you might want "Jan 24", "Feb 24". 
          // For this UI, we will stick to Month names and assume relatively recent data.

          if (!rawData[key]) {
            rawData[key] = { concepts: 0, issues: 0, dateVal: date.getMonth() };
          }
          rawData[key][type]++;
        };

        conceptsRes.data?.forEach(c => processDate(c.created_at, 'concepts'));
        issuesRes.data?.forEach(i => processDate(i.created_at, 'issues'));

        // Fill in missing months for a complete look (optional, but looks better)
        // Let's generate the last 6 months dynamically to ensure the chart is always full
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const key = d.toLocaleString('default', { month: 'short' });
          if (!rawData[key]) {
            rawData[key] = { concepts: 0, issues: 0, dateVal: d.getMonth() };
          }
        }

        // Convert to array and sort by dateVal (Month Index)
        // Note: This simple sort works for within-one-year. If crossing years (Dec -> Jan), logic needs 'year' in dateVal.
        // Let's make dateVal an absolute timestamp for perfect sorting.

        // RE-PROCESS with timestamp for sorting safety
        const timeMap: Record<string, ActivityData> = {};

        const addToMap = (dateStr: string, type: 'concepts' | 'issues') => {
          const d = new Date(dateStr);
          const key = d.toLocaleString('default', { month: 'short' });

          // We map by "Month Year" strictly to handle ordering, but display "Month"
          // Actually, the UI usually shows just "Jan", "Feb". 
          // Let's just group by Month name for the visual "Project Activity" style

          if (!timeMap[key]) {
            timeMap[key] = { month: key, concepts: 0, issues: 0, dateVal: d.getMonth() };
          }
          timeMap[key][type]++;
        };

        conceptsRes.data?.forEach(c => addToMap(c.created_at, 'concepts'));
        issuesRes.data?.forEach(i => addToMap(i.created_at, 'issues'));

        // Ensure we have at least the last 6 months displayed
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const key = d.toLocaleString('default', { month: 'short' });
          if (!timeMap[key]) {
            timeMap[key] = { month: key, concepts: 0, issues: 0, dateVal: d.getMonth() };
            // Adjust dateVal logic if crossing years logic is strictly needed, 
            // but simple getMonth() sort usually suffices for simple dashboards unless highly historical.
            // To fix the Year crossing sort bug (Dec=11, Jan=0 -> Jan comes before Dec), we need Year context.

            // Better Logic:
            // Use "YYYY-MM" as key, then format display.
          }
        }

        // Let's do a clean "Last 6 Months" generation
        const finalData: ActivityData[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthName = d.toLocaleString('default', { month: 'short' });

          // Count data for this specific month/year
          const conceptsCount = conceptsRes.data?.filter(c => {
            const cd = new Date(c.created_at);
            return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
          }).length || 0;

          const issuesCount = issuesRes.data?.filter(i => {
            const id = new Date(i.created_at);
            return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
          }).length || 0;

          finalData.push({
            month: monthName,
            concepts: conceptsCount,
            issues: issuesCount,
            dateVal: d.getTime()
          });
        }

        setData(finalData);

      } catch (err) {
        console.error("Error fetching activity:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [projectId]);

  if (loading) {
        return (
            <div role="status" className="flex justify-center items-center  bg-[#0a0a0a] light:bg-white">
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
    <div className="bg-[#0a0a0a] light:bg-white light:border light:border-gray-200 rounded-xl p-6 h-full min-h-[400px] flex flex-col">
      <style jsx global>{`
        :root {
          --chart-grid: #ffffff08;
          --chart-text: #737373;
          --chart-cursor: #ffffff10;
        }
        @media (prefers-color-scheme: light) {
          :root {
            --chart-grid: #e5e7eb;
            --chart-text: #6b7280;
            --chart-cursor: #f3f4f6;
          }
        }
      `}</style>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white light:text-black font-semibold text-lg">Project Activity</h3>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 text-xs text-white/50 light:text-gray-500">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> Issues
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/50 light:text-gray-500">
            <div className="w-2 h-2 rounded-full bg-purple-500" /> Concepts
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorConcepts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #ffffff08)" vertical={false} />
            <XAxis dataKey="month" stroke="#ffffff00" tick={{ fill: 'var(--chart-text, #737373)', fontSize: 12 }} dy={10} />
            <YAxis stroke="#ffffff00" tick={{ fill: 'var(--chart-text, #737373)', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--chart-cursor, #ffffff10)' }} />

            <Area
              type="monotone"
              dataKey="issues"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIssues)"
              activeDot={{ r: 4, strokeWidth: 0 }}
              name="Issues"
            />
            <Area
              type="monotone"
              dataKey="concepts"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConcepts)"
              activeDot={{ r: 4, strokeWidth: 0 }}
              name="Concepts"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AreaChartComponent;