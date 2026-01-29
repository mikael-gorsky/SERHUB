import { Group, Task } from '../types';
import { supabase, isConfigured } from '../lib/supabase';

// ============================================
// GROUP CRUD OPERATIONS
// ============================================

export const getGroups = async (): Promise<Group[]> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }
  const { data, error } = await supabase
    .from('serhub_groups')
    .select(`
      *,
      owner:serhub_profiles!owner_id(id, name, email, role, is_user)
    `)
    .order('sort_order');
  if (error) throw error;
  return data || [];
};

export const getGroupsHierarchy = async (): Promise<Group[]> => {
  const groups = await getGroups();

  // Get all group tasks with task data
  const groupTasks = await getGroupTasksWithData();

  // Build hierarchy
  const level1 = groups.filter(g => g.level === 1);
  const level2 = groups.filter(g => g.level === 2);
  const level3 = groups.filter(g => g.level === 3);

  // Attach tasks and compute stats for each group
  const attachTasksAndStats = (group: Group) => {
    const tasks = groupTasks.filter(gt => gt.group_id === group.id).map(gt => gt.task);
    group.linked_tasks = tasks;
    group.task_count = tasks.length;
    group.completed_count = tasks.filter(t => t.status === 100).length;
    group.blocked_count = tasks.filter(t => t.blocked).length;
    group.progress = tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + t.status, 0) / tasks.length)
      : 0;
  };

  // Attach level 3 to level 2 and compute stats
  level2.forEach(g2 => {
    g2.children = level3.filter(g3 => g3.parent_id === g2.id);
    g2.children.forEach(attachTasksAndStats);
    attachTasksAndStats(g2);
  });

  // Attach level 2 to level 1 and compute stats
  level1.forEach(g1 => {
    g1.children = level2.filter(g2 => g2.parent_id === g1.id);
    attachTasksAndStats(g1);

    // Also aggregate children stats for level 1
    const allDescendantTasks: Task[] = [];
    g1.children.forEach(g2 => {
      if (g2.linked_tasks) allDescendantTasks.push(...g2.linked_tasks);
      g2.children?.forEach(g3 => {
        if (g3.linked_tasks) allDescendantTasks.push(...g3.linked_tasks);
      });
    });
    if (g1.linked_tasks) allDescendantTasks.push(...g1.linked_tasks);

    g1.task_count = allDescendantTasks.length;
    g1.completed_count = allDescendantTasks.filter(t => t.status === 100).length;
    g1.blocked_count = allDescendantTasks.filter(t => t.blocked).length;
    g1.progress = allDescendantTasks.length > 0
      ? Math.round(allDescendantTasks.reduce((sum, t) => sum + t.status, 0) / allDescendantTasks.length)
      : 0;
  });

  return level1;
};

export const getGroupById = async (id: string): Promise<Group | null> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }
  const { data, error } = await supabase
    .from('serhub_groups')
    .select(`
      *,
      owner:serhub_profiles!owner_id(id, name, email, role, is_user)
    `)
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const createGroup = async (group: Partial<Group>): Promise<Group | null> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }
  const { data, error } = await supabase
    .from('serhub_groups')
    .insert(group)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateGroup = async (id: string, updates: Partial<Group>): Promise<Group | null> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }
  const { data, error } = await supabase
    .from('serhub_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteGroup = async (id: string): Promise<boolean> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }
  const { error } = await supabase
    .from('serhub_groups')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

// ============================================
// GROUP TASK LINKING
// ============================================

interface GroupTaskWithData {
  id: string;
  group_id: string;
  task_id: string;
  task: Task;
}

export const getGroupTasksWithData = async (): Promise<GroupTaskWithData[]> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }
  const { data, error } = await supabase
    .from('serhub_group_tasks')
    .select(`
      id,
      group_id,
      task_id,
      task:serhub_tasks!task_id(
        id, title, description, section_id, owner_id, supervisor_id,
        status, blocked, blocked_reason, start_date, due_date,
        owner:serhub_profiles!owner_id(id, name, email, role, is_user),
        section:serhub_sections!section_id(id, number, title)
      )
    `);
  if (error) throw error;
  return (data || []).map(d => ({
    id: d.id,
    group_id: d.group_id,
    task_id: d.task_id,
    task: d.task as Task
  }));
};

export const getTasksForGroup = async (groupId: string): Promise<Task[]> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }
  const { data, error } = await supabase
    .from('serhub_group_tasks')
    .select(`
      task:serhub_tasks!task_id(
        id, title, description, section_id, owner_id, supervisor_id,
        status, blocked, blocked_reason, start_date, due_date,
        owner:serhub_profiles!owner_id(id, name, email, role, is_user),
        section:serhub_sections!section_id(id, number, title)
      )
    `)
    .eq('group_id', groupId);
  if (error) throw error;
  return (data || []).map(d => d.task as Task);
};

export const linkTaskToGroup = async (groupId: string, taskId: string): Promise<boolean> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }
  const { error } = await supabase
    .from('serhub_group_tasks')
    .insert({ group_id: groupId, task_id: taskId });
  if (error) throw error;
  return true;
};

export const unlinkTaskFromGroup = async (groupId: string, taskId: string): Promise<boolean> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }
  const { error } = await supabase
    .from('serhub_group_tasks')
    .delete()
    .eq('group_id', groupId)
    .eq('task_id', taskId);
  if (error) throw error;
  return true;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getNextSortOrder = async (parentId?: string, level?: number): Promise<number> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }

  let query = supabase
    .from('serhub_groups')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else if (level) {
    query = query.eq('level', level).is('parent_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data && data.length > 0 ? data[0].sort_order + 1 : 1;
};

export const generateNextNumber = async (parentNumber?: string, parentId?: string): Promise<string> => {
  if (!isConfigured || !supabase) {
    throw new Error("Database not configured.");
  }

  // Get siblings to determine next number
  let query = supabase
    .from('serhub_groups')
    .select('number')
    .order('number', { ascending: false });

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    query = query.is('parent_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;

  if (!data || data.length === 0) {
    return parentNumber ? `${parentNumber}.1` : '1';
  }

  // Get the last number and increment
  const lastNumber = data[0].number;
  const parts = lastNumber.split('.');
  const lastPart = parseInt(parts[parts.length - 1], 10);

  if (parentNumber) {
    return `${parentNumber}.${lastPart + 1}`;
  } else {
    return `${lastPart + 1}`;
  }
};

export const GroupService = {
  getAll: getGroups,
  getHierarchy: getGroupsHierarchy,
  getById: getGroupById,
  create: createGroup,
  update: updateGroup,
  delete: deleteGroup,
  getTasks: getTasksForGroup,
  linkTask: linkTaskToGroup,
  unlinkTask: unlinkTaskFromGroup,
  getNextSortOrder,
  generateNextNumber
};
