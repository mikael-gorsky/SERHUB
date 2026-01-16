-- SERHUB Development Seed Data
-- Run this after creating users via Supabase Auth

-- ============================================
-- IMPORTANT: First create users in Supabase Auth Dashboard or via API:
-- 1. MikaelG@hit.ac.il (Mikael Gorsky) - admin
-- 2. giladsh@hit.ac.il (Gilad Shamir) - member
-- 3. hilitk@hit.ac.il (Hilit Krugman) - member
-- 4. ilevin@hit.ac.il (Ilya Levin) - coordinator
--
-- Then update the UUIDs below with the actual auth.users IDs
-- ============================================

-- Placeholder UUIDs (REPLACE WITH ACTUAL IDs after creating users)
-- These will be replaced once actual users are created
do $$
declare
  mikael_id uuid;
  gilad_id uuid;
  hilit_id uuid;
  ilya_id uuid;

  section_0 uuid;
  section_1_1 uuid;
  section_1_2 uuid;
  section_2_1 uuid;
  section_2_6 uuid;
  section_3_1_1 uuid;
  section_3_1_4 uuid;
  section_3_2_1 uuid;
  section_3_3_1 uuid;
  section_3_4_3 uuid;

  task1_id uuid;
  task2_id uuid;
  task3_id uuid;
  task4_id uuid;
  task5_id uuid;
  task6_id uuid;
  task7_id uuid;
  task8_id uuid;
  task9_id uuid;
  task10_id uuid;

  meeting1_id uuid;
  meeting2_id uuid;
  meeting3_id uuid;
