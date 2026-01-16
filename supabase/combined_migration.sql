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
-- SERHUB Row Level Security Policies

-- Enable RLS on all tables
alter table serhub_profiles enable row level security;
alter table serhub_sections enable row level security;
alter table serhub_tasks enable row level security;
alter table serhub_task_collaborators enable row level security;
alter table serhub_task_dependencies enable row level security;
alter table serhub_meetings enable row level security;
alter table serhub_meeting_participants enable row level security;
alter table serhub_audit_log enable row level security;
alter table serhub_notification_preferences enable row level security;

-- ============================================
-- Helper function to check user's system role
-- ============================================
create or replace function serhub_get_user_role()
returns text as $$
  select system_role from serhub_profiles where id = auth.uid()
$$ language sql security definer stable;

create or replace function serhub_is_admin()
returns boolean as $$
  select exists (
    select 1 from serhub_profiles
    where id = auth.uid() and system_role = 'admin'
  )
$$ language sql security definer stable;

create or replace function serhub_is_coordinator_or_admin()
returns boolean as $$
  select exists (
    select 1 from serhub_profiles
    where id = auth.uid() and system_role in ('admin', 'coordinator')
  )
$$ language sql security definer stable;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- All authenticated users can read all profiles
create policy "profiles_select_all"
  on serhub_profiles for select
  to authenticated
  using (true);

-- Users can update their own profile
create policy "profiles_update_own"
  on serhub_profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can update any profile
create policy "profiles_update_admin"
  on serhub_profiles for update
  to authenticated
  using (serhub_is_admin())
  with check (serhub_is_admin());

-- Allow insert for new user registration (handled by trigger usually)
create policy "profiles_insert_own"
  on serhub_profiles for insert
  to authenticated
  with check (id = auth.uid());

-- ============================================
-- SECTIONS POLICIES
-- ============================================

-- All authenticated users can read sections
create policy "sections_select_all"
  on serhub_sections for select
  to authenticated
  using (true);

-- Only admins can insert sections
create policy "sections_insert_admin"
  on serhub_sections for insert
  to authenticated
  with check (serhub_is_admin());

-- Only admins can update sections
create policy "sections_update_admin"
  on serhub_sections for update
  to authenticated
  using (serhub_is_admin())
  with check (serhub_is_admin());

-- Only admins can delete sections
create policy "sections_delete_admin"
  on serhub_sections for delete
  to authenticated
  using (serhub_is_admin());

-- ============================================
-- TASKS POLICIES
-- ============================================

-- All authenticated users can read tasks
create policy "tasks_select_all"
  on serhub_tasks for select
  to authenticated
  using (true);

-- Coordinators and admins can insert tasks
create policy "tasks_insert_coordinator"
  on serhub_tasks for insert
  to authenticated
  with check (serhub_is_coordinator_or_admin());

