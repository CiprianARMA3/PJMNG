'use client';

import { ChevronLeft, ChevronRight, Clock, MoreHorizontal, Video } from 'lucide-react';

const Calendar = () => {
  // Fixed day sequence to match dates
  const days = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
  const dates = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  
  const events = [
    {
      time: '10:20 AM',
      endTime: '11:00 AM',
      title: 'Project Estimation',
      lead: 'Peter Marcus',
      category: 'Engineering',
      color: 'bg-purple-500',
      status: 'Done'
    },
    {
      time: '04:30 PM',
      endTime: '05:00 PM',
      title: 'Dashboard UI/UX Review',
      lead: 'Bob Smith',
      category: 'Design',
      color: 'bg-pink-500',
      status: 'Upcoming' // Highlights this card
    },
    {
      time: '06:00 PM',
      endTime: '07:30 PM',
      title: 'Marketing Campaign',
      lead: 'Mark Morris',
      category: 'Marketing',
      color: 'bg-blue-500',
      status: 'Later'
    }
  ];

  const today = 26; 

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 z-10">
        <div>
          <h2 className="text-white font-semibold text-lg">Schedule</h2>
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider">October 26, 2025</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/5">
            <ChevronLeft className="w-4 h-4 text-white/60 hover:text-white" />
          </button>
          <button className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-medium text-white transition-colors">
            Today
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/5">
            <ChevronRight className="w-4 h-4 text-white/60 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Calendar Strip */}
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
        {days.map((day, index) => {
          const isToday = dates[index] === today;
          return (
            <div key={index} className="flex flex-col items-center gap-2 cursor-pointer group">
              <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${isToday ? 'text-purple-400' : 'text-white/30 group-hover:text-white/60'}`}>
                {day}
              </span>
              <div className={`
                w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200
                ${isToday 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 scale-110' 
                  : 'text-white/60 hover:bg-white/10 hover:text-white'}
              `}>
                {dates[index]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Events Timeline */}
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        {events.map((event, index) => (
          <div 
            key={index} 
            className={`
              group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer
              ${event.status === 'Upcoming' 
                ? 'bg-white/[0.03] border-white/10 hover:border-purple-500/30' 
                : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5 opacity-80 hover:opacity-100'}
            `}
          >
            {/* Left Color Indicator */}
            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${event.color}`} />

            {/* Time Column */}
            <div className="min-w-[60px] flex flex-col gap-1 pt-0.5">
              <span className={`text-sm font-medium ${event.status === 'Upcoming' ? 'text-white' : 'text-white/60'}`}>
                {event.time.split(' ')[0]}
              </span>
              <span className="text-xs text-white/30">
                {event.endTime.split(' ')[0]}
              </span>
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/5 ${event.status === 'Upcoming' ? 'text-white' : 'text-white/40'}`}>
                  {event.category}
                </span>
                {event.status === 'Upcoming' && (
                   <div className="flex items-center gap-1.5 animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Now</span>
                   </div>
                )}
              </div>
              
              <h3 className={`font-medium truncate mb-2 ${event.status === 'Upcoming' ? 'text-white text-base' : 'text-white/80 text-sm'}`}>
                {event.title}
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-[9px] text-white border border-white/10">
                    {event.lead.charAt(0)}
                  </div>
                  <span className="text-xs text-white/50 truncate max-w-[100px]">
                    by {event.lead}
                  </span>
                </div>

                {/* Hover Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                   <button className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-purple-400 transition-colors" title="Join Meeting">
                      <Video className="w-3.5 h-3.5" />
                   </button>
                   <button className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty State / Add Button */}
        <button className="w-full py-3 border border-dashed border-white/10 rounded-xl text-white/30 text-xs hover:text-white/60 hover:border-white/20 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2">
          <Clock className="w-3 h-3" /> No more events today
        </button>
      </div>
    </div>
  );
};

export default Calendar;