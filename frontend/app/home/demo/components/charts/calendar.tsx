"use client";

import { useState, useMemo } from "react";
import {
    Calendar as CalendarIcon, Table as TableIcon,
    X, ChevronLeft, ChevronRight,
    Clock, Video, ExternalLink, Minimize2, Maximize2, Tag as TagIcon
} from "lucide-react";

const mockTasks = [
    {
        id: "1",
        title: "Team Sync",
        task_date: new Date().toISOString().split('T')[0],
        start_time: "10:00",
        end_time: "11:00",
        description: "Weekly team synchronization meeting.",
        issue: { type: "Feature" },
        metadata: { tags: [{ name: "Meeting", color: "#8b5cf6" }] }
    },
    {
        id: "2",
        title: "Bug Fix: Login Issue",
        task_date: new Date().toISOString().split('T')[0],
        start_time: "14:00",
        end_time: "16:00",
        description: "Fixing the critical login bug reported by users.",
        issue: { type: "Bug" },
        metadata: { tags: [{ name: "Critical", color: "#ef4444" }] }
    }
];

export default function ProjectCalendar() {
    const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [numDaysInView, setNumDaysInView] = useState(7);
    const [hourHeight, setHourHeight] = useState(60);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    const HOURS = Array.from({ length: 24 }, (_, i) => i);

    const dateStrip = useMemo(() => {
        const days = [];
        const msPerDay = 24 * 60 * 60 * 1000;
        for (let i = 0; i < numDaysInView; i++) {
            days.push(new Date(startDate.getTime() + i * msPerDay));
        }
        return days;
    }, [startDate, numDaysInView]);

    const isSameDay = (d1: Date, dateStr: string) => {
        const d2 = new Date(dateStr);
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    };

    return (
        <div className="h-[600px] bg-[#0a0a0a] light:bg-white light:border light:border-gray-200 rounded-xl flex flex-col overflow-hidden font-sans shadow-inner relative">
            <div className="flex-none h-12 px-4 border-b border-white/5 light:border-gray-200 flex items-center justify-between bg-[#0a0a0a] light:bg-white">
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#161616] light:bg-gray-100 rounded-md border border-white/5 light:border-gray-200 p-0.5">
                        <button onClick={() => setStartDate(new Date(startDate.getTime() - 24 * 60 * 60 * 1000))} className="p-1 hover:bg-white/10 light:hover:bg-gray-200 rounded text-white/60 light:text-gray-500"><ChevronLeft size={14} /></button>
                        <button onClick={() => setStartDate(new Date())} className="px-2 text-[10px] font-bold uppercase text-white/60 light:text-gray-600 hover:text-white light:hover:text-black">Today</button>
                        <button onClick={() => setStartDate(new Date(startDate.getTime() + 24 * 60 * 60 * 1000))} className="p-1 hover:bg-white/10 light:hover:bg-gray-200 rounded text-white/60 light:text-gray-500"><ChevronRight size={14} /></button>
                    </div>
                    <h2 className="text-xs font-semibold text-white/80 light:text-gray-800">
                        {startDate.toLocaleString('default', { month: 'short', day: 'numeric' })}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-[#161616] light:bg-gray-100 rounded-md border border-white/5 light:border-gray-200 p-0.5">
                        <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md text-white/60 light:text-gray-500 transition-all ${viewMode === 'calendar' ? 'bg-white/10 light:bg-white light:shadow-sm text-white light:text-black' : 'hover:text-white light:hover:text-black'}`}><CalendarIcon size={12} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md text-white/60 light:text-gray-500 transition-all ${viewMode === 'table' ? 'bg-white/10 light:bg-white light:shadow-sm text-white light:text-black' : 'hover:text-white light:hover:text-black'}`}><TableIcon size={12} /></button>
                    </div>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <div className="flex-1 overflow-y-auto bg-[#0a0a0a] light:bg-white relative flex flex-col">
                    <div className="sticky top-0 z-40 bg-[#0a0a0a] light:bg-white border-b border-white/5 light:border-gray-200 flex flex-none h-8">
                        <div className="w-10 flex-none border-r border-white/5 light:border-gray-200 bg-[#0a0a0a] light:bg-white" />
                        <div className="flex-1 flex">
                            {dateStrip.map((day, i) => (
                                <div key={i} className="flex-1 border-r border-white/5 light:border-gray-200 flex items-center justify-center gap-1.5 last:border-r-0">
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-white/40 light:text-gray-500">{day.toLocaleString('default', { weekday: 'short' })}</span>
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white/80 light:text-gray-800">{day.getDate()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-1 relative" style={{ height: 24 * hourHeight }}>
                        <div className="w-10 flex-none border-r border-white/5 light:border-gray-200 bg-[#0a0a0a] light:bg-white relative">
                            {HOURS.map(h => (
                                <div key={h} className="absolute w-full text-right pr-1.5 text-[9px] font-medium text-white/20 light:text-gray-400" style={{ top: h * hourHeight, transform: 'translateY(-50%)' }}>
                                    {h}
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 relative">
                            {HOURS.map(h => (
                                <div key={h} className="absolute w-full border-b border-white/5 light:border-gray-200" style={{ top: h * hourHeight, height: hourHeight }}></div>
                            ))}
                            <div className="absolute inset-0 flex">
                                {dateStrip.map((day, colIndex) => {
                                    const dayTasks = mockTasks.filter(t => isSameDay(day, t.task_date));
                                    return (
                                        <div key={colIndex} className="flex-1 border-r border-white/5 light:border-gray-200 last:border-r-0 relative h-full">
                                            {dayTasks.map(task => {
                                                const startH = parseInt(task.start_time.split(':')[0]);
                                                const startM = parseInt(task.start_time.split(':')[1]);
                                                const endH = parseInt(task.end_time.split(':')[0]);
                                                const endM = parseInt(task.end_time.split(':')[1]);
                                                const top = (startH + startM / 60) * hourHeight;
                                                const height = ((endH + endM / 60) - (startH + startM / 60)) * hourHeight;
                                                return (
                                                    <div
                                                        key={task.id}
                                                        onClick={() => setSelectedTask(task)}
                                                        style={{ top: `${top}px`, height: `${height}px`, width: '100%' }}
                                                        className="absolute rounded-[3px] px-1.5 py-1 cursor-pointer transition-all border-l-2 bg-purple-600/10 border-purple-500 text-purple-100 overflow-hidden flex flex-col justify-start hover:brightness-110 shadow-sm"
                                                    >
                                                        <span className="text-[10px] font-bold truncate leading-tight">{task.title}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-auto p-2">
                    <table className="w-full text-left text-xs text-white/70 light:text-gray-600 border-collapse">
                        <thead className="text-[9px] uppercase font-bold text-white/40 light:text-gray-500 bg-[#0a0a0a] light:bg-gray-50 sticky top-0 border-b border-white/5 light:border-gray-200 z-10">
                            <tr>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Event</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 light:divide-gray-200">
                            {mockTasks.map(task => (
                                <tr key={task.id} className="hover:bg-[#111] light:hover:bg-gray-50 cursor-pointer">
                                    <td className="px-3 py-2 font-mono text-[10px] text-white/50 light:text-gray-500">{task.task_date}</td>
                                    <td className="px-3 py-2 font-medium text-white light:text-gray-900">{task.title}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
