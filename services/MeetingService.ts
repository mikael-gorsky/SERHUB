import { Meeting, MeetingLevel } from '../types';
import { supabase, isConfigured } from '../lib/supabase';

export const MeetingService = {
  getAll: async (): Promise<Meeting[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_meetings')
      .select(`
        *,
        creator:serhub_profiles!created_by(id, first_name, last_name, title, avatar_url)
      `)
      .order('start_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getByLevel: async (level: MeetingLevel): Promise<Meeting[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_meetings')
      .select(`
        *,
        creator:serhub_profiles!created_by(id, first_name, last_name, title, avatar_url)
      `)
      .eq('level', level)
      .order('start_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getUpcoming: async (days: number = 7): Promise<Meeting[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    const { data, error } = await supabase
      .from('serhub_meetings')
      .select(`
        *,
        creator:serhub_profiles!created_by(id, first_name, last_name, title, avatar_url)
      `)
      .gte('start_time', now.toISOString())
      .lte('start_time', future.toISOString())
      .order('start_time');
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string): Promise<Meeting | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_meetings')
      .select(`
        *,
        creator:serhub_profiles!created_by(*)
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  create: async (meeting: Partial<Meeting>): Promise<Meeting | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    // Ensure arrays are properly formatted
    const createData = {
      ...meeting,
      agenda: meeting.agenda || [],
      action_items: meeting.action_items || []
    };
    const { data, error } = await supabase
      .from('serhub_meetings')
      .insert(createData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

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
  },

  // ============================================
  // AGENDA MANAGEMENT
  // ============================================

  addAgendaItem: async (meetingId: string, item: string): Promise<Meeting | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    // First get current agenda
    const meeting = await MeetingService.getById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const newAgenda = [...(meeting.agenda || []), item];
    return MeetingService.update(meetingId, { agenda: newAgenda });
  },

  removeAgendaItem: async (meetingId: string, index: number): Promise<Meeting | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const meeting = await MeetingService.getById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const newAgenda = meeting.agenda.filter((_, i) => i !== index);
    return MeetingService.update(meetingId, { agenda: newAgenda });
  },

  // ============================================
  // ACTION ITEMS MANAGEMENT
  // ============================================

  addActionItem: async (meetingId: string, item: string): Promise<Meeting | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const meeting = await MeetingService.getById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const newActionItems = [...(meeting.action_items || []), item];
    return MeetingService.update(meetingId, { action_items: newActionItems });
  },

  removeActionItem: async (meetingId: string, index: number): Promise<Meeting | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const meeting = await MeetingService.getById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const newActionItems = meeting.action_items.filter((_, i) => i !== index);
    return MeetingService.update(meetingId, { action_items: newActionItems });
  },

  // ============================================
  // PARTICIPANTS
  // ============================================

  getParticipants: async (meetingId: string): Promise<string[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_meeting_participants')
      .select('user_id')
      .eq('meeting_id', meetingId);
    if (error) throw error;
    return data?.map(p => p.user_id) || [];
  },

  addParticipant: async (meetingId: string, userId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { error } = await supabase
      .from('serhub_meeting_participants')
      .insert({ meeting_id: meetingId, user_id: userId });
    if (error && error.code !== '23505') throw error; // Ignore unique constraint violation
    return true;
  },

  removeParticipant: async (meetingId: string, userId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { error } = await supabase
      .from('serhub_meeting_participants')
      .delete()
      .eq('meeting_id', meetingId)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  }
};
