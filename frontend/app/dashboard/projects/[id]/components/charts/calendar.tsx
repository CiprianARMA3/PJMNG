'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Clock, MoreHorizontal, Calendar as CalendarIcon, Loader2, Tag as TagIcon, X, Users, Info, ExternalLink } from 'lucide-react';

// --- GOOGLE API CONFIGURATION (Sample Keys Provided) ---
// IMPORTANT: These are sample keys and will not work. 
// Replace them with your actual Google API Key and Calendar ID to fetch live data.
const SAMPLE_API_KEY = "AIzaSyD_ExampleNonFunctionalKey_ReplaceMe12345";
const SAMPLE_CALENDAR_ID = "example@group.calendar.google.com";

const API_KEY = SAMPLE_API_KEY;
const CALENDAR_ID = SAMPLE_CALENDAR_ID;
const BASE_URL = "https://www.googleapis.com/calendar/v3/calendars";
const IS_SAMPLE_KEY = API_KEY === SAMPLE_API_KEY;
// -----------------------------------------------------------


// --- Type Definitions ---

type ApiEvent = {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  organizer: { email: string };
  colorId?: string;
  htmlLink?: string; // Added for external link
};

type Creator = {
  id: string;
  name: string | null;
  surname: string | null;
  metadata: { [key: string]: any; };
}

type Concept = {
  id: string;
  title: string;
  description?: string | null;
  creator: Creator | null;
};

interface Project {
  id: string;
  name: string;
  description: string;
  created_by: string;
  metadata: { [key: string]: any; };
}

type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  description: string | null | undefined;
  lead: string;
  category: string;
  categoryColor: string;
  status: 'Done' | 'Upcoming' | 'Later' | 'Overdue';
  concept: Concept; 
  htmlLink?: string; // Added to main event type
};

// Global map to ensure color consistency across categories (mock color logic)
const categoryColorMap: { [key: string]: string } = {};
const defaultColors = [
    '#A855F7', // purple (1) - Default GCal 7
    '#EC4899', // pink (2) - Default GCal 11
    '#3B82F6', // blue (3) - Default GCal 9
    '#10B981', // green (4) - Default GCal 10
    '#F59E0B', // yellow (5) - Default GCal 4
    '#EF4444', // red (6) - Default GCal 8
    '#0EA5E9', // sky (7) - Default GCal 5
    '#EAB308', // amber (8) - Default GCal 6
    '#F472B6', // rose (9) - Default GCal 3
    '#22C55E', // emerald (10) - Default GCal 2
    '#6366F1', // indigo (11) - Default GCal 1
];

// --- Helper Functions ---

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const isDateInRange = (date: Date, start: Date, end: Date) => {
    // Normalize date to start of day for accurate comparison
    const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    
    const dateOnly = normalizeDate(date);
    const startOnly = normalizeDate(start);
    const endOnly = normalizeDate(end);
    
    // We check if the day is between the start and end days (inclusive)
    return dateOnly >= startOnly && dateOnly <= endOnly;
};


// --- Calendar Detail Modal Component ---

