'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Management', value: 2, color: '#8b5cf6' },
  { name: 'Frontend', value: 10, color: '#3b82f6' },
  { name: 'Backend', value: 10, color: '#06b6d4' },
];

export default function TeamCompositionChart() {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p className="text-blue-400">{payload[0].value} members</p>
          <p className="text-gray-400 text-sm">
            {((payload[0].value / total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-transparent border border-white/10 rounded-lg p-6">
      {/* Title */}
      <h3 className="text-white font-semibold text-lg mb-8">Team Composition</h3>
      
      <div className="flex items-start gap-8">
        {/* Donut Chart - Left */}
        <div className="flex-1 max-w-[180px] h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip content={renderTooltip} />
              {/* Center text */}
              <text 
                x="50%" 
                y="45%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="fill-white text-xs font-medium"
              >
                Total
              </text>
              <text 
                x="50%" 
                y="60%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="fill-white text-xl font-bold"
              >
                {total}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Labels with amounts - Right */}
        <div className="flex-1">
          <div className="space-y-2">
            {data.map((item) => (
              <div 
                key={item.name} 
                className="flex items-center justify-between group px-3 py-2 rounded-lg transition-all duration-200 hover:bg-[#0a0a0a] cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-3 h-3 rounded-sm transition-transform group-hover:scale-110"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-white font-medium text-m">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold text-m">{item.value}</div>
                  <div className="text-gray-400 text-xs">
                    {((item.value / total) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total Separator */}
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 hover:bg-[#0a0a0a] cursor-pointer">
                <span className="text-white font-semibold text-sm">Total Members</span>
                <div className="text-right">
                  <div className="text-white font-bold text-sm">{total}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}