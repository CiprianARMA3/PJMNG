'use client';

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

const IssuesBarChart = () => {
  useEffect(() => {
    // Remove recharts default hover styles
    const style = document.createElement('style');
    style.textContent = `
      .recharts-bar-rectangle:hover { 
        fill: url(#redGradient) !important; 
      }
      .recharts-active-shape { 
        fill: url(#redGradient) !important; 
      }
      .recharts-tooltip-cursor {
        fill: transparent !important;
      }
      .recharts-layer.recharts-bar-rectangle {
        outline: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="bg-transparent border border-white/10 rounded-lg p-6 h-full min-h-[300px] flex flex-col">
      <h3 className="text-white font-semibold text-lg text-center mb-6">Issues This Week</h3>
      <div className="flex-1 flex items-end">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data}
            margin={{ top: 0, right: 20, left: 20, bottom: 10 }}
            barSize={32}
          >
            <defs>
              <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.5}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              vertical={false} 
              horizontal={true}
            />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              width={30}
            />
            <Tooltip
              cursor={false} // This removes the background highlight
              contentStyle={{ 
                backgroundColor: '#0a0a0a',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#ffffff'
              }}
              formatter={(value) => [`${value} issues`, '']}
              labelFormatter={(label) => `${label}`}
            />
            <Bar 
              dataKey="issues" 
              fill="url(#redGradient)"
              radius={[4, 4, 0, 0]}
              onMouseOver={(data, index, e) => {
                // Prevent any default hover behaviors
                e?.stopPropagation();
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IssuesBarChart;