const EventDetailModal = ({ event, onClose }: { event: CalendarEvent; onClose: () => void }) => {
    if (!event) return null;

    const formattedStart = event.start.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const formattedEnd = event.end.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    return (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100">
                
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between" 
                     style={{ borderLeft: `5px solid ${event.categoryColor}`, borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem', paddingLeft: '20px' }}>
                    
                    <h3 className="text-2xl font-bold text-white leading-tight">{event.title}</h3>
                    
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-5 space-y-5">
                    
                    {/* Tags and Status */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2">
                            <TagIcon className="w-4 h-4 text-white/50" />
                            <span className="text-sm px-3 py-1 rounded-full font-medium text-white/80 border" 
                                style={{ color: event.categoryColor, borderColor: event.categoryColor, background: `${event.categoryColor}1a` }}>
                                {event.category}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-white/50" />
                            <span className="text-sm px-3 py-1 rounded-full bg-white/10 font-medium text-white/80">
                                Status: {event.status}
                            </span>
                        </div>
                    </div>

                    {/* Time Details */}
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-white/70 font-semibold mb-1">
                            <Clock className="w-4 h-4" /> Time
                        </h4>
                        <div className="ml-6 space-y-1 text-white/80">
                            <p className="font-semibold text-sm"><span className="text-white/50 w-12 inline-block">Start:</span> {formattedStart}</p>
                            <p className="font-semibold text-sm"><span className="text-white/50 w-12 inline-block">End:</span> {formattedEnd}</p>
                        </div>
                    </div>

                    {/* Organizer/Lead */}
                    <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-white/70 font-semibold mb-1">
                            <Users className="w-4 h-4" /> Organizer
                        </h4>
                        <p className="text-sm text-white/80 ml-6">
                             {event.lead}
                        </p>
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="pt-2 border-t border-white/10 space-y-2">
                            <h4 className="flex items-center gap-2 text-white/70 font-semibold">
                                <Info className="w-4 h-4" /> Description
                            </h4>
                            <p className="text-sm text-white/60 ml-6 whitespace-pre-wrap">{event.description}</p>
                        </div>
                    )}
                    
                    {/* External Link (if available) */}
                    {event.htmlLink && (
                        <div className="pt-4 border-t border-white/10">
                            <a 
                                href={event.htmlLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-purple-900/40"
                            >
                                View in Google Calendar <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Calendar Component ---

const ProjectCalendar = ({ events, project, statusInfo }: { events: CalendarEvent[]; project: Project; statusInfo: React.ReactNode }) => {
  // We use the start of the current week as the state anchor
  const getStartOfWeek = (date: Date) => {
    const day = date.getDay(); // 0 for Sunday, 1 for Monday
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to start on Monday
    const newDate = new Date(date.setDate(diff));
    newDate.setHours(0, 0, 0, 0); // Normalize time
    return newDate;
  };

  const [startDate, setStartDate] = useState(getStartOfWeek(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const MS_PER_MINUTE = 60000;
  const TIME_SLOT_HEIGHT_PX = 60; // 60px per hour
  const START_HOUR = 8;
  const END_HOUR = 20; // Up to 8 PM (21 is the hour label)
  const TOTAL_HOURS = END_HOUR - START_HOUR;

  // Logic to generate a 7-day strip (Monday to Sunday)
  const dateStrip = useMemo(() => {
    const strip = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    const startTime = startDate.getTime();

    for (let i = 0; i < 7; i++) {
        const date = new Date(startTime + i * msPerDay);
        strip.push(date);
    }
    return strip;
  }, [startDate]);


  // Filter events to the current 7-day view
  const eventsInView = useMemo(() => {
    // Optimization: Filter once per week view
    return events.filter(event => 
        dateStrip.some(day => isDateInRange(day, event.start, event.end))
    );
  }, [events, dateStrip]);


  // Helper functions for navigation
  const navigateWeek = (direction: number) => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + direction * 7);
    setStartDate(newDate);
  };

  const goToThisWeek = () => {
    setStartDate(getStartOfWeek(new Date()));
  };

  // Function to calculate event position and height
  const getEventStyle = (event: CalendarEvent, dayDate: Date) => {
    
    // Check if the event starts or ends on this specific day
    const eventStartsToday = isSameDay(event.start, dayDate);
    const eventEndsToday = isSameDay(event.end, dayDate);

    // Determine effective start/end times for positioning
    let startHour = event.start.getHours();
    let startMinute = event.start.getMinutes();
    let endHour = event.end.getHours();
    let endMinute = event.end.getMinutes();

    // If event spans multiple days, treat its start/end time as the edges of the day for visualization
    if (!eventStartsToday && isDateInRange(dayDate, event.start, event.end)) {
        startHour = START_HOUR;
        startMinute = 0;
    }
    if (!eventEndsToday && isDateInRange(dayDate, event.start, event.end)) {
        endHour = END_HOUR;
        endMinute = 59; // Treat as ending right before next hour/day
    }

    // Clip to viewable hours (8 AM to 8 PM)
    if (startHour < START_HOUR) {
        startHour = START_HOUR;
        startMinute = 0;
    }
    if (endHour > END_HOUR) {
        endHour = END_HOUR;
        endMinute = 0;
    } else if (endHour === END_HOUR && endMinute > 0) {
        // Events ending at 8:xx PM are clipped at the bottom boundary (8:00 PM line)
        endHour = END_HOUR;
        endMinute = 0;
    }

    // Convert to total minutes from the START_HOUR (8 AM)
    const totalMinutesFromStart = (startHour - START_HOUR) * 60 + startMinute;
    const top = (totalMinutesFromStart / 60) * TIME_SLOT_HEIGHT_PX;

    // Calculate duration (height)
    const durationMinutes = Math.max(0, (endHour * 60 + endMinute) - (startHour * 60 + startMinute));
    const height = (durationMinutes / 60) * TIME_SLOT_HEIGHT_PX;

    // Calculate time remaining in minutes from day start (8:00 AM) to event start time (for z-index)
    const timeCode = startHour * 60 + startMinute;

    return {
        top: `${top}px`,
        height: `${Math.max(25, height)}px`, // Min height 25px
        backgroundColor: event.categoryColor,
        borderColor: event.categoryColor,
        // Z-index based on time: later events appear on top of earlier ones if they overlap visually.
        // Also use a secondary sort (duration) to keep shorter, more recent events on top.
        zIndex: 100 + timeCode - Math.floor(durationMinutes / 10), 
    };
  };

  // Calculate the vertical position of the current time marker
  const currentTimeMarkerStyle = useMemo(() => {
    const now = new Date();
    const isThisWeek = isSameDay(getStartOfWeek(now), getStartOfWeek(startDate));
    const isToday = isSameDay(now, dateStrip.find(d => isSameDay(d, now)) || new Date(0));

    if (!isThisWeek || !isToday || now.getHours() < START_HOUR || now.getHours() >= END_HOUR) {
        return null; // Don't show if not this week, not today, or outside hours
    }

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const minutesFromStartHour = (currentHour - START_HOUR) * 60 + currentMinute;
    const top = (minutesFromStartHour / 60) * TIME_SLOT_HEIGHT_PX + 20; // +20 for header height adjustment

    // Find the column index for today
    const todayIndex = dateStrip.findIndex(d => isSameDay(d, now));

    return {
        top: `${top}px`,
        gridColumnStart: todayIndex + 1,
        gridColumnEnd: todayIndex + 2,
    };
  }, [startDate, dateStrip]);
  

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0a0a0a] rounded-xl shadow-inner pt-2">
        
        {/* Detail Modal */}
        {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
        
        {/* Status Info (Moved from top app header) */}
        <div className="p-2 px-4 flex-none z-30 bg-[#0a0a0a]">
            {statusInfo}
        </div>
      
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between p-4 flex-none border-b border-white/5 z-30 bg-[#0a0a0a]">
            <div>
                <h2 className="text-white font-semibold text-lg">Weekly Schedule</h2>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                    {dateStrip[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
            </div>
            
            <div className="flex items-center gap-2">
                <button onClick={() => navigateWeek(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/5">
                    <ChevronLeft className="w-4 h-4 text-white/60 hover:text-white" />
                </button>
                <button 
                    onClick={goToThisWeek}
                    className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 rounded-md text-xs font-medium text-purple-300 transition-colors"
                >
                    This Week
                </button>
                <button onClick={() => navigateWeek(1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/5">
                    <ChevronRight className="w-4 h-4 text-white/60 hover:text-white" />
                </button>
            </div>
        </div>
        
        {/* Calendar Grid Container */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Time Axis (Left) */}
            <div className="w-16 flex-none pr-2 border-r border-white/5 pt-1.5 overflow-hidden bg-[#0a0a0a] z-10">
                {[...Array(TOTAL_HOURS + 1)].map((_, i) => (
                    <div key={i} style={{ height: TIME_SLOT_HEIGHT_PX }} className="flex justify-end items-start text-xs text-white/50 -mt-2">
                        {new Date(0, 0, 0, START_HOUR + i).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' ', '')}
                    </div>
                ))}
            </div>

            {/* Day Columns and Events */}
            <div className="flex-1 relative overflow-x-hidden overflow-y-hidden">
                
                {/* Day Headers (Top) - Sticky */}
                <div className="sticky top-0 left-0 right-0 grid grid-cols-7 border-b border-white/5 flex-none bg-[#0a0a0a] pt-1 pb-2 z-20">
                    {dateStrip.map((date, index) => {
                        const isToday = isSameDay(date, new Date());
                        return (
                            <div key={index} className={`p-2 text-center border-r border-white/5 last:border-r-0 ${isToday ? 'bg-white/5' : ''}`}>
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${isToday ? 'text-purple-400' : 'text-white/40'}`}>
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <div className={`
                                    w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200
                                    ${isToday 
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 scale-105' 
                                        : 'text-white/80'}
                                `}>
                                    {date.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Event Grid (Scrollable Body) */}
                <div className="w-full relative h-[calc(100%-80px)] overflow-y-auto custom-scrollbar">
                    
                    {/* Time Grid Lines (Horizontal) */}
                    {[...Array(TOTAL_HOURS + 1)].map((_, i) => (
                        <div 
                            key={`hour-${i}`} 
                            style={{ height: TIME_SLOT_HEIGHT_PX }} 
                            className="w-full border-t border-white/5 relative"
                        >
                            {/* Minor line for 30 minutes */}
                            {i < TOTAL_HOURS && (
                                <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/10 opacity-50" />
                            )}
                        </div>
                    ))}

                    {/* Current Time Marker (Red line) */}
                    {currentTimeMarkerStyle && (
                        <div 
                            style={{ top: currentTimeMarkerStyle.top, 
                                     gridColumnStart: currentTimeMarkerStyle.gridColumnStart, 
                                     gridColumnEnd: currentTimeMarkerStyle.gridColumnEnd 
                                  }} 
                            className="absolute z-40 h-[1px] bg-red-500 w-full col-span-1 transform -translate-y-1/2"
                        >
                            <div className="absolute left-0 w-2 h-2 rounded-full bg-red-500 -ml-1 -mt-1" />
                        </div>
                    )}


                    {/* Day Separators (Vertical) and Events Layer */}
                    <div className="absolute inset-0 top-0 grid grid-cols-7">
                        {dateStrip.map((dayDate, dayIndex) => (
                            <div key={dayIndex} className="relative border-r border-white/5 last:border-r-0">
                                
                                {/* Render events for this day */}
                                {eventsInView
                                    .filter(e => isDateInRange(dayDate, e.start, e.end))
                                    .map(event => (
                                        <div 
                                            key={event.id}
                                            style={getEventStyle(event, dayDate)}
                                            className={`
                                                absolute w-[95%] left-[2.5%] p-1.5 rounded-lg shadow-xl cursor-pointer transition-all duration-150
                                                border border-2 border-opacity-70 overflow-hidden text-xs
                                                ${event.status === 'Done' ? 'opacity-50 line-through' : 'hover:shadow-2xl hover:scale-[1.01]'}
                                                ${event.categoryColor === '#F59E0B' ? 'text-gray-900' : 'text-white'}
                                            `}
                                            onClick={() => setSelectedEvent(event)}
                                        >
                                            <span className="font-bold block truncate leading-tight">{event.title}</span>
                                            <span className="text-[10px] block opacity-80 leading-tight">{event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        ))}
                    </div>

                    {/* Empty State/Footer, conditionally rendered */}
                    {eventsInView.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                            <button className="py-3 px-6 border border-dashed border-white/20 rounded-xl text-white/50 text-sm hover:text-white/80 hover:border-white/40 hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2">
                                <CalendarIcon className="w-4 h-4" /> No scheduled events this week
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
        `}</style>
    </div>
  );
};


// --- Page Wrapper (Data Fetching and Container) ---

export default function CalendarIntegrationExample() {
  
  const [events, setEvents] = useState<CalendarEvent[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock Project & User Data
  const mockProject: Project = useMemo(() => ({
    id: "mock-project-id",
    name: "Weekly Project Scheduler",
    description: "Sample project showing Google API events.",
    created_by: "api-user",
    metadata: {},
  }), []);
  
  const mockUser: Creator = useMemo(() => ({
      id: "mock-user-id",
      name: "API",
      surname: "User",
      metadata: {},
  }), []);
  
  /**
   * Transforms raw API event data into the CalendarEvent structure needed for the UI.
   * @param apiEvents Array of raw events from the API.
   * @returns Array of formatted CalendarEvent objects.
   */
  const transformEvents = useCallback((apiEvents: ApiEvent[]): CalendarEvent[] => {
    let colorIndex = 0;
    const now = new Date();

    return apiEvents.map(apiEvent => {
      const start = apiEvent.start?.dateTime ? new Date(apiEvent.start.dateTime) : new Date();
      const end = apiEvent.end?.dateTime ? new Date(apiEvent.end.dateTime) : new Date(start.getTime() + 60 * 60000);
      
      // Use the colorId or fall back to 'Default'
      const category = apiEvent.colorId || 'Default';
      
      if (!categoryColorMap[category]) {
          categoryColorMap[category] = defaultColors[colorIndex % defaultColors.length];
          colorIndex++;
      }

      let status: CalendarEvent['status'] = 'Upcoming';
      if (end < now) {
        status = 'Done'; 
      } else if (start < now && end > now) {
        status = 'Upcoming'; // Currently ongoing
      }
      
      const mockConcept: Concept = { id: apiEvent.id, title: apiEvent.summary, description: apiEvent.description, creator: mockUser };

      return {
        id: apiEvent.id,
        start: start,
        end: end,
        title: apiEvent.summary,
        description: apiEvent.description,
        lead: apiEvent.organizer?.email?.split('@')[0] || 'System Organizer',
        category: `GCal Color ${category}`,
        categoryColor: categoryColorMap[category],
        status: status,
        concept: mockConcept,
        htmlLink: apiEvent.htmlLink,
      };
    });
  }, [mockUser]);

  /**
   * Fetches events from the mock Google Calendar API endpoint.
   */
  const fetchCalendarEvents = useCallback(async () => {
    if (IS_SAMPLE_KEY) {
      setError("Using sample keys. Please replace API_KEY and CALENDAR_ID in the code to fetch live data.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch events for the next 4 weeks to give the calendar enough data to scroll through
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Construct the URL to list events
    const url = `${BASE_URL}/${CALENDAR_ID}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
    const maxRetries = 3;
    let delay = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                // Throw an error if the status code is not 2xx
                let errorMessage = `HTTP error! Status: ${response.status}`;
                if (response.status === 400) errorMessage += " (Check API Key format or Calendar ID.)";
                if (response.status === 403) errorMessage += " (API Key may not be authorized for this operation or calendar.)";
                if (response.status === 404) errorMessage += " (Calendar ID not found.)";
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(`API Error: ${data.error.message}`);
            }

            const transformed = transformEvents(data.items || []);
            setEvents(transformed);
            setLoading(false);
            return; // Success, exit loop
        } catch (err) {
            console.error(`Attempt ${attempt + 1} failed:`, err);
            if (attempt === maxRetries - 1) {
                setError(`Failed to fetch calendar events: ${err instanceof Error ? err.message : 'Unknown error'}`);
                setLoading(false);
                return;
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
  }, [API_KEY, CALENDAR_ID, BASE_URL, IS_SAMPLE_KEY, transformEvents]);
  
  // Hardcoded mock events for when the API key is not set
  const mockEvents: ApiEvent[] = useMemo(() => {
    const now = new Date();
    const t = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 5);

    // Find the next Sunday for an overdue event example
    const overdueDay = new Date(now);
    overdueDay.setDate(now.getDate() - 2);

    return [
      // Ongoing event (currently 'Upcoming' status)
      {
        id: "mock1",
        summary: "Weekly Team Sync (Mock)",
        description: "Review milestones and plan for the next sprint.",
        start: { dateTime: new Date(t.setHours(now.getHours() - 1, 30, 0, 0)).toISOString() },
        end: { dateTime: new Date(t.setHours(now.getHours() + 1, 30, 0, 0)).toISOString() },
        organizer: { email: "dev@example.com" },
        colorId: "6", // Red
        htmlLink: "#",
      },
      // Event tomorrow
      {
        id: "mock2",
        summary: "Client Presentation Prep (Mock)",
        description: "Finalize deck slides and run through talking points.",
        start: { dateTime: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString() },
        end: { dateTime: new Date(tomorrow.setHours(16, 0, 0, 0)).toISOString() },
        organizer: { email: "product@example.com" },
        colorId: "5", // Yellow
        htmlLink: "#",
      },
      // Event next week
      {
        id: "mock3",
        summary: "Project Review Deadline (Mock)",
        description: "Mandatory check-in for Q4 goals.",
        start: { dateTime: new Date(nextWeek.setHours(11, 0, 0, 0)).toISOString() },
        end: { dateTime: new Date(nextWeek.setHours(11, 30, 0, 0)).toISOString() },
        organizer: { email: "exec@example.com" },
        colorId: "4", // Green
        htmlLink: "#",
      },
      // Event already done (Done status)
      {
        id: "mock4",
        summary: "Initial Brainstorm (Done)",
        description: "Kick-off meeting for feature X.",
        start: { dateTime: new Date(overdueDay.setHours(10, 0, 0, 0)).toISOString() },
        end: { dateTime: new Date(overdueDay.setHours(11, 0, 0, 0)).toISOString() },
        organizer: { email: "ops@example.com" },
        colorId: "11", // Pink
        htmlLink: "#",
      }
    ];
  }, []);

  // Data Loading Effect
  useEffect(() => {
    if (!IS_SAMPLE_KEY) {
        fetchCalendarEvents();
    } else {
        setEvents(transformEvents(mockEvents));
        setError("Using sample keys. Replace API_KEY and CALENDAR_ID to fetch live data.");
        setLoading(false);
    }
  }, [IS_SAMPLE_KEY, fetchCalendarEvents, mockEvents, transformEvents]);


  // Separate component for the status/debug information
  const StatusInfo = (
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-white/50 w-full">
          <h1 className="text-sm font-extrabold tracking-tight text-white/80">{mockProject.name} <span className="px-2 py-0.5 bg-purple-900/40 text-purple-400 text-[10px] uppercase font-bold tracking-wider rounded-full border border-purple-900/40">CALENDAR</span></h1>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
            {error && <div className="text-red-400 p-1.5 bg-red-900/30 rounded-lg border border-red-700/50 flex items-center gap-2"><Info className="w-3 h-3"/> {error}</div>}
            <span className="text-white/40">API Status: <span className={IS_SAMPLE_KEY ? "text-red-400 font-semibold" : "text-green-400 font-semibold"}>{IS_SAMPLE_KEY ? "Sample Data" : (loading ? "Connecting..." : "Connected")}</span></span>
            <span className="hidden sm:inline text-white/40">Key: <span className="font-mono">{API_KEY.substring(0, 8)}...</span></span>
            <span className="hidden md:inline text-white/40">Calendar ID: <span className="font-mono">{CALENDAR_ID}</span></span>
          </div>
      </div>
  );


  return (
    // Re-added vertical centering and padding (p-4) to the outer container
    <div className=" w-full bg-[#0a0a0a] text-white flex items-center justify-center font-sans ">
      
      {/* --- Main Application Box (The "Box") --- */}
      {/* Changed h-full back to h-[750px] and added rounded-xl back for a contained look */}
      <div className="w-full h-[750px] max-w-7xl bg-[#161616] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden mx-auto">
      
        {/* Calendar Body (Now the main visible area) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[#111] to-[#181818]">
            
            {loading && !IS_SAMPLE_KEY ? (
                <div className="flex justify-center items-center h-full flex-col gap-4">
                    {StatusInfo}
                    <Loader2 className="inline w-8 h-8 text-purple-400 animate-spin fill-white" />
                    <span className="ml-3 text-white/70">Fetching events from Google API...</span>
                </div>
            ) : (
                <ProjectCalendar events={events} project={mockProject} statusInfo={StatusInfo} />
            )}
             
        </div>
      </div>
    </div>
  );
}