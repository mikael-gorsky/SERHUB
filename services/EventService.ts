// Re-export meeting functions from supabase.ts
export {
  getMeetings,
  getMeetingsByDateRange,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getMeetingParticipants,
  addMeetingParticipant
} from '../lib/supabase';

import { Meeting, CalendarEvent } from '../types';
import { supabase, isConfigured, getUpcomingDeadlines } from '../lib/supabase';

export const EventService = {
  // Get all meetings
  getAllMeetings: async (): Promise<Meeting[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_meetings')
      .select(`
        *,
        creator:serhub_profiles!created_by(id, first_name, last_name, title)
      `)
      .order('start_time');
    if (error) throw error;
    return data || [];
  },

  // Get meetings for a specific date range
  getMeetingsInRange: async (startDate: Date, endDate: Date): Promise<Meeting[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_meetings')
      .select(`
        *,
        creator:serhub_profiles!created_by(id, first_name, last_name, title)
      `)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time');
    if (error) throw error;
    return data || [];
  },

  // Get calendar events combining meetings and task deadlines
  getCalendarEvents: async (startDate: Date, endDate: Date): Promise<CalendarEvent[]> => {
    const events: CalendarEvent[] = [];

    // Get meetings
    try {
      const meetings = await EventService.getMeetingsInRange(startDate, endDate);
      meetings.forEach(meeting => {
        events.push({
          id: meeting.id,
          title: meeting.title,
          start: new Date(meeting.start_time),
          end: new Date(meeting.end_time),
          type: 'meeting',
          data: meeting
        });
      });
    } catch (e) {
      console.warn('Failed to fetch meetings:', e);
    }

    // Get upcoming task deadlines
    try {
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const deadlines = await getUpcomingDeadlines(days);
      deadlines.forEach(task => {
        const dueDate = new Date(task.due_date);
        if (dueDate >= startDate && dueDate <= endDate) {
          events.push({
            id: task.id,
            title: `Due: ${task.title}`,
            start: dueDate,
            end: dueDate,
            type: 'deadline',
            data: task
          });
        }
      });
    } catch (e) {
      console.warn('Failed to fetch deadlines:', e);
    }

    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
  },

  // Create a new meeting
  create: async (meeting: Partial<Meeting>): Promise<Meeting | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_meetings')
      .insert(meeting)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update meeting
  update: async (meetingId: string, updates: Partial<Meeting>): Promise<Meeting | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    // Remove joined fields before update
    const { creator, participants, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase
      .from('serhub_meetings')
      .update(cleanUpdates)
      .eq('id', meetingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Delete meeting
  delete: async (meetingId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { error } = await supabase
      .from('serhub_meetings')
      .delete()
      .eq('id', meetingId);
    if (error) throw error;
    return true;
  }
};
