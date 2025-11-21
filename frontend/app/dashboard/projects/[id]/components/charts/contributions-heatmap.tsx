'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', development: 65, marketing: 45, design: 75 },
  { month: 'Feb', development: 78, marketing: 52, design: 68 },
  { month: 'Mar', development: 82, marketing: 61, design: 80 },
  { month: 'Apr', development: 45, marketing: 75, design: 55 },
  { month: 'May', development: 88, marketing: 58, design: 72 },
  { month: 'Jun', development: 72, marketing: 65, design: 85 },
];

export function AreaChartComponent() {
  return (
    <div className="bg-transparent border border-white/10 rounded-lg p-6 h-full min-h-[400px] flex flex-col">
      {/* Title */}
      <h3 className="text-white font-semibold text-lg mb-6">Workflow</h3>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorDev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorMarketing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorDesign" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Area type="monotone" dataKey="development" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDev)" />
            <Area type="monotone" dataKey="marketing" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMarketing)" />
            <Area type="monotone" dataKey="design" stroke="#10b981" fillOpacity={1} fill="url(#colorDesign)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AreaChartComponent;