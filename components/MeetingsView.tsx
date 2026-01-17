import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Loader2,
  Plus,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Users,
  Flag
} from 'lucide-react';
import { MeetingService } from '../services/MeetingService';
import { TaskService } from '../services/TaskService';
import { Meeting, MeetingLevel, Task } from '../types';
import MeetingCard from './MeetingCard';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const levelFilters: { id: MeetingLevel | 'all'; label: string; color: string }[] = [
  { id: 'all', label: 'All Levels', color: 'bg-teal-600 text-white' },
  { id: 'team', label: 'Team', color: 'bg-blue-100 text-blue-700' },
  { id: 'faculty', label: 'Faculty', color: 'bg-purple-100 text-purple-700' },
  { id: 'institute', label: 'Institute', color: 'bg-amber-100 text-amber-700' },
];

const MeetingsView = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<MeetingLevel | 'all'>('all');
  const [showPast, setShowPast] = useState(false);

  // Calendar
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingsData, tasksData] = await Promise.all([
        MeetingService.getAll(),
        TaskService.getAll()
      ]);
      setMeetings(meetingsData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeetings = useMemo(() => {
    const now = new Date();
    return meetings.filter(meeting => {
      const matchesSearch = (meeting.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (meeting.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = levelFilter === 'all' || meeting.level === levelFilter;
      const isPast = new Date(meeting.end_time) < now;
      const matchesTime = showPast || !isPast;
      return matchesSearch && matchesLevel && matchesTime;
    });
  }, [meetings, searchTerm, levelFilter, showPast]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const getCalendarDays = () => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  // Get events for a specific date
  const getEventsForDate = (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];

    const dayMeetings = meetings.filter(m => {
      const meetingDate = new Date(m.start_time).toISOString().split('T')[0];
      return meetingDate === dateStr;
    });

    const dayDeadlines = tasks.filter(t => {
      return t.due_date === dateStr;
    });

    return { meetings: dayMeetings, deadlines: dayDeadlines };
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-teal-600">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading Meetings...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6 p-6">
      {/* Left Side - Meetings List */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <button
            className="w-10 h-10 shrink-0 flex items-center justify-center bg-teal-600 text-white rounded-xl shadow-lg hover:bg-teal-700 transition-all"
            title="Create New Meeting"
          >
            <Plus size={20} />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Level Filter Pills */}
          <div className="flex gap-2">
            {levelFilters.map(level => (
              <button
                key={level.id}
                onClick={() => setLevelFilter(level.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  levelFilter === level.id ? level.color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meetings List */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-6">
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map(meeting => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onClick={() => console.log('Edit meeting:', meeting.id)}
              />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center text-gray-400 bg-white rounded-2xl shadow-sm">
              <Calendar size={48} className="text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No Meetings</h3>
              <p className="text-sm max-w-xs mt-2">
                {searchTerm || levelFilter !== 'all'
                  ? 'No meetings match current filters.'
                  : 'Create your first meeting to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Calendar */}
      <div className="w-96 shrink-0 flex flex-col gap-6">
        {/* Mini Calendar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">{MONTHS[month]} {year}</h3>
            <div className="flex gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-500" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={idx} className="h-10" />;
              }

              const events = getEventsForDate(day);
              const hasMeetings = events.meetings.length > 0;
              const hasDeadlines = events.deadlines.length > 0;
              const isToday = new Date().getDate() === day &&
                             new Date().getMonth() === month &&
                             new Date().getFullYear() === year;

              return (
                <div
                  key={idx}
                  className={`h-10 flex flex-col items-center justify-center rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors ${
                    isToday ? 'bg-teal-100 text-teal-700 font-bold' : 'text-gray-700'
                  }`}
                >
                  <span>{day}</span>
                  {(hasMeetings || hasDeadlines) && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasMeetings && <span className="w-1 h-1 rounded-full bg-purple-500" />}
                      {hasDeadlines && <span className="w-1 h-1 rounded-full bg-red-500" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Meetings
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Deadlines
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Flag size={16} className="text-red-500" />
            Upcoming Deadlines
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3">
            {tasks
              .filter(t => new Date(t.due_date) >= new Date() && t.status < 100)
              .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
              .slice(0, 10)
              .map(task => (
                <div
                  key={task.id}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{task.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${task.status >= 75 ? 'bg-green-500' : task.status >= 50 ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                      {task.status}%
                    </div>
                  </div>
                </div>
              ))}
            {tasks.filter(t => new Date(t.due_date) >= new Date() && t.status < 100).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No upcoming deadlines</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingsView;
