// Re-export task functions from supabase.ts
export {
  getTasks,
  getTasksBySection,
  getTasksByUser,
  createTask,
  updateTask,
  deleteTask,
  getTaskCollaborators,
  addTaskCollaborator,
  removeTaskCollaborator,
  getUpcomingDeadlines,
  getOverdueTasks,
  getBlockedTasks
} from '../lib/supabase';

import { Task } from '../types';
import { supabase, isConfigured } from '../lib/supabase';

export const TaskService = {
  getAll: async (): Promise<Task[]> => {
    console.log('TaskService.getAll called, isConfigured:', isConfigured, 'supabase:', !!supabase);
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_tasks')
      .select(`
        *,
        owner:serhub_profiles!owner_id(id, name, email, role, is_user),
        supervisor:serhub_profiles!supervisor_id(id, name, email, role, is_user),
        section:serhub_sections!section_id(id, number, title),
        collaborator_links:serhub_task_collaborators(user:serhub_profiles!user_id(id, name, email, role, is_user))
      `)
      .order('due_date');
    console.log('TaskService.getAll result:', { count: data?.length, error });
    if (error) throw error;
    // Debug: log first task's collaborator_links
    if (data && data.length > 0) {
      console.log('TaskService.getAll - first task collaborator_links:', data[0].collaborator_links);
    }
    // Flatten collaborators from {user: Profile}[] to Profile[]
    return (data || []).map(task => ({
      ...task,
      collaborators: task.collaborator_links?.map((link: { user: any }) => link.user).filter(Boolean) || []
    }));
  },

  getBySectionId: async (sectionId: string): Promise<Task[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_tasks')
      .select(`
        *,
        owner:serhub_profiles!owner_id(id, name, email, role, is_user),
        reviewer:serhub_profiles!reviewer_id(id, name, email, role, is_user),
        collaborator_links:serhub_task_collaborators(user:serhub_profiles!user_id(id, name, email, role, is_user))
      `)
      .eq('section_id', sectionId)
      .order('due_date');
    if (error) throw error;
    // Flatten collaborators from {user: Profile}[] to Profile[]
    return (data || []).map(task => ({
      ...task,
      collaborators: task.collaborator_links?.map((link: { user: any }) => link.user).filter(Boolean) || []
    }));
  },

  getByUserId: async (userId: string): Promise<Task[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_tasks')
      .select(`
        *,
        section:serhub_sections!section_id(id, number, title)
      `)
      .or(`owner_id.eq.${userId},reviewer_id.eq.${userId},approver_id.eq.${userId}`)
      .order('due_date');
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string): Promise<Task | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_tasks')
      .select(`
        *,
        owner:serhub_profiles!owner_id(*),
        reviewer:serhub_profiles!reviewer_id(*),
        approver:serhub_profiles!approver_id(*),
        section:serhub_sections!section_id(*)
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  create: async (task: Partial<Task>): Promise<Task | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_tasks')
      .insert(task)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    // Remove joined fields before update
    const { owner, reviewer, approver, section, collaborators, dependencies, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase
      .from('serhub_tasks')
      .update(cleanUpdates)
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (taskId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { error } = await supabase
      .from('serhub_tasks')
      .delete()
      .eq('id', taskId);
    if (error) throw error;
    return true;
  },

  updateStatus: async (taskId: string, status: number): Promise<Task | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_tasks')
      .update({ status })
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  setBlocked: async (taskId: string, blocked: boolean, reason?: string): Promise<Task | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_tasks')
      .update({ blocked, blocked_reason: reason || null })
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