begin
  -- Get user IDs (will fail if users don't exist yet)
  select id into mikael_id from auth.users where email = 'MikaelG@hit.ac.il';
  select id into gilad_id from auth.users where email = 'giladsh@hit.ac.il';
  select id into hilit_id from auth.users where email = 'hilitk@hit.ac.il';
  select id into ilya_id from auth.users where email = 'ilevin@hit.ac.il';

  -- If users exist, update their profiles
  if mikael_id is not null then
    update serhub_profiles set
      first_name = 'Mikael',
      last_name = 'Gorsky',
      title = 'Dr.',
      organization_role = 'department_faculty',
      system_role = 'admin'
    where id = mikael_id;
  end if;

  if gilad_id is not null then
    update serhub_profiles set
      first_name = 'Gilad',
      last_name = 'Shamir',
      organization_role = 'department_faculty',
      system_role = 'member'
    where id = gilad_id;
  end if;

  if hilit_id is not null then
    update serhub_profiles set
      first_name = 'Hilit',
      last_name = 'Krugman',
      organization_role = 'administrative_staff',
      system_role = 'member'
    where id = hilit_id;
  end if;

  if ilya_id is not null then
    update serhub_profiles set
      first_name = 'Ilya',
      last_name = 'Levin',
      title = 'Prof.',
      organization_role = 'parent_unit',
      system_role = 'coordinator'
    where id = ilya_id;
  end if;

  -- Get section IDs
  select id into section_0 from serhub_sections where number = '0';
  select id into section_1_1 from serhub_sections where number = '1.1';
  select id into section_1_2 from serhub_sections where number = '1.2';
  select id into section_2_1 from serhub_sections where number = '2.1';
  select id into section_2_6 from serhub_sections where number = '2.6';
  select id into section_3_1_1 from serhub_sections where number = '3.1.1';
  select id into section_3_1_4 from serhub_sections where number = '3.1.4';
  select id into section_3_2_1 from serhub_sections where number = '3.2.1';
  select id into section_3_3_1 from serhub_sections where number = '3.3.1';
  select id into section_3_4_3 from serhub_sections where number = '3.4.3';

  -- Only create sample data if main user exists
  if mikael_id is not null then
    -- ============================================
    -- SAMPLE TASKS
    -- ============================================

    -- Task 1: Executive Summary draft (complete)
    insert into serhub_tasks (id, title, description, section_id, owner_id, reviewer_id, status, start_date, due_date)
    values (gen_random_uuid(), 'Draft executive summary outline', 'Create initial structure and key points for the executive summary', section_0, mikael_id, ilya_id, 100, '2026-01-01', '2026-01-15')
    returning id into task1_id;

    -- Task 2: Institution summary (in progress)
    insert into serhub_tasks (id, title, description, section_id, owner_id, reviewer_id, status, start_date, due_date)
    values (gen_random_uuid(), 'Compile institution history and facts', 'Gather historical data, enrollment figures, and key institutional milestones', section_1_1, mikael_id, ilya_id, 65, '2026-01-10', '2026-01-25')
    returning id into task2_id;

    -- Task 3: Mission statement review (approaching deadline)
    insert into serhub_tasks (id, title, description, section_id, owner_id, reviewer_id, status, start_date, due_date)
    values (gen_random_uuid(), 'Review and update mission statement', 'Ensure mission statement reflects current strategic direction', section_1_2, mikael_id, ilya_id, 40, '2026-01-12', '2026-01-20')
    returning id into task3_id;

    -- Task 4: QA compliance documentation (blocked)
    insert into serhub_tasks (id, title, description, section_id, owner_id, reviewer_id, status, blocked, blocked_reason, start_date, due_date)
    values (gen_random_uuid(), 'Document QA compliance procedures', 'Detail all quality assurance procedures and their compliance status', section_2_1, mikael_id, ilya_id, 25, true, 'Waiting for updated QA guidelines from CHE', '2026-01-05', '2026-01-30')
    returning id into task4_id;

    -- Task 5: Previous recommendations response
    insert into serhub_tasks (id, title, description, section_id, owner_id, reviewer_id, status, start_date, due_date)
    values (gen_random_uuid(), 'Address previous evaluation recommendations', 'Document responses and actions taken for each prior recommendation', section_2_6, mikael_id, ilya_id, 50, '2026-01-08', '2026-02-01')
    returning id into task5_id;

    -- Task 6: Study program description
    insert into serhub_tasks (id, title, description, section_id, owner_id, reviewer_id, status, start_date, due_date)
    values (gen_random_uuid(), 'Describe degree program structure', 'Detail curriculum, credit requirements, and program objectives', section_3_1_1, mikael_id, ilya_id, 30, '2026-01-15', '2026-02-10')
    returning id into task6_id;

    -- Task 7: Internationalization (not started)
    insert into serhub_tasks (id, title, description, section_id, owner_id, reviewer_id, status, start_date, due_date)
    values (gen_random_uuid(), 'Document international partnerships', 'List all international agreements, exchange programs, and collaborations', section_3_1_4, mikael_id, ilya_id, 0, '2026-01-20', '2026-02-15')
    returning id into task7_id;

    -- Task 8: Teaching methods documentation
    insert into serhub_tasks (id, title, description, section_id, owner_id, reviewer_id, status, start_date, due_date)
    values (gen_random_uuid(), 'Describe teaching methodologies', 'Document pedagogical approaches, innovative teaching methods, and technology use', section_3_2_1, mikael_id, ilya_id, 20, '2026-01-18', '2026-02-08')
    returning id into task8_id;

    -- Task 9: Admission data compilation
    insert into serhub_tasks (id, title, description, section_id, owner_id, reviewer_id, status, start_date, due_date)
    values (gen_random_uuid(), 'Compile admission and graduation statistics', 'Gather 5-year data on admissions, retention, and graduation rates', section_3_3_1, mikael_id, ilya_id, 75, '2026-01-02', '2026-01-22')
    returning id into task9_id;

    -- Task 10: Faculty profiles
    insert into serhub_tasks (id, title, description, section_id, owner_id, reviewer_id, status, start_date, due_date)
    values (gen_random_uuid(), 'Update faculty CVs and profiles', 'Collect updated CVs and compile faculty qualification summary', section_3_4_3, mikael_id, ilya_id, 45, '2026-01-10', '2026-02-05')
    returning id into task10_id;

    -- ============================================
    -- TASK COLLABORATORS
    -- ============================================
    if gilad_id is not null then
      insert into serhub_task_collaborators (task_id, user_id) values
        (task2_id, gilad_id),
        (task5_id, gilad_id),
        (task6_id, gilad_id),
        (task9_id, gilad_id);
    end if;

    if hilit_id is not null then
      insert into serhub_task_collaborators (task_id, user_id) values
        (task3_id, hilit_id),
        (task4_id, hilit_id),
        (task8_id, hilit_id),
        (task10_id, hilit_id);
    end if;

    -- ============================================
    -- TASK DEPENDENCIES
    -- ============================================
    -- Executive summary depends on several other tasks being complete
    insert into serhub_task_dependencies (task_id, depends_on_task_id) values
      (task1_id, task2_id),  -- Summary needs institution data
      (task1_id, task6_id);  -- Summary needs program description

    -- ============================================
    -- SAMPLE MEETINGS
    -- ============================================

    -- Weekly project meeting (recurring)
    insert into serhub_meetings (id, title, description, meeting_type, start_time, end_time, recurrence_rule, created_by)
    values (
      gen_random_uuid(),
      'SER Weekly Progress Meeting',
      'Weekly sync to review progress and address blockers',
      'recurring_meeting',
      '2026-01-20 10:00:00+02',
      '2026-01-20 11:00:00+02',
      'FREQ=WEEKLY;BYDAY=MO',
      mikael_id
    ) returning id into meeting1_id;

    -- Chapter 3 review meeting
    insert into serhub_meetings (id, title, description, meeting_type, start_time, end_time, created_by)
    values (
      gen_random_uuid(),
      'Chapter 3 Draft Review',
      'Review first draft of Chapter 3 sections with all contributors',
      'review_meeting',
      '2026-02-05 14:00:00+02',
      '2026-02-05 16:00:00+02',
      mikael_id
    ) returning id into meeting2_id;

    -- QA discussion meeting
    insert into serhub_meetings (id, title, description, meeting_type, start_time, end_time, created_by)
    values (
      gen_random_uuid(),
      'QA Section Planning',
      'Discuss QA documentation approach and resolve blockers',
      'project_meeting',
      '2026-01-22 11:00:00+02',
      '2026-01-22 12:00:00+02',
      mikael_id
    ) returning id into meeting3_id;

    -- ============================================
    -- MEETING PARTICIPANTS
    -- ============================================
    insert into serhub_meeting_participants (meeting_id, user_id) values
      (meeting1_id, mikael_id);

    if gilad_id is not null then
      insert into serhub_meeting_participants (meeting_id, user_id) values
        (meeting1_id, gilad_id),
        (meeting2_id, gilad_id);
    end if;

    if hilit_id is not null then
      insert into serhub_meeting_participants (meeting_id, user_id) values
        (meeting1_id, hilit_id),
        (meeting2_id, hilit_id),
        (meeting3_id, hilit_id);
    end if;

    if ilya_id is not null then
      insert into serhub_meeting_participants (meeting_id, user_id) values
        (meeting1_id, ilya_id),
        (meeting2_id, ilya_id);
    end if;

    -- ============================================
    -- NOTIFICATION PREFERENCES
    -- ============================================
    insert into serhub_notification_preferences (user_id, digest_frequency) values
      (mikael_id, 'daily');

    if gilad_id is not null then
      insert into serhub_notification_preferences (user_id, digest_frequency) values (gilad_id, 'daily');
    end if;

    if hilit_id is not null then
      insert into serhub_notification_preferences (user_id, digest_frequency) values (hilit_id, 'twice_daily');
    end if;

    if ilya_id is not null then
      insert into serhub_notification_preferences (user_id, digest_frequency) values (ilya_id, 'daily');
    end if;

  end if;

  raise notice 'Seed data created successfully';
end $$;
