import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Flag,
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'timeline'>('month');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get events for the current month plus buffer
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);

        const [eventsData, sectionsData] = await Promise.all([
          EventService.getCalendarEvents(startDate, endDate),
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
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-teal-600">
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
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, date: null });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        date: new Date(year, month, i)
      });
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  // Get week days for week view
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Filter events for a date
  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      const eDate = new Date(e.start);
      return eDate.getDate() === date.getDate() &&
             eDate.getMonth() === date.getMonth() &&
             eDate.getFullYear() === date.getFullYear();
    });
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };
  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getEventTypeColor = (type: string) => {
    switch(type) {
      case 'deadline': return 'bg-red-100 text-red-700 border-red-200';
      case 'meeting': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch(type) {
      case 'deadline': return 'Deadline';
      case 'meeting': return 'Meeting';
      default: return type;
    }
  };

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;
  const eventsOnSelectedDate = selectedDate ? getEventsForDate(selectedDate) : [];

  const handlePrev = view === 'week' ? handlePrevWeek : handlePrevMonth;
  const handleNext = view === 'week' ? handleNextWeek : handleNextMonth;

  // Format header based on view
  const getHeaderText = () => {
    if (view === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
      }
    }
    return `${MONTHS[month]} ${year}`;
  };

  return (
    <div className="flex h-full gap-6">
      {/* --- Main Calendar Area --- */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button onClick={handlePrev} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"><ChevronLeft size={18} /></button>
              <button onClick={handleToday} className="px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-sm rounded transition-all">Today</button>
              <button onClick={handleNext} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"><ChevronRight size={18} /></button>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{getHeaderText()}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${view === 'month' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <LayoutGrid size={14} /> Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${view === 'week' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <LayoutGrid size={14} className="rotate-90" /> Week
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${view === 'timeline' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <List size={14} /> Timeline
              </button>
            </div>
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
                        ${isSelected ? 'ring-2 ring-inset ring-teal-500 bg-teal-50/30' : ''}
                      `}
                    >
                      {cell.day && (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                              ${isToday ? 'bg-teal-500 text-white' : 'text-gray-700'}
                            `}>
                              {cell.day}
                            </span>
                            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-teal-600">
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="space-y-1">
                            {cellEvents.slice(0, 3).map(event => (
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
                            {cellEvents.length > 3 && (
                              <div className="text-[10px] text-gray-400 px-2">
                                +{cellEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {view === 'week' && (
            <div className="h-full flex flex-col">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {weekDays.map((day, idx) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div key={idx} className="py-3 text-center border-r border-gray-100 last:border-r-0">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {DAYS[day.getDay()]}
                      </div>
                      <div className={`text-lg font-semibold mt-1 ${isToday ? 'text-teal-600' : 'text-gray-700'}`}>
                        {day.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day columns */}
              <div className="grid grid-cols-7 flex-1">
                {weekDays.map((day, idx) => {
                  const dayEvents = getEventsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === day.toDateString();

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`border-r border-gray-100 last:border-r-0 p-2 overflow-y-auto cursor-pointer transition-colors
                        ${isToday ? 'bg-teal-50/50' : 'bg-white'}
                        ${isSelected ? 'ring-2 ring-inset ring-teal-500' : ''}
                        hover:bg-gray-50
                      `}
                    >
                      <div className="space-y-2">
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventId(event.id);
                              setSelectedDate(day);
                            }}
                            className={`p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${getEventTypeColor(event.type)} ${selectedEventId === event.id ? 'ring-2 ring-teal-500' : ''}`}
                          >
                            <div className="text-[10px] font-medium uppercase mb-1">
                              {getEventTypeLabel(event.type)}
                            </div>
                            <div className="text-xs font-semibold line-clamp-2">
                              {event.title}
                            </div>
                            {event.type === 'meeting' && (
                              <div className="text-[10px] mt-1 flex items-center gap-1 opacity-75">
                                <Clock size={10} />
                                {new Date(event.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        ))}
                        {dayEvents.length === 0 && (
                          <div className="text-xs text-gray-400 text-center py-4">
                            No events
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TIMELINE VIEW */}
          {view === 'timeline' && (
             <div className="p-6">
                <h3 className="font-bold text-gray-800 mb-6">Timeline: {MONTHS[month]} {year}</h3>
                <div className="space-y-6 relative border-l-2 border-gray-200 ml-4 pl-8">
                  {events
                    .filter(e => new Date(e.start).getMonth() === month)
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .map(event => (
                     <div key={event.id} className="relative mb-6">
                       <div className={`absolute -left-[41px] w-5 h-5 rounded-full border-4 border-white ${
                         event.type === 'deadline' ? 'bg-red-500' : 'bg-blue-500'
                       }`}></div>
                       <div
                        onClick={() => setSelectedEventId(event.id)}
                        className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all bg-white ${selectedEventId === event.id ? 'ring-2 ring-teal-500' : 'border-gray-200'}`}
                       >
                         <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-gray-500">
                              {new Date(event.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getEventTypeColor(event.type)}`}>
                              {getEventTypeLabel(event.type)}
                            </span>
                         </div>
                         <h4 className="font-bold text-gray-800">{event.title}</h4>
                       </div>
                     </div>
                  ))}
                  {events.filter(e => new Date(e.start).getMonth() === month).length === 0 && (
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
                   {getEventTypeLabel(selectedEvent.type)}
                </span>
                <button onClick={() => setSelectedEventId(null)} className="text-gray-400 hover:text-gray-600">
                   &times;
                </button>
             </div>
             <h3 className="text-lg font-bold text-gray-800 mb-2">{selectedEvent.title}</h3>

             <div className="space-y-4 mt-6">
               <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock size={18} className="text-gray-400" />
                  <span>
                    {new Date(selectedEvent.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {selectedEvent.type === 'meeting' && (
                      <span className="ml-1">
                        at {new Date(selectedEvent.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </span>
               </div>
             </div>

             <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
               <button className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50">
                 Edit
               </button>
               {selectedEvent.type === 'meeting' && (
                 <button className="flex-1 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg text-sm hover:bg-teal-700">
                   View
                 </button>
               )}
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
                 className={`p-3 bg-white rounded-lg border shadow-sm cursor-pointer hover:border-teal-500 transition-all ${selectedEventId === event.id ? 'ring-1 ring-teal-500 border-teal-500' : 'border-gray-100'}`}
               >
                 <div className="flex items-center gap-2 mb-1">
                   <div className={`w-2 h-2 rounded-full ${event.type === 'deadline' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                   <span className="text-xs text-gray-500">{getEventTypeLabel(event.type)}</span>
                 </div>
                 <p className="text-sm font-semibold text-gray-800">{event.title}</p>
               </div>
             )) : (
               <div className="text-sm text-gray-500 italic py-4 text-center">
                 No events scheduled for this day.
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectCalendar;
