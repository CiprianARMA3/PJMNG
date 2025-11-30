"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardCard({ title, subtitle, icon: Icon, action, children, className }: DashboardCardProps) {
  return (
    <div className={`bg-[#0a0a0a] border border-white/5 rounded-xl flex flex-col overflow-hidden shadow-sm hover:border-white/10 transition-colors duration-300 group ${className}`}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="text-white/40 group-hover:text-purple-400 transition-colors">
                <Icon size={15} />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-white/90 tracking-tight leading-none">{title}</h3>
            {subtitle && <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mt-1">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-h-0 relative p-5 flex flex-col">
        {children}
      </div>
    </div>
  );
}

// A unified Tooltip for all your Recharts to look consistent
export const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-lg shadow-2xl min-w-[140px] z-50">
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2 pb-2 border-b border-white/5">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
            <span className="text-white/70 text-xs capitalize flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
              {entry.name}
            </span>
            <span className="text-white font-mono text-xs font-medium">{Number(entry.value).toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};