"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Management', value: 2, color: '#8b5cf6' }, // Purple
  { name: 'Frontend', value: 10, color: '#3b82f6' },  // Blue
  { name: 'Backend', value: 10, color: '#06b6d4' },   // Cyan
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a]/95 backdrop-blur border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-white font-medium text-sm mb-1">{payload[0].name}</p>
        <p className="text-white/60 text-xs">
          {payload[0].value} members
        </p>
      </div>
    );
  }
  return null;
};

export default function TeamCompositionChart() {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-[#0a0a0a]  rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Team</h3>
        <button className="text-xs text-white/40 hover:text-white transition-colors">View All</button>
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
            <span className="text-3xl font-bold text-white">{total}</span>
            <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full mt-4 space-y-1">
          {data.map((item) => {
             const percentage = ((item.value / total) * 100).toFixed(0);
             return (
              <div key={item.name} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors cursor-default group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shadow-lg shadow-white/10" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-white/70 group-hover:text-white transition-colors">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">{item.value}</span>
                  <span className="text-xs text-white/30 w-8 text-right">{percentage}%</span>
                </div>
              </div>
             )
          })}
        </div>
      </div>
    </div>
  );
}