// SERHUB Types - Matching database schema

// ============================================
// USER & PROFILE TYPES
// ============================================

export type SystemRole = 'admin' | 'coordinator' | 'member';

// Backward compatibility - alias for components still using UserRole
export const UserRole = {
  ADMIN: 'admin' as SystemRole,
  COORDINATOR: 'coordinator' as SystemRole,
  MEMBER: 'member' as SystemRole,
  // Legacy mappings
  SUPERVISOR: 'coordinator' as SystemRole,
  TEAM_MEMBER: 'member' as SystemRole
};

export type OrganizationRole =
  | 'institution_management'
  | 'parent_unit'
  | 'department_faculty'
  | 'adjunct_faculty'
  | 'student'
  | 'administrative_staff';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  title?: string;
  organization_role?: OrganizationRole;
  system_role: SystemRole;
  department?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper type for display
export interface User {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
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
// ORGANIZATIONAL TASK TYPES
// ============================================

export interface OrgTask {
  id: string;
  title: string;
  description?: string;
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
  collaborators?: Profile[];
  linked_tasks?: Task[]; // Report tasks this org task feeds into
}

export interface OrgTaskLink {
  id: string;
  org_task_id: string;
  report_task_id: string;
  created_at: string;
}

export interface OrgTaskCollaborator {
  id: string;
  org_task_id: string;
  user_id: string;
  created_at: string;
}

// ============================================
// MEETING TYPES
// ============================================

export type MeetingType = 'project_meeting' | 'review_meeting' | 'recurring_meeting' | 'status_meeting' | 'other';
export type MeetingLevel = 'team' | 'faculty' | 'institute';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  meeting_type: MeetingType;
  level?: MeetingLevel;
  location?: string;
  start_time: string;
  end_time: string;
  recurrence_rule?: string;
  agenda: string[];
  notes?: string;
  action_items: string[];
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
