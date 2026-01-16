-- SERHUB Initial Schema
-- All tables use serhub_ prefix

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Extends Supabase auth.users
-- ============================================
create table serhub_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  first_name text not null,
  last_name text not null,
  title text, -- e.g., "Dr.", "Prof."
  organization_role text check (organization_role in (
    'institution_management',
    'parent_unit',
    'department_faculty',
    'adjunct_faculty',
    'student',
    'administrative_staff'
  )),
  system_role text not null default 'member' check (system_role in ('admin', 'coordinator', 'member')),
  department text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- SECTIONS TABLE
-- Hierarchical document structure (3 levels)
-- ============================================
create table serhub_sections (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  title text not null,
  description text,
  parent_id uuid references serhub_sections(id) on delete cascade,
  level integer not null check (level in (1, 2, 3)),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for parent lookups
create index idx_serhub_sections_parent on serhub_sections(parent_id);
create index idx_serhub_sections_level on serhub_sections(level);

-- ============================================
-- TASKS TABLE
-- ============================================
create table serhub_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  section_id uuid not null references serhub_sections(id) on delete cascade,
  owner_id uuid not null references serhub_profiles(id),
  reviewer_id uuid references serhub_profiles(id),
  approver_id uuid references serhub_profiles(id),
  status integer not null default 0 check (status >= 0 and status <= 100),
  blocked boolean not null default false,
  blocked_reason text,
  start_date date not null,
  due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_serhub_tasks_section on serhub_tasks(section_id);
create index idx_serhub_tasks_owner on serhub_tasks(owner_id);
create index idx_serhub_tasks_due_date on serhub_tasks(due_date);
create index idx_serhub_tasks_status on serhub_tasks(status);

-- ============================================
-- TASK COLLABORATORS TABLE
-- Many-to-many relationship for task assignments
-- ============================================
create table serhub_task_collaborators (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references serhub_tasks(id) on delete cascade,
  user_id uuid not null references serhub_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  unique(task_id, user_id)
);

-- Index for user lookups
create index idx_serhub_task_collaborators_user on serhub_task_collaborators(user_id);

-- ============================================
-- TASK DEPENDENCIES TABLE
-- Track prerequisite relationships between tasks
-- ============================================
create table serhub_task_dependencies (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references serhub_tasks(id) on delete cascade,
  depends_on_task_id uuid not null references serhub_tasks(id) on delete cascade,
  created_at timestamptz not null default now(),

  unique(task_id, depends_on_task_id),
  check (task_id != depends_on_task_id)
);

-- Indexes for dependency lookups
create index idx_serhub_task_dependencies_task on serhub_task_dependencies(task_id);
create index idx_serhub_task_dependencies_depends on serhub_task_dependencies(depends_on_task_id);

-- ============================================
-- MEETINGS TABLE
-- Calendar events with recurrence support
-- ============================================
create table serhub_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  meeting_type text not null default 'other' check (meeting_type in (
    'project_meeting',
    'review_meeting',
    'recurring_meeting',
    'other'
  )),
  start_time timestamptz not null,
  end_time timestamptz not null,
  recurrence_rule text, -- iCal RRULE format
  created_by uuid not null references serhub_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (end_time > start_time)
);

-- Index for date range queries
create index idx_serhub_meetings_start on serhub_meetings(start_time);
create index idx_serhub_meetings_created_by on serhub_meetings(created_by);

-- ============================================
-- MEETING PARTICIPANTS TABLE
-- ============================================
create table serhub_meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references serhub_meetings(id) on delete cascade,
  user_id uuid not null references serhub_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  unique(meeting_id, user_id)
);

-- Index for user lookups
create index idx_serhub_meeting_participants_user on serhub_meeting_participants(user_id);

-- ============================================
-- AUDIT LOG TABLE
-- Track all changes for compliance
-- ============================================
create table serhub_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references serhub_profiles(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('create', 'update', 'delete')),
  field_name text,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

-- Indexes for audit queries
create index idx_serhub_audit_log_entity on serhub_audit_log(entity_type, entity_id);
create index idx_serhub_audit_log_user on serhub_audit_log(user_id);
create index idx_serhub_audit_log_created on serhub_audit_log(created_at);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
create table serhub_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references serhub_profiles(id) on delete cascade unique,
  digest_frequency text not null default 'daily' check (digest_frequency in ('daily', 'twice_daily', 'off')),
  last_digest_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
