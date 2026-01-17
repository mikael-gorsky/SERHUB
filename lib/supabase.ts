import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, Section, Task, Meeting, UserTaskStats } from '../types';

// --- CONFIGURATION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// --- INITIALIZATION ---
let supabaseInstance: SupabaseClient | undefined;

const hasValidConfig = supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_url' &&
  supabaseAnonKey !== 'your_anon_key';

if (hasValidConfig) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
export const isConfigured = !!supabaseInstance;

// --- AUTH UTILITIES ---

export const loginWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const getAppConfig = () => {
  return {
    projectId: supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : 'None',
    isConfigured: isConfigured
  };
};

export const checkDatabaseConnection = async (): Promise<{success: boolean, message?: string}> => {
  if (!supabase) return { success: false, message: "Supabase configuration missing." };

  try {
    const { error } = await supabase.from('serhub_sections').select('id').limit(1);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Supabase connectivity error:", error);
    return { success: false, message: error.message };
  }
};

// --- PROFILE FUNCTIONS ---

export const getProfile = async (userId: string): Promise<Profile | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('serhub_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
};

export const getProfiles = async (): Promise<Profile[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('serhub_profiles')
    .select('*')
    .eq('is_active', true)
    .order('last_name');
  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  return data || [];
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('serhub_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  return data;
};

// --- SECTION FUNCTIONS ---

export const getSections = async (): Promise<Section[]> => {
  console.log('getSections called, supabase configured:', !!supabase);
  if (!supabase) {
    console.error('Supabase not configured!');
    return [];
  }

  // Check auth state
  const { data: authData } = await supabase.auth.getSession();
  console.log('Auth session:', authData?.session ? 'logged in' : 'not logged in');

  const { data, error, status } = await supabase
    .from('serhub_sections')
    .select('*')
    .order('sort_order');
  console.log('getSections result:', { count: data?.length, error, status });
  if (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
  return data || [];
};

export const getSectionsHierarchy = async (): Promise<Section[]> => {
  const sections = await getSections();
  console.log('Building hierarchy from', sections.length, 'sections');
  console.log('Sample section:', sections[0]);

  // Build hierarchy - use == for loose comparison in case level is string
  const level1 = sections.filter(s => Number(s.level) === 1);
  const level2 = sections.filter(s => Number(s.level) === 2);
  const level3 = sections.filter(s => Number(s.level) === 3);

  console.log('Level counts:', { level1: level1.length, level2: level2.length, level3: level3.length });

  // Attach level 3 to level 2
  level2.forEach(s2 => {
    s2.children = level3.filter(s3 => s3.parent_id === s2.id);
  });

  // Attach level 2 to level 1
  level1.forEach(s1 => {
    s1.children = level2.filter(s2 => s2.parent_id === s1.id);
  });

  return level1;
};

export const getSectionProgress = async (sectionId: string): Promise<number> => {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .rpc('serhub_get_section_progress', { section_uuid: sectionId });
  if (error) {
    console.error('Error fetching section progress:', error);
    return 0;
  }
  return data || 0;
};

export const getSectionStatus = async (sectionId: string): Promise<string> => {
  if (!supabase) return 'on_track';
  const { data, error } = await supabase
    .rpc('serhub_get_section_status', { section_uuid: sectionId });
  if (error) {
    console.error('Error fetching section status:', error);
    return 'on_track';
  }
  return data || 'on_track';
};

// --- TASK FUNCTIONS ---

export const getTasks = async (): Promise<Task[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('serhub_tasks')
    .select(`
      *,
      owner:serhub_profiles!owner_id(*),
      supervisor:serhub_profiles!supervisor_id(*),
      section:serhub_sections!section_id(id, number, title)
    `)
    .order('due_date');
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return data || [];
};

export const getTasksBySection = async (sectionId: string): Promise<Task[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('serhub_tasks')
    .select(`
      *,
      owner:serhub_profiles!owner_id(*),
      supervisor:serhub_profiles!supervisor_id(*)
    `)
    .eq('section_id', sectionId)
    .order('due_date');
  if (error) {
    console.error('Error fetching section tasks:', error);
    return [];
  }
  return data || [];
};

export const getTasksByUser = async (userId: string): Promise<Task[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('serhub_tasks')
    .select(`
      *,
      section:serhub_sections!section_id(id, number, title)
    `)
    .or(`owner_id.eq.${userId},supervisor_id.eq.${userId}`)
    .order('due_date');
  if (error) {
    console.error('Error fetching user tasks:', error);
    return [];
  }
  return data || [];
};

export const createTask = async (task: Partial<Task>): Promise<Task | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('serhub_tasks')
    .insert(task)
    .select()
    .single();
  if (error) {
    console.error('Error creating task:', error);
    return null;
  }
  return data;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('serhub_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  if (error) {
    console.error('Error updating task:', error);
    return null;
  }
  return data;
};

export const deleteTask = async (taskId: string): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase
    .from('serhub_tasks')
    .delete()
    .eq('id', taskId);
  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }
  return true;
};

