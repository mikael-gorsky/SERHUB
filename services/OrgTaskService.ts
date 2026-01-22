import { OrgTask, Task } from '../types';
import { supabase, isConfigured } from '../lib/supabase';

export const OrgTaskService = {
  getAll: async (): Promise<OrgTask[]> => {
    console.log('OrgTaskService.getAll called, isConfigured:', isConfigured, 'supabase:', !!supabase);
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_org_tasks')
      .select(`
        *,
        owner:serhub_profiles!owner_id(id, name, email, role, is_user),
        supervisor:serhub_profiles!supervisor_id(id, name, email, role, is_user),
        collaborator_links:serhub_org_task_collaborators(user:serhub_profiles!user_id(id, name, email, role, is_user))
      `)
      .order('due_date');
    console.log('OrgTaskService.getAll result:', { count: data?.length, error });
    if (error) throw error;
    // Debug: log first task's collaborator_links
    if (data && data.length > 0) {
      console.log('OrgTaskService.getAll - first task collaborator_links:', data[0].collaborator_links);
    }
    // Flatten collaborators from {user: Profile}[] to Profile[]
    return (data || []).map(task => ({
      ...task,
      collaborators: task.collaborator_links?.map((link: { user: any }) => link.user).filter(Boolean) || []
    }));
  },

  getByUserId: async (userId: string): Promise<OrgTask[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_org_tasks')
      .select(`
        *,
        owner:serhub_profiles!owner_id(id, name, email, role, is_user),
        supervisor:serhub_profiles!supervisor_id(id, name, email, role, is_user),
        collaborator_links:serhub_org_task_collaborators(user:serhub_profiles!user_id(id, name, email, role, is_user))
      `)
      .or(`owner_id.eq.${userId},supervisor_id.eq.${userId}`)
      .order('due_date');
    if (error) throw error;
    // Flatten collaborators from {user: Profile}[] to Profile[]
    return (data || []).map(task => ({
      ...task,
      collaborators: task.collaborator_links?.map((link: { user: any }) => link.user).filter(Boolean) || []
    }));
  },

  getById: async (id: string): Promise<OrgTask | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_org_tasks')
      .select(`
        *,
        owner:serhub_profiles!owner_id(*),
        supervisor:serhub_profiles!supervisor_id(*)
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  create: async (task: Partial<OrgTask>): Promise<OrgTask | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_org_tasks')
      .insert(task)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (taskId: string, updates: Partial<OrgTask>): Promise<OrgTask | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    // Remove joined fields before update
    const { owner, supervisor, collaborators, linked_tasks, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase
      .from('serhub_org_tasks')
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
      .from('serhub_org_tasks')
      .delete()
      .eq('id', taskId);
    if (error) throw error;
    return true;
  },

  updateStatus: async (taskId: string, status: number): Promise<OrgTask | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_org_tasks')
      .update({ status })
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  setBlocked: async (taskId: string, blocked: boolean, reason?: string): Promise<OrgTask | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_org_tasks')
      .update({ blocked, blocked_reason: reason || null })
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ============================================
  // COLLABORATORS
  // ============================================

  getCollaborators: async (taskId: string): Promise<string[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_org_task_collaborators')
      .select('user_id')
      .eq('org_task_id', taskId);
    if (error) throw error;
    return data?.map(c => c.user_id) || [];
  },

  addCollaborator: async (taskId: string, userId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { error } = await supabase
      .from('serhub_org_task_collaborators')
      .insert({ org_task_id: taskId, user_id: userId });
    if (error && error.code !== '23505') throw error; // Ignore unique constraint violation
    return true;
  },

  removeCollaborator: async (taskId: string, userId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { error } = await supabase
      .from('serhub_org_task_collaborators')
      .delete()
      .eq('org_task_id', taskId)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  },

  // ============================================
  // LINKED REPORT TASKS
  // ============================================

  getLinkedTasks: async (orgTaskId: string): Promise<Task[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_org_task_links')
      .select(`
        report_task_id,
        task:serhub_tasks!report_task_id(
          id, title, status, due_date,
          section:serhub_sections!section_id(number, title)
        )
      `)
      .eq('org_task_id', orgTaskId);
    if (error) throw error;
    return data?.map(link => link.task).filter(Boolean) as Task[] || [];
  },

  linkTask: async (orgTaskId: string, reportTaskId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { error } = await supabase
      .from('serhub_org_task_links')
      .insert({ org_task_id: orgTaskId, report_task_id: reportTaskId });
    if (error && error.code !== '23505') throw error; // Ignore unique constraint violation
    return true;
  },

  unlinkTask: async (orgTaskId: string, reportTaskId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { error } = await supabase
      .from('serhub_org_task_links')
      .delete()
      .eq('org_task_id', orgTaskId)
      .eq('report_task_id', reportTaskId);
    if (error) throw error;
    return true;
  },

  // Get all org tasks that link to a specific report task
  getOrgTasksForReportTask: async (reportTaskId: string): Promise<OrgTask[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data: links, error: linkError } = await supabase
      .from('serhub_org_task_links')
      .select('org_task_id')
      .eq('report_task_id', reportTaskId);
    if (linkError) throw linkError;

    if (!links || links.length === 0) return [];

    const orgTaskIds = links.map(l => l.org_task_id);
    const { data, error } = await supabase
      .from('serhub_org_tasks')
      .select(`
        *,
        owner:serhub_profiles!owner_id(id, name, email, role, is_user)
      `)
      .in('id', orgTaskIds);
    if (error) throw error;
    return data || [];
  }
};