-- Users can update tasks if they are owner, collaborator, reviewer, approver, coordinator, or admin
create policy "tasks_update_involved"
  on serhub_tasks for update
  to authenticated
  using (
    owner_id = auth.uid()
    or reviewer_id = auth.uid()
    or approver_id = auth.uid()
    or exists (
      select 1 from serhub_task_collaborators
      where task_id = serhub_tasks.id and user_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  )
  with check (
    owner_id = auth.uid()
    or reviewer_id = auth.uid()
    or approver_id = auth.uid()
    or exists (
      select 1 from serhub_task_collaborators
      where task_id = serhub_tasks.id and user_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- Only coordinators and admins can delete tasks
create policy "tasks_delete_coordinator"
  on serhub_tasks for delete
  to authenticated
  using (serhub_is_coordinator_or_admin());

-- ============================================
-- TASK COLLABORATORS POLICIES
-- ============================================

-- All authenticated users can read
create policy "task_collaborators_select_all"
  on serhub_task_collaborators for select
  to authenticated
  using (true);

-- Task owner, coordinators, and admins can insert
create policy "task_collaborators_insert"
  on serhub_task_collaborators for insert
  to authenticated
  with check (
    exists (
      select 1 from serhub_tasks
      where id = task_id and owner_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- Task owner, coordinators, and admins can delete
create policy "task_collaborators_delete"
  on serhub_task_collaborators for delete
  to authenticated
  using (
    exists (
      select 1 from serhub_tasks
      where id = task_id and owner_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- ============================================
-- TASK DEPENDENCIES POLICIES
-- ============================================

-- All authenticated users can read
create policy "task_dependencies_select_all"
  on serhub_task_dependencies for select
  to authenticated
  using (true);

-- Task owner, coordinators, and admins can insert
create policy "task_dependencies_insert"
  on serhub_task_dependencies for insert
  to authenticated
  with check (
    exists (
      select 1 from serhub_tasks
      where id = task_id and owner_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- Task owner, coordinators, and admins can delete
create policy "task_dependencies_delete"
  on serhub_task_dependencies for delete
  to authenticated
  using (
    exists (
      select 1 from serhub_tasks
      where id = task_id and owner_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- ============================================
-- MEETINGS POLICIES
-- ============================================

-- All authenticated users can read meetings
create policy "meetings_select_all"
  on serhub_meetings for select
  to authenticated
  using (true);

-- Coordinators and admins can insert
create policy "meetings_insert_coordinator"
  on serhub_meetings for insert
  to authenticated
  with check (serhub_is_coordinator_or_admin());

-- Meeting creator, coordinators, and admins can update
create policy "meetings_update"
  on serhub_meetings for update
  to authenticated
  using (
    created_by = auth.uid()
    or serhub_is_coordinator_or_admin()
  )
  with check (
    created_by = auth.uid()
    or serhub_is_coordinator_or_admin()
  );

-- Coordinators and admins can delete
create policy "meetings_delete_coordinator"
  on serhub_meetings for delete
  to authenticated
  using (serhub_is_coordinator_or_admin());

-- ============================================
-- MEETING PARTICIPANTS POLICIES
-- ============================================

-- All authenticated users can read
create policy "meeting_participants_select_all"
  on serhub_meeting_participants for select
  to authenticated
  using (true);

-- Meeting creator, coordinators, and admins can insert
create policy "meeting_participants_insert"
  on serhub_meeting_participants for insert
  to authenticated
  with check (
    exists (
      select 1 from serhub_meetings
      where id = meeting_id and created_by = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- Meeting creator, coordinators, and admins can delete
create policy "meeting_participants_delete"
  on serhub_meeting_participants for delete
  to authenticated
  using (
    exists (
      select 1 from serhub_meetings
      where id = meeting_id and created_by = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- ============================================
-- AUDIT LOG POLICIES
-- ============================================

-- Only admins can read audit log
create policy "audit_log_select_admin"
  on serhub_audit_log for select
  to authenticated
  using (serhub_is_admin());

-- No direct insert allowed (handled by triggers)
-- Insert policy for service role only (triggers use security definer)

-- ============================================
-- NOTIFICATION PREFERENCES POLICIES
-- ============================================

-- Users can read their own preferences
create policy "notification_prefs_select_own"
  on serhub_notification_preferences for select
  to authenticated
  using (user_id = auth.uid());

-- Users can insert their own preferences
create policy "notification_prefs_insert_own"
  on serhub_notification_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can update their own preferences
create policy "notification_prefs_update_own"
  on serhub_notification_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
-- SERHUB Functions and Triggers

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- Automatically updates the updated_at timestamp
-- ============================================
create or replace function serhub_update_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all relevant tables
create trigger serhub_profiles_updated_at
  before update on serhub_profiles
  for each row execute function serhub_update_updated_at();

create trigger serhub_sections_updated_at
  before update on serhub_sections
  for each row execute function serhub_update_updated_at();

create trigger serhub_tasks_updated_at
  before update on serhub_tasks
  for each row execute function serhub_update_updated_at();

create trigger serhub_meetings_updated_at
  before update on serhub_meetings
  for each row execute function serhub_update_updated_at();

create trigger serhub_notification_prefs_updated_at
  before update on serhub_notification_preferences
  for each row execute function serhub_update_updated_at();

-- ============================================
-- AUDIT LOG TRIGGER FUNCTION
-- Automatically logs changes to key tables
-- ============================================
create or replace function serhub_log_audit()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    insert into serhub_audit_log (user_id, entity_type, entity_id, action, new_value)
    values (auth.uid(), TG_TABLE_NAME, NEW.id, 'create', row_to_json(NEW)::text);
    return NEW;
  elsif TG_OP = 'UPDATE' then
    insert into serhub_audit_log (user_id, entity_type, entity_id, action, old_value, new_value)
    values (auth.uid(), TG_TABLE_NAME, NEW.id, 'update', row_to_json(OLD)::text, row_to_json(NEW)::text);
    return NEW;
  elsif TG_OP = 'DELETE' then
    insert into serhub_audit_log (user_id, entity_type, entity_id, action, old_value)
    values (auth.uid(), TG_TABLE_NAME, OLD.id, 'delete', row_to_json(OLD)::text);
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Apply audit log trigger to tasks
create trigger serhub_tasks_audit
  after insert or update or delete on serhub_tasks
  for each row execute function serhub_log_audit();

-- Apply audit log trigger to profiles (for role changes, etc.)
create trigger serhub_profiles_audit
  after insert or update or delete on serhub_profiles
  for each row execute function serhub_log_audit();

-- Apply audit log trigger to meetings
create trigger serhub_meetings_audit
  after insert or update or delete on serhub_meetings
  for each row execute function serhub_log_audit();

-- ============================================
-- SECTION PROGRESS CALCULATION
-- Recursive function to calculate aggregated progress
-- ============================================
create or replace function serhub_get_section_progress(section_uuid uuid)
returns integer as $$
declare
  direct_task_avg numeric;
  child_section_avg numeric;
  task_count integer;
  child_count integer;
begin
  -- Get average status of direct tasks
  select count(*), coalesce(avg(status), 0)
  into task_count, direct_task_avg
  from serhub_tasks
  where section_id = section_uuid;

  -- Get average progress of child sections (recursive)
  select count(*), coalesce(avg(serhub_get_section_progress(id)), 0)
  into child_count, child_section_avg
  from serhub_sections
  where parent_id = section_uuid;

  -- If no tasks and no children, return 0
  if task_count + child_count = 0 then
    return 0;
  end if;

  -- Return weighted average
  return round(((direct_task_avg * task_count) + (child_section_avg * child_count)) / (task_count + child_count));
end;
$$ language plpgsql stable;

-- ============================================
-- GET SECTION STATUS
-- Returns status based on task states
-- ============================================
create or replace function serhub_get_section_status(section_uuid uuid)
returns text as $$
declare
  has_blocked boolean;
  has_overdue boolean;
  has_approaching boolean;
  total_tasks integer;
  completed_tasks integer;
begin
  -- Check for blocked tasks
  select exists (
    select 1 from serhub_tasks
    where section_id = section_uuid and blocked = true
  ) into has_blocked;

  if has_blocked then
    return 'blocked';
  end if;

  -- Check for overdue tasks
  select exists (
    select 1 from serhub_tasks
    where section_id = section_uuid
      and due_date < current_date
      and status < 100
  ) into has_overdue;

  if has_overdue then
    return 'overdue';
  end if;

  -- Check for approaching deadline (within 7 days)
  select exists (
    select 1 from serhub_tasks
    where section_id = section_uuid
      and due_date between current_date and current_date + interval '7 days'
      and status < 100
  ) into has_approaching;

  if has_approaching then
    return 'approaching';
  end if;

  -- Check if all tasks are complete
  select count(*), count(*) filter (where status = 100)
  into total_tasks, completed_tasks
  from serhub_tasks
  where section_id = section_uuid;

  if total_tasks > 0 and total_tasks = completed_tasks then
    return 'complete';
  end if;

  return 'on_track';
end;
$$ language plpgsql stable;

-- ============================================
-- GET USER FULL NAME
-- Helper function for display
-- ============================================
create or replace function serhub_get_user_full_name(user_uuid uuid)
returns text as $$
  select
    case
      when title is not null then title || ' ' || first_name || ' ' || last_name
      else first_name || ' ' || last_name
    end
  from serhub_profiles
  where id = user_uuid
$$ language sql stable;

-- ============================================
-- GET TASK STATUS LABEL
-- Returns human-readable status
-- ============================================
create or replace function serhub_get_task_status_label(task_row serhub_tasks)
returns text as $$
begin
  if task_row.blocked then
    return 'blocked';
  end if;

  if task_row.status = 100 then
    return 'complete';
  end if;

  if task_row.due_date < current_date then
    return 'overdue';
  end if;

  if task_row.due_date between current_date and current_date + interval '7 days' then
    return 'approaching';
  end if;

  return 'on_track';
end;
$$ language plpgsql stable;

-- ============================================
-- CREATE PROFILE ON USER SIGNUP
-- Trigger to auto-create profile when user signs up
-- ============================================
create or replace function serhub_handle_new_user()
returns trigger as $$
begin
  insert into serhub_profiles (id, email, first_name, last_name, system_role)
  values (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    coalesce(NEW.raw_user_meta_data->>'last_name', ''),
    coalesce(NEW.raw_user_meta_data->>'system_role', 'member')
  );
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function serhub_handle_new_user();

-- ============================================
-- CALCULATE OVERALL PROJECT PROGRESS
-- ============================================
create or replace function serhub_get_overall_progress()
returns integer as $$
declare
  total_progress numeric;
begin
  select coalesce(avg(serhub_get_section_progress(id)), 0)
  into total_progress
  from serhub_sections
  where level = 1;

  return round(total_progress);
end;
$$ language plpgsql stable;

-- ============================================
-- GET USER TASK STATISTICS
-- Returns task counts for a user
-- ============================================
create or replace function serhub_get_user_task_stats(user_uuid uuid)
returns table (
  owned_tasks integer,
  collaborating_tasks integer,
  reviewing_tasks integer,
  overdue_tasks integer,
  completed_tasks integer
) as $$
begin
  return query
  select
    (select count(*)::integer from serhub_tasks where owner_id = user_uuid),
    (select count(*)::integer from serhub_task_collaborators where user_id = user_uuid),
    (select count(*)::integer from serhub_tasks where reviewer_id = user_uuid or approver_id = user_uuid),
    (select count(*)::integer from serhub_tasks where owner_id = user_uuid and due_date < current_date and status < 100),
    (select count(*)::integer from serhub_tasks where owner_id = user_uuid and status = 100);
end;
$$ language plpgsql stable;
-- SERHUB Sections Seed Data
-- CHE Self-Evaluation Report Structure

-- Level 1 sections (main chapters)
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('0', 'Executive Summary', 'Overview of the self-evaluation report highlighting key findings and recommendations', 1, null, 0),
('1', 'The Institution and the Parent Unit', 'Description of the institution, its mission, and organizational structure', 1, null, 1),
('2', 'Internal Quality Assurance', 'Quality assurance policies, procedures, and continuous improvement processes', 1, null, 2),
('3', 'The Department and the Study Program', 'Comprehensive evaluation of the academic department and its programs', 1, null, 3);

-- Level 2 sections under Chapter 1
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('1.1', 'Institution Summary', 'Brief overview of the institution including history, size, and scope', 2, (select id from serhub_sections where number = '1'), 1),
('1.2', 'Mission Statement', 'The institution''s mission, vision, and strategic goals', 2, (select id from serhub_sections where number = '1'), 2),
('1.3', 'Parent Unit Description', 'Description of the faculty or school housing the department', 2, (select id from serhub_sections where number = '1'), 3),
('1.4', 'Decision-Making Process', 'Governance structure and decision-making procedures', 2, (select id from serhub_sections where number = '1'), 4);

-- Level 2 sections under Chapter 2
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('2.1', 'QA Policy Compliance', 'Compliance with national and institutional quality assurance requirements', 2, (select id from serhub_sections where number = '2'), 1),
('2.2', 'Stakeholder Participation', 'Involvement of stakeholders in quality assurance processes', 2, (select id from serhub_sections where number = '2'), 2),
('2.3', 'Action Plan', 'Strategic action plan for quality improvement', 2, (select id from serhub_sections where number = '2'), 3),
('2.4', 'Stakeholder Involvement', 'Mechanisms for ongoing stakeholder engagement', 2, (select id from serhub_sections where number = '2'), 4),
('2.5', 'Report Accessibility', 'Public availability and transparency of quality reports', 2, (select id from serhub_sections where number = '2'), 5),
('2.6', 'Previous Recommendations', 'Response to recommendations from previous evaluations', 2, (select id from serhub_sections where number = '2'), 6),
('2.7', 'Lessons Learned', 'Insights and lessons from quality assurance activities', 2, (select id from serhub_sections where number = '2'), 7),
('2.8', 'Strengths and Challenges', 'Analysis of institutional strengths and areas for improvement', 2, (select id from serhub_sections where number = '2'), 8),
('2.9', 'Section Summary', 'Summary of internal quality assurance chapter', 2, (select id from serhub_sections where number = '2'), 9);

-- Level 2 sections under Chapter 3
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.1', 'Study Programs', 'Overview and analysis of academic programs', 2, (select id from serhub_sections where number = '3'), 1),
('3.2', 'Teaching and Learning Outcomes', 'Assessment of teaching quality and student learning outcomes', 2, (select id from serhub_sections where number = '3'), 2),
('3.3', 'Students', 'Student population, admissions, support services, and outcomes', 2, (select id from serhub_sections where number = '3'), 3),
('3.4', 'Academic Faculty and Human Resources', 'Faculty composition, qualifications, and development', 2, (select id from serhub_sections where number = '3'), 4),
('3.5', 'Diversity', 'Diversity and inclusion policies and practices', 2, (select id from serhub_sections where number = '3'), 5),
('3.6', 'Research', 'Research activities, output, and impact', 2, (select id from serhub_sections where number = '3'), 6),
('3.7', 'Infrastructure', 'Physical and technological infrastructure', 2, (select id from serhub_sections where number = '3'), 7),
('3.8', 'Ultra-Orthodox Study Program', 'Special track for ultra-orthodox students (if applicable)', 2, (select id from serhub_sections where number = '3'), 8);

-- Level 3 sections under 3.1 Study Programs
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.1.1', 'The Study Program/s', 'Detailed description of degree programs and curricula', 3, (select id from serhub_sections where number = '3.1'), 1),
('3.1.2', 'Training and Fieldwork', 'Practical training, internships, and fieldwork requirements', 3, (select id from serhub_sections where number = '3.1'), 2),
('3.1.3', 'Community Engagement', 'Community service and social responsibility activities', 3, (select id from serhub_sections where number = '3.1'), 3),
('3.1.4', 'Internationalization', 'International partnerships, exchange programs, and global engagement', 3, (select id from serhub_sections where number = '3.1'), 4),
('3.1.5', 'Section Summary', 'Summary of study programs section', 3, (select id from serhub_sections where number = '3.1'), 5);

-- Level 3 sections under 3.2 Teaching and Learning
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.2.1', 'Teaching', 'Teaching methods, pedagogical approaches, and innovation', 3, (select id from serhub_sections where number = '3.2'), 1),
('3.2.2', 'Learning Outcomes', 'Definition and assessment of intended learning outcomes', 3, (select id from serhub_sections where number = '3.2'), 2),
('3.2.3', 'Section Summary', 'Summary of teaching and learning outcomes section', 3, (select id from serhub_sections where number = '3.2'), 3);

-- Level 3 sections under 3.3 Students
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.3.1', 'Admission and Graduation', 'Admission criteria, processes, and graduation rates', 3, (select id from serhub_sections where number = '3.3'), 1),
('3.3.2', 'Graduate Studies', 'Master''s and doctoral programs (if applicable)', 3, (select id from serhub_sections where number = '3.3'), 2),
('3.3.3', 'Student Support Services', 'Academic advising, counseling, and student services', 3, (select id from serhub_sections where number = '3.3'), 3),
('3.3.4', 'Alumni', 'Alumni relations, tracking, and outcomes', 3, (select id from serhub_sections where number = '3.3'), 4),
('3.3.5', 'Section Summary', 'Summary of students section', 3, (select id from serhub_sections where number = '3.3'), 5);

-- Level 3 sections under 3.4 Academic Faculty
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.4.1', 'Policy', 'Faculty recruitment, retention, and promotion policies', 3, (select id from serhub_sections where number = '3.4'), 1),
('3.4.2', 'Department Chair and Committees', 'Leadership structure and committee organization', 3, (select id from serhub_sections where number = '3.4'), 2),
('3.4.3', 'Academic Faculty', 'Faculty profiles, qualifications, and expertise', 3, (select id from serhub_sections where number = '3.4'), 3),
('3.4.4', 'Professional Development', 'Faculty development programs and opportunities', 3, (select id from serhub_sections where number = '3.4'), 4),
('3.4.5', 'Technical and Administrative Staff', 'Support staff composition and roles', 3, (select id from serhub_sections where number = '3.4'), 5),
('3.4.6', 'Section Summary', 'Summary of academic faculty section', 3, (select id from serhub_sections where number = '3.4'), 6);

-- Level 3 sections under 3.7 Infrastructure
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.7.1', 'Physical Infrastructure', 'Buildings, classrooms, laboratories, and facilities', 3, (select id from serhub_sections where number = '3.7'), 1),
('3.7.2', 'Libraries and Databases', 'Library resources, digital collections, and research databases', 3, (select id from serhub_sections where number = '3.7'), 2),
('3.7.3', 'Section Summary', 'Summary of infrastructure section', 3, (select id from serhub_sections where number = '3.7'), 3);

-- Level 3 sections under 3.8 Ultra-Orthodox Program
insert into serhub_sections (number, title, description, level, parent_id, sort_order) values
('3.8.1', 'Overview', 'Introduction to the ultra-orthodox study track', 3, (select id from serhub_sections where number = '3.8'), 1),
('3.8.2', 'The Study Program', 'Curriculum adaptations and special requirements', 3, (select id from serhub_sections where number = '3.8'), 2),
('3.8.3', 'Faculty', 'Teaching staff for the ultra-orthodox track', 3, (select id from serhub_sections where number = '3.8'), 3),
('3.8.4', 'Students', 'Student population and characteristics', 3, (select id from serhub_sections where number = '3.8'), 4),
('3.8.5', 'Infrastructure', 'Dedicated facilities and resources', 3, (select id from serhub_sections where number = '3.8'), 5);
