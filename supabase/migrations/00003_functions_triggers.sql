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
