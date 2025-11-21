"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', development: 65, marketing: 45, design: 75 },
  { month: 'Feb', development: 78, marketing: 52, design: 68 },
  { month: 'Mar', development: 82, marketing: 61, design: 80 },
  { month: 'Apr', development: 45, marketing: 75, design: 55 },
  { month: 'May', development: 88, marketing: 58, design: 72 },
  { month: 'Jun', development: 72, marketing: 65, design: 85 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a]/95 backdrop-blur border border-white/10 p-3 rounded-lg shadow-xl min-w-[150px]">
        <p className="text-white/50 text-xs mb-2 uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
              <span className="text-white/80 text-xs capitalize">{entry.dataKey}</span>
            </div>
            <span className="text-white font-mono text-xs">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AreaChartComponent() {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 h-full min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold text-lg">Workflow Activity</h3>
        <div className="flex gap-2">
           <div className="flex items-center gap-1.5 text-xs text-white/50">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Dev
           </div>
           <div className="flex items-center gap-1.5 text-xs text-white/50">
              <div className="w-2 h-2 rounded-full bg-purple-500" /> Mkt
           </div>
           <div className="flex items-center gap-1.5 text-xs text-white/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Dsn
           </div>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMarketing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDesign" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis dataKey="month" stroke="#ffffff00" tick={{ fill: '#737373', fontSize: 12 }} dy={10} />
            <YAxis stroke="#ffffff00" tick={{ fill: '#737373', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff10' }} />
            
            <Area type="monotone" dataKey="development" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDev)" activeDot={{ r: 4, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="marketing" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorMarketing)" activeDot={{ r: 4, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="design" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDesign)" activeDot={{ r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AreaChartComponent;