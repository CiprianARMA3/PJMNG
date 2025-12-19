"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { month: 'Jul', concepts: 12, issues: 8 },
    { month: 'Aug', concepts: 18, issues: 15 },
    { month: 'Sep', concepts: 15, issues: 22 },
    { month: 'Oct', concepts: 25, issues: 18 },
    { month: 'Nov', concepts: 30, issues: 25 },
    { month: 'Dec', concepts: 22, issues: 30 },
];

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

export default function AreaChartComponent() {
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
