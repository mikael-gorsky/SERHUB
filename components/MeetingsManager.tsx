import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Loader2,
  Plus,
  Calendar
} from 'lucide-react';
import { MeetingService } from '../services/MeetingService';
import { Meeting, MeetingLevel } from '../types';
import MeetingCard from './MeetingCard';

const levelFilters: { id: MeetingLevel | 'all'; label: string; color: string }[] = [
  { id: 'all', label: 'All Meetings', color: 'bg-teal-600 text-white' },
  { id: 'team', label: 'Team', color: 'bg-blue-100 text-blue-700' },
  { id: 'faculty', label: 'Faculty', color: 'bg-purple-100 text-purple-700' },
  { id: 'institute', label: 'Institute', color: 'bg-amber-100 text-amber-700' },
];

const MeetingsManager = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<MeetingLevel | 'all'>('all');
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const meetingsData = await MeetingService.getAll();
      setMeetings(meetingsData);
    } catch (error) {
      console.error("Error fetching meetings:", error);
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

  // Group meetings by date
  const groupedMeetings = useMemo(() => {
    const groups: Record<string, Meeting[]> = {};
    filteredMeetings.forEach(meeting => {
      const dateKey = new Date(meeting.start_time).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(meeting);
    });
    return groups;
  }, [filteredMeetings]);

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
      {/* Sidebar Filters */}
      <div className="w-72 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Meeting Level</h3>
          <div className="space-y-2">
            {levelFilters.map(level => (
              <button
                key={level.id}
                onClick={() => setLevelFilter(level.id)}
                className={`w-full text-left p-3 rounded-xl text-sm font-semibold transition-all ${
                  levelFilter === level.id
                    ? level.id === 'all' ? 'bg-teal-600 text-white shadow-lg' : level.color
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Time Filter</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-600">Show past meetings</span>
          </label>
        </div>
      </div>

      {/* Main Content */}
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
        </div>

        {/* Meetings List */}
        <div className="flex-1 overflow-y-auto space-y-6 pb-6">
          {Object.keys(groupedMeetings).length > 0 ? (
            Object.entries(groupedMeetings).map(([date, dateMeetings]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">{date}</h3>
                <div className="space-y-4">
                  {dateMeetings.map(meeting => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onClick={() => console.log('Edit meeting:', meeting.id)}
                    />
                  ))}
                </div>
              </div>
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
    </div>
  );
};

export default MeetingsManager;
