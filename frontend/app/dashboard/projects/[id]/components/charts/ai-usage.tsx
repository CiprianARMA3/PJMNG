'use client';

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

const AITokenUsageChart = () => {
  const dailyAverage = data.reduce((sum, day) => sum + day.tokens, 0) / data.length;
  const weeklyTotal = data.reduce((sum, day) => sum + day.tokens, 0);
  const remainingCredits = 100000 - weeklyTotal;

  return (
    <div className="bg-transparent border border-white/10 rounded-lg p-6 h-full min-h-[400px] flex flex-col">
      {/* Credits Header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white/2 rounded-lg border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
          <span className="text-white font-semibold text-lg">AI CREDITS</span>
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-2xl">{remainingCredits.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">remaining</div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-white font-semibold text-lg text-center mb-6">Token Usage This Week</h3>
        <div className="flex-1 flex items-end">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data}
              margin={{ top: 0, right: 20, left: 20, bottom: 10 }}
              barSize={32}
            >
              <defs>
                <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  <stop offset="50%" stopColor="#6366f1" stopOpacity={0.7}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="2 2" 
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
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                width={35}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={false}
                contentStyle={{ 
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
                formatter={(value) => [`${value} tokens`, '']}
                labelFormatter={(label) => `${label}`}
              />
              {/* Daily Average Line */}
              <ReferenceLine 
                y={dailyAverage} 
                stroke="#10b981" 
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
              <Bar 
                dataKey="tokens" 
                fill="url(#aiGradient)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Averages Footer - Smaller and Compact */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
        <div className="text-center p-2 bg-white/5 rounded-lg border border-white/10">
          <div className="text-gray-400 text-xs mb-1">Daily Avg</div>
          <div className="text-green-400 font-bold text-lg">{dailyAverage.toFixed(0)}</div>
        </div>
        <div className="text-center p-2 bg-white/5 rounded-lg border border-white/10">
          <div className="text-gray-400 text-xs mb-1">Weekly Total</div>
          <div className="text-blue-400 font-bold text-lg">{(weeklyTotal / 1000).toFixed(1)}k</div>
        </div>
      </div>
    </div>
  );
};

export default AITokenUsageChart;