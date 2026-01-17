-- SERHUB Organizational Modules Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- ORGANIZATIONAL TASKS TABLE
-- ============================================
create table if not exists serhub_org_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner_id uuid not null references serhub_profiles(id),
  supervisor_id uuid references serhub_profiles(id),
  status integer not null default 0 check (status >= 0 and status <= 100),
  blocked boolean not null default false,
  blocked_reason text,
  start_date date not null,
  due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_serhub_org_tasks_owner on serhub_org_tasks(owner_id);
create index if not exists idx_serhub_org_tasks_due_date on serhub_org_tasks(due_date);
create index if not exists idx_serhub_org_tasks_status on serhub_org_tasks(status);

-- ============================================
-- ORG TASK → REPORT TASK LINKS (many-to-many)
-- ============================================
create table if not exists serhub_org_task_links (
  id uuid primary key default gen_random_uuid(),
  org_task_id uuid not null references serhub_org_tasks(id) on delete cascade,
  report_task_id uuid not null references serhub_tasks(id) on delete cascade,
  created_at timestamptz not null default now(),

  unique(org_task_id, report_task_id)
);

-- Indexes
create index if not exists idx_serhub_org_task_links_org on serhub_org_task_links(org_task_id);
create index if not exists idx_serhub_org_task_links_report on serhub_org_task_links(report_task_id);

-- ============================================
-- ORG TASK COLLABORATORS (many-to-many)
-- ============================================
create table if not exists serhub_org_task_collaborators (
  id uuid primary key default gen_random_uuid(),
  org_task_id uuid not null references serhub_org_tasks(id) on delete cascade,
  user_id uuid not null references serhub_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  unique(org_task_id, user_id)
);

-- Index
create index if not exists idx_serhub_org_task_collaborators_user on serhub_org_task_collaborators(user_id);

-- ============================================
-- MODIFY MEETINGS TABLE
-- Add level, agenda, notes, action_items, location
-- ============================================

-- Add new columns to existing meetings table
alter table serhub_meetings
  add column if not exists level text check (level in ('team', 'faculty', 'institute')),
  add column if not exists location text,
  add column if not exists agenda text[] default '{}',
  add column if not exists notes text,
  add column if not exists action_items text[] default '{}';

-- Update meeting_type check constraint to include new types
-- First drop the old constraint, then add new one
alter table serhub_meetings drop constraint if exists serhub_meetings_meeting_type_check;
alter table serhub_meetings add constraint serhub_meetings_meeting_type_check
  check (meeting_type in ('project_meeting', 'review_meeting', 'recurring_meeting', 'status_meeting', 'other'));

-- ============================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================

-- Enable RLS
alter table serhub_org_tasks enable row level security;
alter table serhub_org_task_links enable row level security;
alter table serhub_org_task_collaborators enable row level security;

-- ============================================
-- ORG TASKS POLICIES
-- ============================================

-- All authenticated users can read org tasks
create policy "org_tasks_select_all"
  on serhub_org_tasks for select
  to authenticated
  using (true);

-- Coordinators and admins can insert org tasks
create policy "org_tasks_insert_coordinator"
  on serhub_org_tasks for insert
  to authenticated
  with check (serhub_is_coordinator_or_admin());

-- Users can update org tasks if they are owner, collaborator, supervisor, coordinator, or admin
create policy "org_tasks_update_involved"
  on serhub_org_tasks for update
  to authenticated
  using (
    owner_id = auth.uid()
    or supervisor_id = auth.uid()
    or exists (
      select 1 from serhub_org_task_collaborators
      where org_task_id = serhub_org_tasks.id and user_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  )
  with check (
    owner_id = auth.uid()
    or supervisor_id = auth.uid()
    or exists (
      select 1 from serhub_org_task_collaborators
      where org_task_id = serhub_org_tasks.id and user_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- Only coordinators and admins can delete org tasks
create policy "org_tasks_delete_coordinator"
  on serhub_org_tasks for delete
  to authenticated
  using (serhub_is_coordinator_or_admin());

-- ============================================
-- ORG TASK LINKS POLICIES
-- ============================================

-- All authenticated users can read
create policy "org_task_links_select_all"
  on serhub_org_task_links for select
  to authenticated
  using (true);

-- Org task owner, coordinators, and admins can insert
create policy "org_task_links_insert"
  on serhub_org_task_links for insert
  to authenticated
  with check (
    exists (
      select 1 from serhub_org_tasks
      where id = org_task_id and owner_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- Org task owner, coordinators, and admins can delete
create policy "org_task_links_delete"
  on serhub_org_task_links for delete
  to authenticated
  using (
    exists (
      select 1 from serhub_org_tasks
      where id = org_task_id and owner_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- ============================================
-- ORG TASK COLLABORATORS POLICIES
-- ============================================

-- All authenticated users can read
create policy "org_task_collaborators_select_all"
  on serhub_org_task_collaborators for select
  to authenticated
  using (true);

-- Org task owner, coordinators, and admins can insert
create policy "org_task_collaborators_insert"
  on serhub_org_task_collaborators for insert
  to authenticated
  with check (
    exists (
      select 1 from serhub_org_tasks
      where id = org_task_id and owner_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- Org task owner, coordinators, and admins can delete
create policy "org_task_collaborators_delete"
  on serhub_org_task_collaborators for delete
  to authenticated
  using (
    exists (
      select 1 from serhub_org_tasks
      where id = org_task_id and owner_id = auth.uid()
    )
    or serhub_is_coordinator_or_admin()
  );

-- ============================================
-- TRIGGERS FOR ORG TASKS
-- ============================================

-- Updated_at trigger
create trigger serhub_org_tasks_updated_at
  before update on serhub_org_tasks
  for each row execute function serhub_update_updated_at();

-- Audit log trigger
create trigger serhub_org_tasks_audit
  after insert or update or delete on serhub_org_tasks
  for each row execute function serhub_log_audit();

-- ============================================
-- DONE
-- ============================================
