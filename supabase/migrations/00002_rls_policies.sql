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
