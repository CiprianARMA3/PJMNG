"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect } from 'react';

const data = [
  { day: 'Mon', issues: 12 },
  { day: 'Tue', issues: 19 },
  { day: 'Wed', issues: 8 },
  { day: 'Thu', issues: 15 },
  { day: 'Fri', issues: 11 },
  { day: 'Sat', issues: 5 },
  { day: 'Sun', issues: 3 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a]/90 backdrop-blur border border-white/10 p-2 rounded-md shadow-lg">
        <p className="text-white/60 text-[10px] mb-1">{label}</p>
        <p className="text-rose-400 font-bold text-sm">
          {payload[0].value} <span className="text-white font-normal">Issues</span>
        </p>
      </div>
    );
  }
  return null;
};

const IssuesBarChart = () => {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 h-full min-h-[300px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-white font-semibold text-lg">Reported Issues</h3>
         <span className="text-xs text-rose-400 bg-rose-400/10 px-2 py-1 rounded border border-rose-400/20 font-medium">+2.4%</span>
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
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#525252', fontSize: 11 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#525252', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
            <Bar 
              dataKey="issues" 
              fill="url(#roseGradient)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IssuesBarChart;