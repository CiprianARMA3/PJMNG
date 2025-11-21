'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = () => {
  const days = ['Fr', 'Sa', 'Su', 'Tu', 'Tu', 'We', 'Th', 'Fri', 'Sa', 'Su', 'Mo'];
  const dates = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  
  const events = [
    {
      time: '10:20 - 11:00 AM',
      title: '9 Degree Project Estimation Meeting',
      lead: 'Lead by Peter Marcus'
    },
    {
      time: '16:30 - 17:00 PM',
      title: 'Dashboard UI/UX Design Review',
      lead: 'Lead by Bob'
    },
    {
      time: '12:00 - 13:40 AM',
      title: 'Marketing Campaign Discussion',
      lead: 'Lead by Mark Morris'
    }
  ];

  const today = 26; // Highlight today's date

  return (
    <div className="bg-transparent border border-white/10 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-white font-semibold text-2xl mb-1">What's up Today</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white font-medium">Report Cechter</span>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-11 gap-1 mb-8">
        {days.map((day, index) => (
          <div key={index} className="text-center group">
            <div className="text-gray-400 text-xs mb-2">{day}</div>
            <div className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium mx-auto transition-all
              ${dates[index] === today 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                : 'text-white hover:bg-white/10 cursor-pointer group-hover:scale-110'}`}
            >
              {dates[index]}
            </div>
          </div>
        ))}
      </div>

      {/* Events */}
      <div className="space-y-3">
        {events.map((event, index) => (
          <div key={index} className="flex items-start gap-4 bg-white/2 p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors group">
            <div className="min-w-[140px] flex-shrink-0">
              <div className="text-white font-medium text-sm bg-white/5 px-3 py-1 rounded-lg text-center">
                {event.time}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-1 truncate">{event.title}</h3>
              <p className="text-gray-400 text-sm">{event.lead}</p>
            </div>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors px-3 py-1 rounded-lg hover:bg-blue-500/10">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;