import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Flag, 
  Filter, 
  Plus,
  List,
  LayoutGrid,
  Loader2
} from 'lucide-react';
import { EventService } from '../services/EventService';
import { SectionService } from '../services/SectionService';
import { CalendarEvent, Section } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ProjectCalendar = () => {
  // Initialize to Nov 2023 to match mock data
  const [currentDate, setCurrentDate] = useState(new Date(2023, 10, 1)); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2023, 10, 15));
  const [view, setView] = useState<'month' | 'week' | 'timeline'>('month');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, sectionsData] = await Promise.all([
          EventService.getAll(),
          SectionService.getAll()
        ]);
        setEvents(eventsData);
        setSections(sectionsData);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-hit-blue">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading Calendar...</span>
      </div>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Helper to generate calendar grid days
  const getCalendarDays = () => {
    const days = [];
    // Previous month padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, date: null });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ 
        day: i, 
        date: new Date(year, month, i) 
      });
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  // Filter events for the current view
  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getDate() === date.getDate() && 
             eDate.getMonth() === date.getMonth() && 
             eDate.getFullYear() === date.getFullYear();
    });
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getEventTypeColor = (type: string) => {
    switch(type) {
      case 'Deadline': return 'bg-red-100 text-red-700 border-red-200';
      case 'Meeting': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Milestone': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;
  const eventsOnSelectedDate = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="flex h-full gap-6">
      {/* --- Main Calendar Area --- */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"><ChevronLeft size={18} /></button>
              <button onClick={handleToday} className="px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-sm rounded transition-all">Today</button>
              <button onClick={handleNextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"><ChevronRight size={18} /></button>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{MONTHS[month]} {year}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setView('month')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${view === 'month' ? 'bg-white text-hit-blue shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <LayoutGrid size={14} /> Month
              </button>
              <button 
                onClick={() => setView('week')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${view === 'week' ? 'bg-white text-hit-blue shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <LayoutGrid size={14} className="rotate-90" /> Week
              </button>
              <button 
                onClick={() => setView('timeline')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${view === 'timeline' ? 'bg-white text-hit-blue shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <List size={14} /> Timeline
              </button>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-hit-blue text-white rounded-lg text-sm font-medium hover:bg-hit-dark transition-colors shadow-sm">
              <Plus size={16} /> Add Event
            </button>
          </div>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* MONTH VIEW */}
          {view === 'month' && (
            <div className="h-full flex flex-col">
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {DAYS.map(day => (
                  <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {calendarDays.map((cell, idx) => {
                  const isToday = cell.date?.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === cell.date?.toDateString();
                  const cellEvents = cell.date ? getEventsForDate(cell.date) : [];

                  return (
                    <div 
                      key={idx} 
                      onClick={() => cell.date && setSelectedDate(cell.date)}
                      className={`min-h-[120px] border-b border-r border-gray-100 p-2 transition-colors relative group
                        ${!cell.day ? 'bg-gray-50/30' : 'bg-white hover:bg-gray-50 cursor-pointer'}
                        ${isSelected ? 'ring-2 ring-inset ring-hit-blue bg-blue-50/30' : ''}
                      `}
                    >
                      {cell.day && (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                              ${isToday ? 'bg-hit-accent text-white' : 'text-gray-700'}
                            `}>
                              {cell.day}
                            </span>
                            {/* Quick add placeholder on hover */}
                            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-hit-blue">
                              <Plus size={14} />
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            {cellEvents.map(event => (
                              <div 
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventId(event.id);
                                  setSelectedDate(cell.date);
                                }}
                                className={`text-[10px] px-2 py-1 rounded truncate border cursor-pointer hover:opacity-80 transition-opacity ${getEventTypeColor(event.type)}`}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW (Simplified) */}
          {view === 'week' && (
             <div className="p-8 text-center text-gray-400 h-full flex flex-col items-center justify-center">
                <CalendarIcon size={48} className="mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-gray-600">Week View</h3>
                <p>Detailed hourly schedule for the week of {selectedDate?.toLocaleDateString()}.</p>
             </div>
          )}

          {/* TIMELINE VIEW */}
          {view === 'timeline' && (
             <div className="p-6">
                <h3 className="font-bold text-gray-800 mb-6">Timeline: {MONTHS[month]} {year}</h3>
                <div className="space-y-6 relative border-l-2 border-gray-200 ml-4 pl-8">
                  {events.filter(e => new Date(e.date).getMonth() === month).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(event => (
                     <div key={event.id} className="relative mb-6">
                       <div className={`absolute -left-[41px] w-5 h-5 rounded-full border-4 border-white ${
                         event.type === 'Deadline' ? 'bg-red-500' : event.type === 'Meeting' ? 'bg-blue-500' : 'bg-green-500'
                       }`}></div>
                       <div 
                        onClick={() => setSelectedEventId(event.id)}
                        className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all bg-white ${selectedEventId === event.id ? 'ring-2 ring-hit-blue' : 'border-gray-200'}`}
                       >
                         <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-gray-500">{event.date}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getEventTypeColor(event.type)}`}>{event.type}</span>
                         </div>
                         <h4 className="font-bold text-gray-800">{event.title}</h4>
                         {event.sectionId && (
                           <span className="text-xs text-hit-blue mt-1 inline-block">
                             Linked to Step {sections.find(s => s.id === event.sectionId)?.number.replace('Step ', '')}
                           </span>
                         )}
                       </div>
                     </div>
                  ))}
                  {events.filter(e => new Date(e.date).getMonth() === month).length === 0 && (
                    <p className="text-gray-500 italic">No events found for this month.</p>
                  )}
                </div>
             </div>
          )}

        </div>
      </div>

      {/* --- Right Sidebar: Details --- */}
      <div className="w-80 shrink-0 flex flex-col gap-6">
        
        {/* Selected Event Details */}
        {selectedEventId && selectedEvent ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${getEventTypeColor(selectedEvent.type)}`}>
                   {selectedEvent.type}
                </span>
                <button onClick={() => setSelectedEventId(null)} className="text-gray-400 hover:text-gray-600">
                   &times;
                </button>
             </div>
             <h3 className="text-lg font-bold text-gray-800 mb-2">{selectedEvent.title}</h3>
             
             <div className="space-y-4 mt-6">
               <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock size={18} className="text-gray-400" />
                  <span>{selectedEvent.date} — All Day</span>
               </div>
               
               {selectedEvent.sectionId && (
                 <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Flag size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <span className="block text-gray-500 text-xs">Linked Step</span>
                      <span className="font-medium text-hit-blue">
                         {sections.find(s => s.id === selectedEvent.sectionId)?.title}
                      </span>
                    </div>
                 </div>
               )}

               <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <span>Main Conference Room (Building 5)</span>
               </div>
             </div>

             <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
               <button className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50">
                 Edit
               </button>
               <button className="flex-1 px-4 py-2 bg-hit-blue text-white font-medium rounded-lg text-sm hover:bg-hit-dark">
                 Join
               </button>
             </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center py-12">
            <CalendarIcon size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-gray-500 font-medium">Select an event to view details</h3>
          </div>
        )}

        {/* Selected Date Overview */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex-1">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={16} />
            {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h4>
          
          <div className="space-y-3">
             {eventsOnSelectedDate.length > 0 ? eventsOnSelectedDate.map(event => (
               <div 
                 key={event.id} 
                 onClick={() => setSelectedEventId(event.id)}
                 className={`p-3 bg-white rounded-lg border shadow-sm cursor-pointer hover:border-hit-blue transition-all ${selectedEventId === event.id ? 'ring-1 ring-hit-blue border-hit-blue' : 'border-gray-100'}`}
               >
                 <div className="flex items-center gap-2 mb-1">
                   <div className={`w-2 h-2 rounded-full ${event.type === 'Deadline' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                   <span className="text-xs text-gray-500">{event.type}</span>
                 </div>
                 <p className="text-sm font-semibold text-gray-800">{event.title}</p>
               </div>
             )) : (
               <div className="text-sm text-gray-500 italic py-4 text-center">
                 No events scheduled for this day.
               </div>
             )}
             
             <button className="w-full py-2 mt-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-white hover:text-hit-blue hover:border-hit-blue transition-all flex items-center justify-center gap-2">
               <Plus size={14} /> Add item to this day
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectCalendar;