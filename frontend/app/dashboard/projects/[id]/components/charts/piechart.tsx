"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';

type ChartData = {
  name: string;
  value: number;
  color: string;
};

// Vibrant palette to cycle through (No greys)
const COLOR_PALETTE = [
  '#10b981', // Violet
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#d946ef', // Fuchsia
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#84cc16', // Lime
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a]/95 light:bg-white/95 backdrop-blur border border-white/10 light:border-gray-200 p-3 rounded-lg shadow-xl">
        <p className="text-white light:text-gray-900 font-medium text-sm mb-1 capitalize">{payload[0].name}</p>
        <p className="text-white/60 light:text-gray-500 text-xs">
          {payload[0].value} {payload[0].value === 1 ? 'member' : 'members'}
        </p>
      </div>
    );
  }
  return null;
};

export default function TeamCompositionChart() {
  const supabase = createClient();
  const params = useParams();
  const projectId = params.id as string;

  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to assign colors consistently based on role name
  const getColorForRole = (role: string, index: number) => {
    // 1. Check if it's a standard role with a preferred color
    const standardColors: Record<string, string> = {
      admin: '#8b5cf6',   // Purple
      member: '#3b82f6',  // Blue
      viewer: '#06b6d4',  // Cyan
    };

    if (standardColors[role.toLowerCase()]) {
      return standardColors[role.toLowerCase()];
    }

    // 2. Otherwise cycle through the palette
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!projectId) return;

      try {
        const { data: members, error } = await supabase
          .from('project_users')
          .select('role_info')
          .eq('project_id', projectId);

        if (error) throw error;

        // Aggregate roles
        const roleCounts: Record<string, number> = {};

        members?.forEach((member) => {
          let roleName = 'viewer'; // Default fallback

          if (typeof member.role_info === 'string') {
            try {
              const parsed = JSON.parse(member.role_info);
              roleName = parsed.role || roleName;
            } catch {
              if (member.role_info.length > 0) roleName = member.role_info;
            }
          } else if (typeof member.role_info === 'object' && member.role_info !== null) {
            roleName = (member.role_info as any).role || roleName;
          }

          roleName = roleName.toLowerCase();
          roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
        });

        // Transform to ChartData with dynamic colors
        const formattedData: ChartData[] = Object.entries(roleCounts).map(([name, value], index) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: getColorForRole(name, index)
        }));

        // Sort by value desc
        formattedData.sort((a, b) => b.value - a.value);

        setData(formattedData);
      } catch (err) {
        console.error("Error fetching team composition:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [projectId]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

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

  if (total === 0) {
    return (
      <div className="bg-[#0a0a0a] light:bg-white light:border light:border-gray-200 rounded-xl p-6 h-full flex flex-col items-center justify-center">
        <p className="text-white/40 light:text-gray-500 text-sm">No team members found.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] light:bg-white light:border light:border-gray-200 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white light:text-gray-900 font-semibold text-lg">Team Composition</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Chart */}
        <div className="h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-white light:text-gray-900">{total}</span>
            <span className="text-xs text-white/40 light:text-gray-500 uppercase tracking-wider font-medium">Members</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full mt-4 space-y-1 max-h-[150px] overflow-y-auto scrollbar-hide">
          {data.map((item) => {
            const percentage = ((item.value / total) * 100).toFixed(0);
            return (
              <div key={item.name} className="flex items-center justify-between p-2 rounded hover:bg-white/5 light:hover:bg-gray-50 transition-colors cursor-default group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shadow-lg shadow-white/10 light:shadow-black/5" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-white/70 light:text-gray-600 group-hover:text-white light:group-hover:text-gray-900 transition-colors">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white light:text-gray-900">{item.value}</span>
                  <span className="text-xs text-white/30 light:text-gray-400 w-8 text-right">{percentage}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}