// --- TASK COLLABORATORS ---

export const getTaskCollaborators = async (taskId: string): Promise<Profile[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('serhub_task_collaborators')
    .select('user:serhub_profiles!user_id(*)')
    .eq('task_id', taskId);
  if (error) {
    console.error('Error fetching collaborators:', error);
    return [];
  }
  return data?.map(d => d.user) || [];
};

export const addTaskCollaborator = async (taskId: string, userId: string): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase
    .from('serhub_task_collaborators')
    .insert({ task_id: taskId, user_id: userId });
  if (error) {
    console.error('Error adding collaborator:', error);
    return false;
  }
  return true;
};

export const removeTaskCollaborator = async (taskId: string, userId: string): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase
    .from('serhub_task_collaborators')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId);
  if (error) {
    console.error('Error removing collaborator:', error);
    return false;
  }
  return true;
};

// --- MEETING FUNCTIONS ---

export const getMeetings = async (): Promise<Meeting[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('serhub_meetings')
    .select(`
      *,
      creator:serhub_profiles!created_by(*)
    `)
    .order('start_time');
  if (error) {
    console.error('Error fetching meetings:', error);
    return [];
  }
  return data || [];
};

export const getMeetingsByDateRange = async (startDate: string, endDate: string): Promise<Meeting[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('serhub_meetings')
    .select(`
      *,
      creator:serhub_profiles!created_by(*)
    `)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time');
  if (error) {
    console.error('Error fetching meetings by date:', error);
    return [];
  }
  return data || [];
};

export const createMeeting = async (meeting: Partial<Meeting>): Promise<Meeting | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('serhub_meetings')
    .insert(meeting)
    .select()
    .single();
  if (error) {
    console.error('Error creating meeting:', error);
    return null;
  }
  return data;
};

export const updateMeeting = async (meetingId: string, updates: Partial<Meeting>): Promise<Meeting | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('serhub_meetings')
    .update(updates)
    .eq('id', meetingId)
    .select()
    .single();
  if (error) {
    console.error('Error updating meeting:', error);
    return null;
  }
  return data;
};

export const deleteMeeting = async (meetingId: string): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase
    .from('serhub_meetings')
    .delete()
    .eq('id', meetingId);
  if (error) {
    console.error('Error deleting meeting:', error);
    return false;
  }
  return true;
};

// --- MEETING PARTICIPANTS ---

export const getMeetingParticipants = async (meetingId: string): Promise<Profile[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('serhub_meeting_participants')
    .select('user:serhub_profiles!user_id(*)')
    .eq('meeting_id', meetingId);
  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
  return data?.map(d => d.user) || [];
};

export const addMeetingParticipant = async (meetingId: string, userId: string): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase
    .from('serhub_meeting_participants')
    .insert({ meeting_id: meetingId, user_id: userId });
  if (error) {
    console.error('Error adding participant:', error);
    return false;
  }
  return true;
};

// --- STATISTICS FUNCTIONS ---

export const getUserTaskStats = async (userId: string): Promise<UserTaskStats | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .rpc('serhub_get_user_task_stats', { user_uuid: userId });
  if (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
  return data?.[0] || null;
};

export const getOverallProgress = async (): Promise<number> => {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .rpc('serhub_get_overall_progress');
  if (error) {
    console.error('Error fetching overall progress:', error);
    return 0;
  }
  return data || 0;
};

export const getUpcomingDeadlines = async (days: number = 7): Promise<Task[]> => {
  if (!supabase) return [];
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('serhub_tasks')
    .select(`
      *,
      owner:serhub_profiles!owner_id(first_name, last_name),
      section:serhub_sections!section_id(number, title)
    `)
    .gte('due_date', today)
    .lte('due_date', futureDate)
    .lt('status', 100)
    .order('due_date');
  if (error) {
    console.error('Error fetching upcoming deadlines:', error);
    return [];
  }
  return data || [];
};

export const getOverdueTasks = async (): Promise<Task[]> => {
  if (!supabase) return [];
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('serhub_tasks')
    .select(`
      *,
      owner:serhub_profiles!owner_id(first_name, last_name),
      section:serhub_sections!section_id(number, title)
    `)
    .lt('due_date', today)
    .lt('status', 100)
    .order('due_date');
  if (error) {
    console.error('Error fetching overdue tasks:', error);
    return [];
  }
  return data || [];
};

export const getBlockedTasks = async (): Promise<Task[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('serhub_tasks')
    .select(`
      *,
      owner:serhub_profiles!owner_id(first_name, last_name),
      section:serhub_sections!section_id(number, title)
    `)
    .eq('blocked', true)
    .order('due_date');
  if (error) {
    console.error('Error fetching blocked tasks:', error);
    return [];
  }
  return data || [];
};
