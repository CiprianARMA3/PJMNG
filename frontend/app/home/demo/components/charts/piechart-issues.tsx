"use client";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const data = [
    { day: 'Mon', issues: 3 },
    { day: 'Tue', issues: 5 },
    { day: 'Wed', issues: 2 },
    { day: 'Thu', issues: 8 },
    { day: 'Fri', issues: 4 },
    { day: 'Sat', issues: 1 },
    { day: 'Sun', issues: 2 },
];

const totalThisWeek = 25;
const trendPercentage: number = 12.5;
const dailyAverage = totalThisWeek / 7;
const isIncrease = trendPercentage > 0;
const isDecrease = trendPercentage < 0;
const isNeutral = trendPercentage === 0;

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#161616] light:bg-white border border-white/10 light:border-gray-200 p-3 rounded-lg shadow-xl backdrop-blur-sm">
                <p className="text-white/40 light:text-gray-500 text-[10px] uppercase font-bold mb-1">{label}</p>
                <p className="text-white light:text-black font-bold text-sm">
                    {payload[0].value.toLocaleString()} <span className="text-rose-400 font-normal text-xs">issues</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function IssuesBarChart() {
    return (
        <div className="bg-[#0a0a0a] light:bg-white light:border light:border-gray-200 rounded-xl p-6 h-full min-h-[400px] flex flex-col relative overflow-hidden group/container">
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

            <div className="flex items-start justify-between mb-8 z-10">
                <div>
                    <h3 className="text-white light:text-black font-bold text-lg tracking-tight">Reported Issues</h3>
                    <p className="text-white/40 light:text-gray-500 text-xs font-medium uppercase tracking-wider mt-1">Project issues (Weekly)</p>
                </div>

                <div className="text-right relative group cursor-help z-20">
                    <div className="text-2xl font-bold text-white light:text-black">
                        {totalThisWeek.toLocaleString()}
                    </div>

                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isIncrease ? 'bg-rose-500 animate-pulse' :
                            isDecrease ? 'bg-emerald-500' : 'bg-zinc-500'
                            }`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${isIncrease ? 'text-rose-400' :
                            isDecrease ? 'text-emerald-400' : 'text-zinc-400'
                            }`}>
                            Weekly Trend <Info size={10} className="text-white/40 light:text-gray-400" />
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={32}>
                        <defs>
                            <linearGradient id="issuesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                                <stop offset="100%" stopColor="#be123c" stopOpacity={0.6} />
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
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--chart-cursor, #ffffff05)' }} />

                        <ReferenceLine y={dailyAverage} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} />

                        <Bar
                            dataKey="issues"
                            fill="url(#issuesGradient)"
                            radius={[4, 4, 0, 0]}
                            className="hover:brightness-110 transition-all duration-300"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5 light:border-gray-200">
                <div>
                    <p className="text-white/30 light:text-gray-400 text-[10px] uppercase tracking-wider font-bold mb-1">Daily Avg</p>
                    <p className="text-white light:text-black font-mono text-sm">{dailyAverage.toFixed(1)} <span className="text-white/40 light:text-gray-500 text-xs">issues</span></p>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                        {isIncrease && <TrendingUp size={12} className="text-rose-400" />}
                        {isDecrease && <TrendingDown size={12} className="text-emerald-400" />}
                        {isNeutral && <Minus size={12} className="text-zinc-400" />}
                        <p className="text-white/30 light:text-gray-400 text-[10px] uppercase tracking-wider font-bold">Week Trend</p>
                    </div>
                    <p className={`font-mono text-sm ${isIncrease ? 'text-rose-400' :
                        isDecrease ? 'text-emerald-400' : 'text-zinc-400'
                        }`}>
                        {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
                    </p>
                </div>
            </div>
        </div>
    );
}
