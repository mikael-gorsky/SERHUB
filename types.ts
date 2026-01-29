// SERHUB Types - Matching database schema

// ============================================
// USER & PROFILE TYPES
// ============================================

export type SystemRole = 'admin' | 'supervisor' | 'contributor';

export interface Profile {
  id: string;
  name: string;
  email: string;
  is_user: boolean;
  description?: string;
  role: SystemRole;
  other_contact?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  // Granular permissions (for login users only)
  can_create_tasks?: boolean;
  can_edit_tasks?: boolean;
  can_create_meetings?: boolean;
  can_edit_meetings?: boolean;
}

// Helper type for display
export interface User {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  isUser: boolean;
  avatar?: string;
}

// ============================================
// SECTION TYPES
// ============================================

export interface Section {
  id: string;
  number: string;
  title: string;
  description?: string;
  parent_id?: string;
  level: 1 | 2 | 3;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Computed fields (from functions or joins)
  progress?: number;
  status?: SectionStatus;
  children?: Section[];
  tasks?: Task[];
}

export type SectionStatus = 'on_track' | 'approaching' | 'overdue' | 'blocked' | 'complete';

// ============================================
// TASK TYPES
// ============================================

export interface Task {
  id: string;
  title: string;
  description?: string;
  section_id: string;
  owner_id: string;
  supervisor_id?: string;
  status: number; // 0-100 progress percentage
  blocked: boolean;
  blocked_reason?: string;
  start_date: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  // Joined data
  owner?: Profile;
  supervisor?: Profile;
  section?: Section;
  collaborators?: Profile[];
  dependencies?: Task[];
}

export type TaskStatusLabel = 'on_track' | 'approaching' | 'overdue' | 'blocked' | 'complete';

export interface TaskCollaborator {
  id: string;
  task_id: string;
  user_id: string;
  created_at: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
}

// ============================================
// MEETING TYPES
// ============================================

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  recurrence_rule?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: Profile;
  participants?: Profile[];
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  created_at: string;
}

// ============================================
// AUDIT & NOTIFICATION TYPES
// ============================================

export interface AuditLog {
  id: string;
  user_id?: string;
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export type DigestFrequency = 'daily' | 'twice_daily' | 'off';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  digest_frequency: DigestFrequency;
  last_digest_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// DASHBOARD STATISTICS
// ============================================

export interface UserTaskStats {
  owned_tasks: number;
  collaborating_tasks: number;
  supervising_tasks: number;
  overdue_tasks: number;
  completed_tasks: number;
}

export interface ProjectStats {
  overall_progress: number;
  total_sections: number;
  total_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
  upcoming_deadlines: Task[];
}

// ============================================
// CALENDAR EVENT (for display)
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'deadline';
  data: Meeting | Task;
}

// ============================================
// GROUP TYPES (Gantt view)
// ============================================

export interface Group {
  id: string;
  number: string;
  title: string;
  description?: string;
  parent_id?: string;
  level: 1 | 2 | 3;
  sort_order: number;
  is_fixed: boolean;  // Level 1 groups are fixed
  owner_id?: string;
  created_at: string;
  updated_at: string;

  // Joined/computed
  owner?: Profile;
  children?: Group[];
  linked_tasks?: Task[];

  // Derived from linked tasks
  progress?: number;        // Average of linked task progress
  task_count?: number;      // Number of linked tasks
  completed_count?: number; // Tasks at 100%
  blocked_count?: number;   // Blocked tasks
}

export interface GroupTask {
  id: string;
  group_id: string;
  task_id: string;
  created_at: string;
}

export type GroupStatus = 'not_started' | 'in_progress' | 'on_track' | 'at_risk' | 'delayed' | 'completed' | 'blocked';

export type GanttViewMode = 'weekly' | 'biweekly' | 'monthly';
