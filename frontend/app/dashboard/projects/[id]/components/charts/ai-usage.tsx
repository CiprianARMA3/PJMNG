"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const data = [
  { day: 'Mon', tokens: 4500 },
  { day: 'Tue', tokens: 7200 },
  { day: 'Wed', tokens: 3800 },
  { day: 'Thu', tokens: 6100 },
  { day: 'Fri', tokens: 8900 },
  { day: 'Sat', tokens: 2800 },
  { day: 'Sun', tokens: 1900 },
];

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

const AITokenUsageChart = () => {
  const dailyAverage = data.reduce((sum, day) => sum + day.tokens, 0) / data.length;
  const weeklyTotal = data.reduce((sum, day) => sum + day.tokens, 0);
  const remainingCredits = 100000 - weeklyTotal;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 h-full min-h-[400px] flex flex-col relative overflow-hidden group">
      {/* Subtle glow effect behind */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-8 z-10">
        <div>
          <h3 className="text-white font-semibold text-lg">Token Usage</h3>
          <p className="text-white/40 text-sm">Weekly consumption monitoring</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
            {remainingCredits.toLocaleString()}
          </div>
          <div className="flex items-center justify-end gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
             <span className="text-purple-400 text-xs font-medium uppercase tracking-wide">Credits Left</span>
          </div>
        </div>
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
            <ReferenceLine y={dailyAverage} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Bar 
              dataKey="tokens" 
              fill="url(#aiGradient)" 
              radius={[6, 6, 0, 0]} 
            />
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

export default AITokenUsageChart;