-- SERHUB Gantt Groups Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- GROUPS TABLE (3-level hierarchy for project phases)
-- ============================================
create table if not exists serhub_groups (
  id uuid primary key default gen_random_uuid(),

  -- Hierarchy
  number text not null,
  title text not null,
  description text,
  parent_id uuid references serhub_groups(id) on delete cascade,
  level integer not null check (level in (1, 2, 3)),
  sort_order integer not null default 0,

  -- Level 1 groups are fixed (cannot be deleted)
  is_fixed boolean not null default false,

  -- Optional owner
  owner_id uuid references serhub_profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_serhub_groups_parent on serhub_groups(parent_id);
create index if not exists idx_serhub_groups_level on serhub_groups(level);
create index if not exists idx_serhub_groups_sort_order on serhub_groups(sort_order);

-- ============================================
-- GROUP TASKS LINKING TABLE (groups link to existing tasks)
-- ============================================
create table if not exists serhub_group_tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references serhub_groups(id) on delete cascade,
  task_id uuid not null references serhub_tasks(id) on delete cascade,
  created_at timestamptz not null default now(),

  unique(group_id, task_id)
);

-- Indexes
create index if not exists idx_serhub_group_tasks_group on serhub_group_tasks(group_id);
create index if not exists idx_serhub_group_tasks_task on serhub_group_tasks(task_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
alter table serhub_groups enable row level security;
alter table serhub_group_tasks enable row level security;

-- ============================================
-- GROUPS POLICIES
-- ============================================

-- All authenticated users can read groups
create policy "groups_select_all"
  on serhub_groups for select
  to authenticated
  using (true);

-- Only admins can insert groups
create policy "groups_insert_admin"
  on serhub_groups for insert
  to authenticated
  with check (serhub_is_admin());

-- Only admins can update groups
create policy "groups_update_admin"
  on serhub_groups for update
  to authenticated
  using (serhub_is_admin())
  with check (serhub_is_admin());

-- Only admins can delete non-fixed groups
create policy "groups_delete_admin"
  on serhub_groups for delete
  to authenticated
  using (serhub_is_admin() and is_fixed = false);

-- ============================================
-- GROUP TASKS POLICIES
-- ============================================

-- All authenticated users can read
create policy "group_tasks_select_all"
  on serhub_group_tasks for select
  to authenticated
  using (true);

-- Only admins can insert
create policy "group_tasks_insert_admin"
  on serhub_group_tasks for insert
  to authenticated
  with check (serhub_is_admin());

-- Only admins can delete
create policy "group_tasks_delete_admin"
  on serhub_group_tasks for delete
  to authenticated
  using (serhub_is_admin());

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger for groups
create trigger serhub_groups_updated_at
  before update on serhub_groups
  for each row execute function serhub_update_updated_at();

-- Audit log trigger for groups
create trigger serhub_groups_audit
  after insert or update or delete on serhub_groups
  for each row execute function serhub_log_audit();

-- ============================================
-- SEED DATA - 5 FIXED LEVEL 1 GROUPS
-- ============================================
insert into serhub_groups (number, title, description, level, sort_order, is_fixed) values
  ('1', 'Creating project Infrastructure', 'Setting up tools, protocols, and systems for the project', 1, 1, true),
  ('2', 'Data collection', 'Gathering data from school, faculty, and HIT levels', 1, 2, true),
  ('3', 'Data processing', 'Translating, building components, and formatting data', 1, 3, true),
  ('4', 'Writing the report', 'Drafting the self-evaluation report', 1, 4, true),
  ('5', 'Reviewing the report', 'Final review and quality assurance', 1, 5, true)
on conflict do nothing;

-- ============================================
-- DONE
-- ============================================
