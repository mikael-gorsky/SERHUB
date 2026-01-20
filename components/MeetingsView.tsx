import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  Plus,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Users,
  Flag,
  X,
  Save,
  CheckCircle2,
  Repeat,
  Trash2
} from 'lucide-react';
import { MeetingService } from '../services/MeetingService';
import { TaskService } from '../services/TaskService';
import { UserService } from '../services/UserService';
import { Meeting, Task, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import MeetingCard from './MeetingCard';
import UserAvatar from './UserAvatar';
import { canCreateMeetings, canEditMeetings } from '../lib/permissions';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const recurrenceOptions = [
  { id: '', label: 'No Recurrence' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-weekly' },
  { id: 'monthly', label: 'Monthly' },
];

interface MeetingFormData {
  id?: string;
  title: string;
  start_time: string;
  end_time: string;
  description: string;
  recurrence_rule: string;
  participant_ids: string[];
}

const MeetingsView = () => {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showPast, setShowPast] = useState(false);

  // Calendar
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<MeetingFormData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingsData, tasksData, profilesData] = await Promise.all([
        MeetingService.getAll(),
        TaskService.getAll(),
        UserService.getAll()
      ]);
      setMeetings(meetingsData);
      setTasks(tasksData);
      setProfiles(profilesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeetings = useMemo(() => {
    const now = new Date();
    return meetings
      .filter(meeting => {
        const isPast = new Date(meeting.end_time) < now;
        const matchesTime = showPast || !isPast;
        return matchesTime;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [meetings, showPast]);

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

  const openCreateModal = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    setFormData({
      title: '',
      start_time: startTime.toISOString().slice(0, 16),
      end_time: endTime.toISOString().slice(0, 16),
      description: '',
      recurrence_rule: '',
      participant_ids: []
    });
    setIsCreating(true);
    setShowModal(true);
  };

  const openEditModal = async (meeting: Meeting) => {
    // Load existing participants
    let participantIds: string[] = [];
    try {
      participantIds = await MeetingService.getParticipants(meeting.id);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }

    setFormData({
      id: meeting.id,
      title: meeting.title,
      start_time: meeting.start_time.slice(0, 16),
      end_time: meeting.end_time.slice(0, 16),
      description: meeting.description || '',
      recurrence_rule: meeting.recurrence_rule || '',
      participant_ids: participantIds
    });
    setIsCreating(false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !currentUser) return;

    setIsSaving(true);
    try {
      const meetingData = {
        title: formData.title,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        description: formData.description || null,
        recurrence_rule: formData.recurrence_rule || null,
        created_by: currentUser.id
      };

      let meetingId: string;

      if (isCreating) {
        const created = await MeetingService.create(meetingData);
        if (!created) throw new Error('Failed to create meeting');
        meetingId = created.id;
      } else {
        meetingId = formData.id!;
        await MeetingService.update(meetingId, meetingData);
      }

      // Sync participants
      const existingParticipants = isCreating ? [] : await MeetingService.getParticipants(meetingId);
      const toAdd = formData.participant_ids.filter(id => !existingParticipants.includes(id));
      const toRemove = existingParticipants.filter(id => !formData.participant_ids.includes(id));

      await Promise.all([
        ...toAdd.map(userId => MeetingService.addParticipant(meetingId, userId)),
        ...toRemove.map(userId => MeetingService.removeParticipant(meetingId, userId))
      ]);

      setShowModal(false);
      setFormData(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to save meeting:', error);
      alert("Failed to save meeting.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData?.id) return;
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    setIsSaving(true);
    try {
      await MeetingService.delete(formData.id);
      setShowModal(false);
      setFormData(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      alert("Failed to delete meeting.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleParticipant = (profileId: string) => {
    if (!formData) return;
    const ids = formData.participant_ids;
    if (ids.includes(profileId)) {
      setFormData({ ...formData, participant_ids: ids.filter(id => id !== profileId) });
    } else {
      setFormData({ ...formData, participant_ids: [...ids, profileId] });
    }
  };

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
      <div className="w-1/2 flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          {canCreateMeetings(currentUser) && (
            <button
              onClick={openCreateModal}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-teal-600 text-white rounded-xl shadow-lg hover:bg-teal-700 transition-all"
              title="Create New Meeting"
            >
              <Plus size={20} />
            </button>
          )}

          <div className="flex-1" />

          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">Show past</span>
          </label>
        </div>

        {/* Meetings List */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-6">
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map(meeting => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onClick={canEditMeetings(currentUser) ? () => openEditModal(meeting) : undefined}
              />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center text-gray-400 bg-white rounded-2xl shadow-sm">
              <Calendar size={48} className="text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No Meetings</h3>
              <p className="text-sm max-w-xs mt-2">
                Create your first meeting to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Calendar */}
      <div className="w-1/2 flex flex-col gap-6 overflow-hidden">
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

      {/* Meeting Modal */}
      {showModal && formData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Calendar size={20} className="text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isCreating ? 'New Meeting' : 'Edit Meeting'}
                  </h2>
                  <p className="text-xs text-gray-500">Fill in the meeting details</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Meeting title..."
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Start & End */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Start <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    End <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_time}
                    onChange={e => setFormData({...formData, end_time: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Repeat size={14} />
                  Recurrence
                </label>
                <select
                  value={formData.recurrence_rule}
                  onChange={e => setFormData({...formData, recurrence_rule: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {recurrenceOptions.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Meeting description or agenda..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Participants */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Users size={14} />
                  Participants
                </label>

                {/* User selection chips */}
                <div className="flex flex-wrap gap-2">
                  {profiles.map(p => {
                    const isSelected = formData.participant_ids.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleParticipant(p.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-teal-100 text-teal-800 border-2 border-teal-300'
                            : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <UserAvatar name={p.name} role={p.role} isUser={p.is_user} size="xs" />
                        {p.name}
                        {isSelected && <CheckCircle2 size={12} className="text-teal-600" />}
                      </button>
                    );
                  })}
                </div>

                {formData.participant_ids.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {formData.participant_ids.length} participant{formData.participant_ids.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex justify-between shrink-0 bg-gray-50">
              {/* Delete button - only for existing meetings */}
              {!isCreating ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-white border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formData.title}
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {isCreating ? 'Create Meeting' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsView;
