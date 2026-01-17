-- SERHUB Complete Task Import
-- Run this ENTIRE script in Supabase SQL Editor
-- Creates: 4 auth users + profiles, 1 section (Guide), 192 tasks, ~384 collaborator relationships

-- ============================================================
-- STEP 1: Create auth users and profiles
-- ============================================================

-- Create auth users first (profiles are linked via FK to auth.users)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'MikaelG@hit.ac.il',
  crypt('TempPass123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Mikael", "last_name": "Gorsky"}',
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'MikaelG@hit.ac.il');

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'IlyaL@hit.ac.il',
  crypt('TempPass123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Ilya", "last_name": "Levin"}',
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'IlyaL@hit.ac.il');

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'GiladS@hit.ac.il',
  crypt('TempPass123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Gilad", "last_name": "Shamir"}',
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'GiladS@hit.ac.il');

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'HilitK@hit.ac.il',
  crypt('TempPass123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Hilit", "last_name": "Krugman"}',
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'HilitK@hit.ac.il');

-- Now create profiles linked to auth users
INSERT INTO serhub_profiles (id, email, first_name, last_name, title, organization_role, system_role, is_active)
SELECT id, 'MikaelG@hit.ac.il', 'Mikael', 'Gorsky', 'Dr.', 'department_faculty', 'admin', true
FROM auth.users WHERE email = 'MikaelG@hit.ac.il'
AND NOT EXISTS (SELECT 1 FROM serhub_profiles WHERE email = 'MikaelG@hit.ac.il');

INSERT INTO serhub_profiles (id, email, first_name, last_name, title, organization_role, system_role, is_active)
SELECT id, 'IlyaL@hit.ac.il', 'Ilya', 'Levin', 'Prof.', 'department_faculty', 'coordinator', true
FROM auth.users WHERE email = 'IlyaL@hit.ac.il'
AND NOT EXISTS (SELECT 1 FROM serhub_profiles WHERE email = 'IlyaL@hit.ac.il');

INSERT INTO serhub_profiles (id, email, first_name, last_name, title, organization_role, system_role, is_active)
SELECT id, 'GiladS@hit.ac.il', 'Gilad', 'Shamir', NULL, 'department_faculty', 'member', true
FROM auth.users WHERE email = 'GiladS@hit.ac.il'
AND NOT EXISTS (SELECT 1 FROM serhub_profiles WHERE email = 'GiladS@hit.ac.il');

INSERT INTO serhub_profiles (id, email, first_name, last_name, title, organization_role, system_role, is_active)
SELECT id, 'HilitK@hit.ac.il', 'Hilit', 'Krugman', NULL, 'administrative_staff', 'member', true
FROM auth.users WHERE email = 'HilitK@hit.ac.il'
AND NOT EXISTS (SELECT 1 FROM serhub_profiles WHERE email = 'HilitK@hit.ac.il');

-- ============================================================
-- STEP 2: Create the "Guide" section for additional materials
-- ============================================================

INSERT INTO serhub_sections (id, number, title, description, level, sort_order)
SELECT gen_random_uuid(), 'Guide', 'Additional Required Materials', 'Syllabi, CVs, approval letters, and submission organization', 1, 9000
WHERE NOT EXISTS (SELECT 1 FROM serhub_sections WHERE number = 'Guide');

-- ============================================================
-- STEP 3: Create helper functions for batch import
-- ============================================================

CREATE OR REPLACE FUNCTION serhub_batch_import_task(
  p_section_number TEXT,
  p_title TEXT,
  p_description TEXT
) RETURNS UUID AS $$
DECLARE
  v_task_id UUID;
  v_section_id UUID;
  v_owner_id UUID;
  v_supervisor_id UUID;
BEGIN
  SELECT id INTO v_section_id FROM serhub_sections WHERE number = p_section_number;
  IF v_section_id IS NULL THEN
    RAISE NOTICE 'Section % not found, skipping task: %', p_section_number, p_title;
    RETURN NULL;
  END IF;

  SELECT id INTO v_owner_id FROM serhub_profiles WHERE email = 'MikaelG@hit.ac.il';
  SELECT id INTO v_supervisor_id FROM serhub_profiles WHERE email = 'IlyaL@hit.ac.il';

  IF v_supervisor_id IS NULL THEN v_supervisor_id := v_owner_id; END IF;

  INSERT INTO serhub_tasks (id, title, description, section_id, owner_id, supervisor_id, status, blocked, start_date, due_date)
  VALUES (gen_random_uuid(), p_title, p_description, v_section_id, v_owner_id, v_supervisor_id, 0, false, '2026-01-01', '2026-04-01')
  RETURNING id INTO v_task_id;

  -- Add collaborators
  INSERT INTO serhub_task_collaborators (id, task_id, user_id)
  SELECT gen_random_uuid(), v_task_id, p.id
  FROM serhub_profiles p
  WHERE p.email IN ('GiladS@hit.ac.il', 'HilitK@hit.ac.il');

  RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 4: Import all 192 tasks
-- ============================================================

DO $$
BEGIN

-- Executive Summary (Section 0)
PERFORM serhub_batch_import_task('0', 'Summarize main strengths identified during self-evaluation', 'Write a summary of the main strengths identified during the self-evaluation process across all sections of the report.');
PERFORM serhub_batch_import_task('0', 'Summarize main weaknesses and challenges identified', 'Write a summary of the main weaknesses and challenges identified during the self-evaluation process across all sections of the report.');
PERFORM serhub_batch_import_task('0', 'Describe planned improvement actions', 'Write a short description of the actions that the institution, the parent unit, and the department will take to improve the weaknesses and tackle the challenges that were found.');
PERFORM serhub_batch_import_task('0', 'Summarize mission and learning outcomes achievement', 'Write a summary of how the study program has achieved its mission, goals, and learning outcomes. Assess whether the results comply with the mission statement.');

-- Section 1: The institution and the parent unit
PERFORM serhub_batch_import_task('1.1', 'Write institution summary and development history', 'Write a summary describing the institution and its development since its establishment. Include the date of recognition by the Council for Higher Education and details of the campus/es where the institution''s teaching activities take place (number and location).');
PERFORM serhub_batch_import_task('1.2', 'Document institution mission statement, aims, and goals', 'Document the mission statement, aims, and goals of the institution.');
PERFORM serhub_batch_import_task('1.3', 'Document parent unit mission statement, aims, and goals', 'Document the name of the parent unit, its mission statement, aims, and goals.');
PERFORM serhub_batch_import_task('1.4', 'Describe parent unit decision-making process', 'Describe the decision-making process for developing and updating the parent unit''s mission, aims, and goals. Explain how they are reviewed and monitored.');
PERFORM serhub_batch_import_task('1', 'Create institution organizational structure chart', 'Create a chart of the institution''s organizational structure including the names of senior academic and administrative position holders.');
PERFORM serhub_batch_import_task('1', 'Complete Table 1 - Institution students and faculty', 'Complete Table 1 in Excel appendix showing number of students and faculty members in the Institution.');
PERFORM serhub_batch_import_task('1', 'List parent unit committees and composition', 'List the committees operating within the parent unit and their composition, including representatives of which departments/bodies are members.');
PERFORM serhub_batch_import_task('1', 'Create parent unit organizational structure chart', 'Create a chart of the parent unit''s academic and administrative organizational structure including relevant committees, names of senior academic and administrative position holders, and a list of departments/study programs operating within its framework.');
PERFORM serhub_batch_import_task('1', 'Complete Table 2 - Parent unit students and faculty', 'Complete Table 2 in Excel appendix showing number of students and faculty members in the Parent Unit.');

-- Section 2: Internal quality assurance
PERFORM serhub_batch_import_task('2.1', 'Assess QA policy compliance', 'Assess and rate (1-5 scale) to what extent the current self-evaluation process was conducted according to the institutional QA policy. Provide short explanation.');
PERFORM serhub_batch_import_task('2.2', 'Assess stakeholder participation in self-evaluation', 'Assess and rate (1-5 scale) the participation level of each stakeholder group in the current self-evaluation process: Institution''s management, Parent unit, Department faculty, Adjunct faculty, Students, Administrative staff, and Other. Provide short explanation.');
PERFORM serhub_batch_import_task('2.3', 'Document action plan status', 'Answer whether a concrete action plan was set in place to address the challenges highlighted by the self-evaluation process (Yes/No).');
PERFORM serhub_batch_import_task('2.4', 'Assess stakeholder involvement in action plan', 'If action plan exists, assess and rate (1-5 scale) the involvement of Institution, Parent unit, Department, and Other stakeholders in supporting the action plan. Provide short explanation.');
PERFORM serhub_batch_import_task('2.5', 'Document report accessibility', 'Document whether the full Self-Evaluation Report is accessible, to whom it is accessible, and to what extent.');
PERFORM serhub_batch_import_task('2.6', 'Assess previous recommendations implementation', 'If the department underwent a QA review by the CHE or an internal QA review in the past, assess and rate (1-5 scale) to what extent the previous recommendations were implemented. Provide short explanation.');
PERFORM serhub_batch_import_task('2.7', 'Document lessons learned from past QA processes', 'Describe what the department has learned from past quality assurance processes and how this has shaped current practice.');
PERFORM serhub_batch_import_task('2.8', 'Write QA strengths, weaknesses, and action plan', 'List strengths, weaknesses, and challenges of the Self-Evaluation process, and describe the concrete action plan to address challenges found in the QA process. Up to 500 words.');
PERFORM serhub_batch_import_task('2.9', 'Provide overall QA section rating', 'Provide overall rating (1-5 scale) for the Internal Quality Assurance section performance.');
PERFORM serhub_batch_import_task('2', 'Provide institutional QA policy document', 'Provide the institutional Quality Assurance policy document including processes, data collection, and responsible bodies.');
PERFORM serhub_batch_import_task('2', 'Document previous evaluation recommendations and implementation', 'If the unit was evaluated in the past by CHE or by an internal QA review, provide description of the previous evaluation committee recommendations, their implementation, and the follow-up process.');

-- Section 3.1.1: Study programs
PERFORM serhub_batch_import_task('3.1.1', 'Write department history and development summary', 'Write the department''s name, study program/s, and a summary describing its development since its establishment. Up to 1000 words.');
PERFORM serhub_batch_import_task('3.1.1', 'Document department mission statement, aims, and goals', 'Describe the mission statement, aims, and goals of the department and the study programs.');
PERFORM serhub_batch_import_task('3.1.1', 'Assess mission contribution to performance', 'Assess and rate (1-5 scale) to what extent the department''s mission, aims, and goals contribute to the department''s performance and advancement. Provide short explanation.');
PERFORM serhub_batch_import_task('3.1.1', 'Assess program alignment with mission', 'For each program/degree level, assess and rate (1-5 scale) to what extent the Content, Structure, and Scope reflect the mission and goals of the study program. Provide short explanation.');
PERFORM serhub_batch_import_task('3.1.1', 'Assess decision-making processes for study programs', 'Assess and rate (1-5 scale) the departmental decision-making processes regarding study programs: correlation between outlined process and implementation, whether process is structured, transparent, meets department''s needs, and frequency of program review. Provide short explanation.');
PERFORM serhub_batch_import_task('3.1.1', 'Describe decision-making process and stakeholder roles', 'Describe the decision-making process, revision, monitoring, and the roles of the stakeholders involved in the process.');
PERFORM serhub_batch_import_task('3.1.1', 'Document program changes in last five years', 'Specify any fundamental changes in the study program/s during the last five years.');
PERFORM serhub_batch_import_task('3.1.1', 'Describe five-year strategic plan', 'Describe the five-year strategic plan of the department and its study programs.');
PERFORM serhub_batch_import_task('3.1.1', 'Create department organizational structure chart', 'Create a chart of the department''s academic and administrative organizational structure including relevant committees and names of senior position holders.');
PERFORM serhub_batch_import_task('3.1.1', 'Create program flow chart', 'Create a flow chart of the program presenting the program from 1st year to graduation. The chart should show the "program at a glance" at all degree levels.');
PERFORM serhub_batch_import_task('3.1.1', 'Complete Table 3 - The Study Program', 'Complete Table 3 in Excel appendix showing study program details for the last year of report.');

-- Section 3.1.2: Training and fieldwork
PERFORM serhub_batch_import_task('3.1.2', 'Describe training and fieldwork requirements', 'Describe the training/fieldwork/internship required in the program/s, including its content and scope. Up to 500 words.');
PERFORM serhub_batch_import_task('3.1.2', 'Describe placement process procedure', 'Describe the placement process procedure. Up to 500 words.');
PERFORM serhub_batch_import_task('3.1.2', 'List courses with practical training component', 'If the department offers specific courses with a practical training component, list and briefly describe the courses.');
PERFORM serhub_batch_import_task('3.1.2', 'Assess practical training components', 'Assess and rate (1-5 scale) the practical training components: scope of training, process/mechanisms/criteria for selecting training places, guidance/follow-up process, and methods applied to evaluate student performance. Provide short explanation.');
PERFORM serhub_batch_import_task('3.1.2', 'Document student support challenges and solutions', 'Describe what challenges the department has faced in supporting students and how these were addressed.');
PERFORM serhub_batch_import_task('3.1.2', 'Document student feedback leading to change', 'Describe what feedback from students in recent years has led to meaningful change.');
PERFORM serhub_batch_import_task('3.1.2', 'Create list of training places', 'Create a list of places of training including the number of students in each.');

-- Section 3.1.3: Community engagement
PERFORM serhub_batch_import_task('3.1.3', 'Describe community engagement activities', 'Describe the department''s activities and engagement with the community, including its content and scope. Up to 500 words.');
PERFORM serhub_batch_import_task('3.1.3', 'Describe community engagement impact measurement', 'Describe the methods and mechanisms to measure the impact of community engagement for the students and the community.');
PERFORM serhub_batch_import_task('3.1.3', 'Assess community engagement components', 'Assess and rate (1-5 scale) the community engagement components: relevance to study program, scope of community engagement, involvement of students, involvement of faculty and staff, and measurable impact. Provide short explanation.');

-- Section 3.1.4: Internationalization
PERFORM serhub_batch_import_task('3.1.4', 'Describe international policy and features', 'Describe the international policy and features of the study program/s. Up to 600 words.');
PERFORM serhub_batch_import_task('3.1.4', 'Assess international policy implementation', 'Assess and rate (1-5 scale) the international policy and features: implementation of institutional vision and strategy, connection with institutional international office, international research cooperation, and international teaching cooperation. Provide short explanation.');
PERFORM serhub_batch_import_task('3.1.4', 'Document language of instruction policy', 'Document the institutional/departmental policy regarding the language of instruction.');
PERFORM serhub_batch_import_task('3.1.4', 'Assess international support mechanisms', 'Assess and rate (1-5 scale) the existence and operation of supporting mechanisms: quality assurance of international courses, support mechanism for faculty to teach in English, mechanism/system for credit transfer, support for international faculty, and support for international students. Provide short explanation.');
PERFORM serhub_batch_import_task('3.1.4', 'Document institutional internationalization strategy', 'Provide the institutional vision and strategy for Internationalization. Up to 600 words.');
PERFORM serhub_batch_import_task('3.1.4', 'Document number of EMI courses', 'Document the number of English-Medium Instruction (EMI) courses.');
PERFORM serhub_batch_import_task('3.1.4', 'Complete Table 4 - Inbound and outbound students', 'Complete Table 4 in Excel appendix showing inbound and outbound students for the last 3 years.');

-- Section 3.1.5: Study programs summary
PERFORM serhub_batch_import_task('3.1.5', 'Write study program strengths, weaknesses, and strategy', 'List strengths, weaknesses, and challenges of the study program, and describe the strategy for development and improvement of the study program. Up to 500 words.');
PERFORM serhub_batch_import_task('3.1.5', 'Provide overall study program section rating', 'Provide overall rating (1-5 scale) for the department and study program section performance.');

-- Section 3.2.1: Teaching
PERFORM serhub_batch_import_task('3.2.1', 'Describe teaching excellence evaluation methods', 'Describe how the department evaluates, improves, and enhances teaching excellence.');
PERFORM serhub_batch_import_task('3.2.1', 'Define teaching excellence', 'Describe how the department defines and promotes teaching excellence.');
PERFORM serhub_batch_import_task('3.2.1', 'Describe Teaching and Learning Center services', 'Describe the services and activities the Teaching and Learning Center provides to faculty.');
PERFORM serhub_batch_import_task('3.2.1', 'Document pedagogical changes in last five years', 'Describe what pedagogical changes have emerged in the department over the last five years and what prompted them.');
PERFORM serhub_batch_import_task('3.2.1', 'Assess Teaching and Learning Center support', 'Assess and rate (1-5 scale) the services and support provided by the Teaching and Learning Center: training new faculty, training current faculty, techno-pedagogical support, and other. Provide short explanation.');
PERFORM serhub_batch_import_task('3.2.1', 'Assess teaching regulations', 'Assess and rate (1-5 scale) the current teaching regulations: whether they are transparent, implemented and acted upon, periodically reviewed and updated. Provide short explanation.');
PERFORM serhub_batch_import_task('3.2.1', 'Assess teaching quality evaluation methods', 'Assess and rate (1-5 scale) the effectiveness of methods to evaluate quality teaching: peer review, teaching surveys, self-assessment, review by department chair, and other. Provide short explanation.');
PERFORM serhub_batch_import_task('3.2.1', 'Provide teaching regulations document', 'Provide the teaching regulations document.');
PERFORM serhub_batch_import_task('3.2.1', 'Provide Teaching and Learning Center policy', 'Provide the Teaching and Learning Center policy document.');
PERFORM serhub_batch_import_task('3.2.1', 'Provide student survey format', 'Provide the format of student surveys in English.');

-- Section 3.2.2: Learning outcomes
PERFORM serhub_batch_import_task('3.2.2', 'Document intended learning outcomes', 'Document the Intended Learning Outcomes (ILOs) for a graduate. Address each track and each degree level separately.');
PERFORM serhub_batch_import_task('3.2.2', 'Document ILO review process', 'Document how frequently the ILOs are reviewed and by whom.');
PERFORM serhub_batch_import_task('3.2.2', 'Document AI training and support', 'Describe whether the university is training and supporting its students, faculty, and staff in the effective and responsible use of AI.');
PERFORM serhub_batch_import_task('3.2.2', 'Assess AI skills preparation for graduates', 'Describe whether the university is adequately preparing its graduates for the expectations of employers in terms of AI skills.');
PERFORM serhub_batch_import_task('3.2.2', 'Document generative AI implications', 'Describe whether and how the department addresses the implications of generative AI (e.g., ChatGPT, Copilot) on teaching, assignments, academic integrity, and student learning.');
PERFORM serhub_batch_import_task('3.2.2', 'Document AI use guidelines', 'Document whether the department has discussed or issued any guidelines on acceptable AI use in coursework or in instructional design. If yes, attach or summarize them.');
PERFORM serhub_batch_import_task('3.2.2', 'Document faculty AI training opportunities', 'Describe whether faculty members are offered training or professional development on pedagogical uses of digital tools and AI.');
PERFORM serhub_batch_import_task('3.2.2', 'Assess ILO implementation', 'Assess and rate (1-5 scale) the ILOs for a graduate: whether they are reviewed and updated periodically, known and published to faculty, known and published to students, and correlate with content and courses being taught. Provide short explanation.');
PERFORM serhub_batch_import_task('3.2.2', 'Assess student evaluation methods', 'Assess and rate (1-5 scale) to what extent the student evaluation methods (exams, assignments, final projects etc.) are appropriate to content, evaluating students'' performance, and fit and demonstrate the program''s aims and goals. Provide short explanation.');
PERFORM serhub_batch_import_task('3.2.2', 'Create grade distribution histogram', 'Create a histogram showing distribution of the final grades of the evaluated department over the last three years in all degree levels.');

-- Section 3.2.3: Teaching and learning outcomes summary
PERFORM serhub_batch_import_task('3.2.3', 'Write teaching and learning outcomes strengths and strategy', 'List strengths, weaknesses, and challenges of teaching and learning outcomes, and describe the strategy for development and improvement. 300-500 words.');
PERFORM serhub_batch_import_task('3.2.3', 'Provide overall teaching and learning section rating', 'Provide overall rating (1-5 scale) for the Teaching and Learning Outcomes section performance.');

-- Section 3.3.1: Admission and graduation
PERFORM serhub_batch_import_task('3.3.1', 'Describe admission and completion requirements process', 'Describe the process of setting the admission requirements/criteria, requirements/criteria for advancement, and completion of the degree. Up to 500 words.');
PERFORM serhub_batch_import_task('3.3.1', 'Assess admission criteria', 'Assess and rate (1-5 scale) the admission criteria for all degree levels and study tracks: whether they enable admission of suitable candidates, department involvement in setting criteria, flexibility in criteria, and periodic review. Provide short explanation.');
PERFORM serhub_batch_import_task('3.3.1', 'Write admission and graduation strengths and strategy', 'List strengths, weaknesses, and challenges of admission and graduation, and describe the strategy for development and improvement. Up to 500 words.');
PERFORM serhub_batch_import_task('3.3.1', 'Create entry requirements table', 'Create a table showing entry requirements/criteria for the program for all degree levels including "on probation" status, criteria for advancement from year to year, and criteria for completion of the degree.');
PERFORM serhub_batch_import_task('3.3.1', 'Create admission scores histogram', 'Create a histogram showing the range of psychometric test scores (or equivalent) and the range of matriculation averages of students admitted to the program in the last five years.');
PERFORM serhub_batch_import_task('3.3.1', 'Complete Table 5 - Student registration', 'Complete Table 5 in Excel appendix showing student registration data.');
PERFORM serhub_batch_import_task('3.3.1', 'Complete Table 6 - Student dropout rate', 'Complete Table 6 in Excel appendix showing student dropout rate.');

-- Section 3.3.2: Graduate studies
PERFORM serhub_batch_import_task('3.3.2', 'Describe graduate supervision policy', 'Describe the institutional/faculty/departmental policy regarding supervising graduate students including who can supervise, limit on the number of students, and follow-up mechanisms.');
PERFORM serhub_batch_import_task('3.3.2', 'Assess graduate program structure and monitoring', 'Assess and rate (1-5 scale) to what extent the graduate programs (MA/MSc and Ph.D.) are structured and include mechanisms to monitor students'' progress. Rate separately for MA/MSc structure, PhD structure, MA/MSc monitoring mechanisms, and PhD monitoring mechanisms. Provide short explanation.');
PERFORM serhub_batch_import_task('3.3.2', 'Document degree completion time correlation', 'Document the correlation between the official and de facto period for degree completion.');
PERFORM serhub_batch_import_task('3.3.2', 'Write graduate studies strengths and strategy', 'List strengths, weaknesses, and challenges of graduate studies and describe the strategy for development and improvement. Up to 500 words.');
PERFORM serhub_batch_import_task('3.3.2', 'List research skills courses', 'Create a list of mandatory/elective courses that provide and teach research/soft skills with a brief description of the acquired skills.');
PERFORM serhub_batch_import_task('3.3.2', 'List graduate financial support', 'Create a list of financial support/fellowships for graduate students.');

-- Section 3.3.3: Student support services
PERFORM serhub_batch_import_task('3.3.3', 'Describe academic counseling system', 'Describe how the academic counseling system operates. Up to 500 words.');
PERFORM serhub_batch_import_task('3.3.3', 'Assess student support services', 'Assess and rate (1-5 scale) whether the following student support services meet the needs of the student population: academic counseling, financial support, students with special needs, job placement, support for international students, and other. Provide short explanation.');
PERFORM serhub_batch_import_task('3.3.3', 'Assess student complaint mechanism', 'Assess and rate (1-5 scale) the institutional mechanism to address student complaints: whether it is accessible, clear and transparent, and protects students'' rights. Provide short explanation.');
PERFORM serhub_batch_import_task('3.3.3', 'Assess alignment with student feedback', 'Assess and rate (1-5 scale) to what extent the department''s ranking of support mechanisms aligns with feedback received from students through student surveys, student union, etc. Provide short explanation.');
PERFORM serhub_batch_import_task('3.3.3', 'Document student feedback leading to change', 'Describe what feedback from students in recent years has led to meaningful change.');
PERFORM serhub_batch_import_task('3.3.3', 'Write student support strengths and strategy', 'List strengths, weaknesses, and challenges of student support services and describe the strategy for development and improvement. 300-500 words.');
PERFORM serhub_batch_import_task('3.3.3', 'List financial aid available to students', 'Create a list of financial aid available to students including scholarships for outstanding students.');
PERFORM serhub_batch_import_task('3.3.3', 'Describe job placement services', 'Provide a description of the job placement services and success rates in job placement.');
PERFORM serhub_batch_import_task('3.3.3', 'Provide student complaints policy', 'Provide the institutional policy regarding student complaints.');

-- Section 3.3.4: Alumni
PERFORM serhub_batch_import_task('3.3.4', 'Assess alumni data collection', 'Assess and rate (1-5 scale) to what extent the department regularly and systematically collects data regarding its alumni. Provide short explanation.');
PERFORM serhub_batch_import_task('3.3.4', 'Assess performance review based on alumni data', 'Assess and rate (1-5 scale) to what extent the department reviews its performance and its mission and goals based on the data collected and adjusts them if necessary. Provide short explanation.');
PERFORM serhub_batch_import_task('3.3.4', 'Describe alumni engagement', 'Describe how the department engages alumni as an active part of its academic community.');
PERFORM serhub_batch_import_task('3.3.4', 'Describe alumni relationship maintenance', 'Describe how the department maintains relationships with alumni beyond employment tracking, e.g., through mentoring, guest lectures, advisory roles.');
PERFORM serhub_batch_import_task('3.3.4', 'Document alumni feedback on curriculum', 'Describe how alumni feedback informs curricular revisions or digital skill development, including AI literacy where relevant.');
PERFORM serhub_batch_import_task('3.3.4', 'Write alumni strengths and strategy', 'List strengths, weaknesses, and challenges regarding alumni and describe the strategy for development and improvement of alumni engagement. Up to 500 words.');
PERFORM serhub_batch_import_task('3.3.4', 'Create alumni labor market integration table', 'Create a table/chart showing integration of alumni (up to 7 years from graduation) into the labor market: where they have found employment, what positions they hold, and how much time has elapsed between graduation and employment.');
PERFORM serhub_batch_import_task('3.3.4', 'Create advanced studies continuation table', 'Create a table/chart showing the number of students that continue their studies to advanced degrees, specifying the area of study and degree level.');
PERFORM serhub_batch_import_task('3.3.4', 'Create licensing examination pass rate table', 'Create a table/chart showing the percentage of graduates who pass the national licensing examination (if relevant).');

-- Section 3.3.5: Students section summary
PERFORM serhub_batch_import_task('3.3.5', 'Provide overall students section rating', 'Provide overall rating (1-5 scale) for the Students section performance.');

-- Section 3.4.1: Faculty policy
PERFORM serhub_batch_import_task('3.4.1', 'Describe faculty recruitment and promotion process', 'Describe the departmental process for recruitment and promotion of faculty. Up to 500 words.');
PERFORM serhub_batch_import_task('3.4.1', 'Assess institutional recruitment and promotion transparency', 'Assess and rate (1-5 scale) whether the institutional policy procedure for recruitment and promotion is transparent and accessible to all faculty members. Rate separately for recruitment and promotion. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.1', 'Assess policy implementation correlation', 'Assess and rate (1-5 scale) whether there is a correlation between the institutional recruitment and promotion policy and its implementation. Rate separately for recruitment and promotion. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.1', 'Assess policy appropriateness to academic culture', 'Assess and rate (1-5 scale) whether the institutional recruitment and promotion policy is appropriate to the academic culture of the study field. Rate separately for recruitment and promotion. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.1', 'Assess departmental processes contribution', 'Assess and rate (1-5 scale) whether the departmental processes for faculty recruitment and promotion contribute to the development and evolution of the department. Rate separately for recruitment and promotion. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.1', 'Assess departmental process clarity', 'Assess and rate (1-5 scale) whether the departmental process for faculty recruitment and promotion is structured, clear, and transparent to all faculty members. Rate separately for recruitment and promotion. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.1', 'Write policy strengths and strategy', 'List strengths, weaknesses, and challenges of recruitment and promotion policies and describe the strategy for development and improvement. Up to 500 words.');
PERFORM serhub_batch_import_task('3.4.1', 'Provide institutional recruitment and promotion policy', 'Provide the institutional policy for recruitment and promotion of faculty.');
PERFORM serhub_batch_import_task('3.4.1', 'Provide recent recruitment and promotion examples', 'Provide examples of the procedure carried out in recent (5 years) recruitment and promotion cases.');

-- Section 3.4.2: Department chair and committees
PERFORM serhub_batch_import_task('3.4.2', 'Describe department chair appointment policy', 'Describe the policy and procedure for the appointment of department chair. Up to 500 words.');
PERFORM serhub_batch_import_task('3.4.2', 'Review chair appointment details', 'Review the Chair''s appointment duration, re-appointment procedure, prerequisites, and managerial authority.');
PERFORM serhub_batch_import_task('3.4.2', 'Assess chair appointment criteria', 'Assess and rate (1-5 scale) whether the prerequisites, rules, and criteria for the appointment of the department chair are appropriate, clear, and transparent. Rate separately for prerequisites, rules and criteria, and transparency. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.2', 'Assess chair managerial authority', 'Assess and rate (1-5 scale) whether the managerial independence, power, and duration of the position of the Chair are sufficient. Rate separately for managerial independence, managerial power and authority, and duration. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.2', 'Assess departmental committees', 'Assess and rate (1-5 scale) to what extent the departmental committees have: clear appointment policy, clear operational mandate, are efficient, representative, and transparent. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.2', 'Write management and administration strengths and strategy', 'List strengths, weaknesses, and challenges of the department''s management and administration, and describe the strategy for development and improvement. Up to 500 words.');
PERFORM serhub_batch_import_task('3.4.2', 'Document departmental committees and mandates', 'Document the departmental committees and the scope of their mandate regarding decision-making and procedural governance.');
PERFORM serhub_batch_import_task('3.4.2', 'Provide committee appointment policy', 'Provide the policy/process for committee appointments.');

-- Section 3.4.3: Academic faculty
PERFORM serhub_batch_import_task('3.4.3', 'Assess faculty size adequacy', 'Assess and rate (1-5 scale) to what extent the current faculty size is adequate to the department''s needs for teaching and research. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.3', 'Assess faculty coverage of subfields', 'Assess and rate (1-5 scale) to what extent the current faculty provides appropriate coverage of the subfields within the subject matter for teaching and research. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.3', 'Assess research-teaching correlation', 'Assess and rate (1-5 scale) the correlation between faculty''s research field and their teaching. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.3', 'Write faculty strengths and strategy', 'List strengths, weaknesses, and challenges regarding the department''s faculty and describe the strategy for development and improvement. 300-500 words.');
PERFORM serhub_batch_import_task('3.4.3', 'Complete Tables 7-12 - Faculty employment data', 'Complete Tables 7-12 in Excel appendix showing faculty employment, tenured, non-tenured, adjunct faculty, recruits, and retirements.');
PERFORM serhub_batch_import_task('3.4.3', 'Create faculty sub-field specialization table', 'Create a table of faculty according to sub-field specialization.');

-- Section 3.4.4: Professional and pedagogical development
PERFORM serhub_batch_import_task('3.4.4', 'Describe professional development activities', 'Describe the department''s professional development activities and opportunities for the last three years.');
PERFORM serhub_batch_import_task('3.4.4', 'Describe pedagogical training activities', 'Describe the department''s pedagogical training and development activities and opportunities.');
PERFORM serhub_batch_import_task('3.4.4', 'Assess professional development adequacy', 'Assess and rate (1-5 scale) whether the departmental opportunities for professional development are adequate in terms of activities, frequency, and impact. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.4', 'Assess pedagogical development adequacy', 'Assess and rate (1-5 scale) whether the departmental program/opportunities for pedagogical training and development are adequate in terms of activities, frequency, and impact. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.4', 'Write professional development strengths and strategy', 'List strengths, weaknesses, and challenges of professional and pedagogical development of faculty, and describe the strategy for development and improvement. Up to 500 words.');

-- Section 3.4.5: Technical and administrative staff
PERFORM serhub_batch_import_task('3.4.5', 'Assess technical staff adequacy', 'Assess and rate (1-5 scale) whether the department''s technical staff is appropriate to the department''s needs for IT, lab technicians, and other. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.5', 'Assess administrative staff adequacy', 'Assess and rate (1-5 scale) whether the department''s administrative staff is appropriate to the department''s needs and size. Provide short explanation.');
PERFORM serhub_batch_import_task('3.4.5', 'Write technical and administrative staff strengths and strategy', 'List strengths, weaknesses, and challenges regarding technical and administrative staff and describe the strategy for development and improvement. 300-500 words.');
PERFORM serhub_batch_import_task('3.4.5', 'Create technical staff table', 'Create a table of technical staff including name, position, and responsibilities.');
PERFORM serhub_batch_import_task('3.4.5', 'Create administrative staff table', 'Create a table of administrative staff including name, role, and responsibilities.');

-- Section 3.4.6: Academic faculty and human resources summary
PERFORM serhub_batch_import_task('3.4.6', 'Provide overall faculty and HR section rating', 'Provide overall rating (1-5 scale) for the Academic Faculty and Human Resources section performance.');

-- Section 3.5: Diversity
PERFORM serhub_batch_import_task('3.5', 'Describe diversity initiatives', 'Describe the main initiatives/actions by the department to enhance diversity.');
PERFORM serhub_batch_import_task('3.5', 'Describe gender equality policy', 'Describe the main principles of the institutional/departmental gender equality policy.');
PERFORM serhub_batch_import_task('3.5', 'Document diversity progress and lessons learned', 'Describe in what ways the department has made progress on diversity and inclusion, and what are key lessons learned.');
PERFORM serhub_batch_import_task('3.5', 'Assess gender diversity policy fulfillment', 'Assess and rate (1-5 scale) to what extent the department acts to fulfill the existing policy and goals set for gender diversity for academic faculty, administrative faculty, and students. Provide short explanation.');
PERFORM serhub_batch_import_task('3.5', 'Describe minority diversity policy', 'Describe the main principles of the institutional/departmental minority, equality, or diversity policy.');
PERFORM serhub_batch_import_task('3.5', 'Assess minority diversity policy fulfillment', 'Assess and rate (1-5 scale) to what extent the department acts to fulfill the existing policy and goals set for minority diversity for academic faculty, administrative faculty, and students. Provide short explanation.');
PERFORM serhub_batch_import_task('3.5', 'Write diversity strengths and strategy', 'List strengths, weaknesses, and challenges of diversity in the department, and describe the strategy for development and improvement. Up to 500 words.');
PERFORM serhub_batch_import_task('3.5', 'Provide overall diversity section rating', 'Provide overall rating (1-5 scale) for the Diversity section performance.');
PERFORM serhub_batch_import_task('3.5', 'Provide diversity policy document', 'Provide the institutional/departmental policy on diversity.');
PERFORM serhub_batch_import_task('3.5', 'Provide special needs students policy', 'Provide the institutional/faculty/departmental policy regarding students with special needs.');
PERFORM serhub_batch_import_task('3.5', 'Complete Table 13 - Gender equality', 'Complete Table 13 in Excel appendix showing gender equality data.');
PERFORM serhub_batch_import_task('3.5', 'Complete Table 14 - Equality of minorities', 'Complete Table 14 in Excel appendix showing equality of minorities data.');

-- Section 3.6: Research
PERFORM serhub_batch_import_task('3.6', 'Write research activities overview', 'Provide an overview of the department''s research activities including: prominent research fields and activities, past and present research impact and most significant research contributions, development plans, and possible challenges and opportunities. Up to 1000 words.');
PERFORM serhub_batch_import_task('3.6', 'Assess research alignment with institutional mission', 'Assess and rate (1-5 scale) to what extent the department''s research activities correspond with the institution''s overall mission and goals. Provide short explanation.');
PERFORM serhub_batch_import_task('3.6', 'Assess research evaluation methods', 'Assess and rate (1-5 scale) to what extent the department''s methods and tools used for evaluating faculty research are in line with the practices in the field. Provide short explanation.');
PERFORM serhub_batch_import_task('3.6', 'Document research contributions', 'Describe what research contributions the department is most proud of and what has enabled them.');
PERFORM serhub_batch_import_task('3.6', 'Write research strengths and strategy', 'List strengths, weaknesses, and challenges of research in the department, and describe the strategy for development and improvement. Up to 500 words.');
PERFORM serhub_batch_import_task('3.6', 'Provide overall research section rating', 'Provide overall rating (1-5 scale) for the Research section performance.');
PERFORM serhub_batch_import_task('3.6', 'Complete Table 15 - Research resources', 'Complete Table 15 in Excel appendix showing research resources.');
PERFORM serhub_batch_import_task('3.6', 'Complete Table 16 - Research activities', 'Complete Table 16 in Excel appendix showing research activities.');
PERFORM serhub_batch_import_task('3.6', 'List research cooperation activities', 'Create a list of research cooperation activities by department members both in Israel and abroad for the last five years.');
PERFORM serhub_batch_import_task('3.6', 'Document research infrastructure', 'List the research infrastructure of the faculty: research laboratories, research centers, specialized equipment, and budget for maintenance including level and sources of funding.');
PERFORM serhub_batch_import_task('3.6', 'Provide journal ranking information', 'Provide the journal ranking used by the department when evaluating faculty publications or list of journals used.');
PERFORM serhub_batch_import_task('3.6', 'Provide institutional IP policy', 'Provide the institutional IP policy.');

-- Section 3.7.1: Physical infrastructure
PERFORM serhub_batch_import_task('3.7.1', 'Assess faculty office space', 'Assess and rate (1-5 scale) whether the physical infrastructure for faculty office space is appropriate and meets the department''s needs in terms of location, quantity, and quality. Provide short explanation.');
PERFORM serhub_batch_import_task('3.7.1', 'Assess administrative staff office space', 'Assess and rate (1-5 scale) whether the physical infrastructure for administrative staff office space is appropriate and meets the department''s needs in terms of location, quantity, and quality. Provide short explanation.');
PERFORM serhub_batch_import_task('3.7.1', 'Assess study classes infrastructure', 'Assess and rate (1-5 scale) whether the existing infrastructure for study classes meets the department''s teaching/instruction needs in terms of location, quantity, quality, and technological infrastructure. Provide short explanation.');
PERFORM serhub_batch_import_task('3.7.1', 'Assess teaching labs infrastructure', 'Assess and rate (1-5 scale) whether the existing teaching labs infrastructure meets the department''s needs in terms of quantity, number of student seats, quality of equipment, maintenance, and other factors. Provide short explanation. (If relevant)');
PERFORM serhub_batch_import_task('3.7.1', 'Assess computer classes infrastructure', 'Assess and rate (1-5 scale) whether the existing computer classes infrastructure meets the department''s needs in terms of location, number of student seats, accessibility/opening hours, maintenance, remote teaching and learning infrastructure, and other factors. Provide short explanation.');
PERFORM serhub_batch_import_task('3.7.1', 'Assess specialized infrastructure', 'Assess and rate (1-5 scale) whether the existing specialized/field-specific infrastructure meets the department''s needs in terms of quantity, number of student seats, quality of equipment, maintenance, and other factors. Provide short explanation.');
PERFORM serhub_batch_import_task('3.7.1', 'Describe AI tools infrastructure support', 'Describe whether the existing infrastructure supports the responsible integration of AI tools for teaching, learning, and research.');

-- Section 3.7.2: Libraries and databases
PERFORM serhub_batch_import_task('3.7.2', 'Describe library resources', 'Describe the libraries used by the department, its collection, infrastructure, and services. Up to 300 words.');
PERFORM serhub_batch_import_task('3.7.2', 'Assess library teaching and learning support', 'Assess and rate (1-5 scale) whether the library enables and assists the teaching and learning process in terms of location, opening hours, variety of titles in subject field, number of titles in subject field, and study spaces. Provide short explanation.');
PERFORM serhub_batch_import_task('3.7.2', 'Assess academic database access', 'Assess and rate (1-5 scale) whether access to academic databases meets the department''s needs in terms of technological infrastructure, range and relevance of available academic databases, and other factors. Provide short explanation.');

-- Section 3.7.3: Infrastructure summary
PERFORM serhub_batch_import_task('3.7.3', 'Write infrastructure strengths and strategy', 'List strengths, weaknesses, and challenges of infrastructure, and describe the strategy for development and improvement. Up to 500 words.');
PERFORM serhub_batch_import_task('3.7.3', 'Provide overall infrastructure section rating', 'Provide overall rating (1-5 scale) for the Infrastructure section performance.');
PERFORM serhub_batch_import_task('3.7.3', 'Provide campus map', 'Provide a campus/es map with indication of the department''s location/s.');
PERFORM serhub_batch_import_task('3.7.3', 'List teaching laboratories', 'Create a list of the teaching laboratories that serve the department including users, equipment, and number of seats.');
PERFORM serhub_batch_import_task('3.7.3', 'List databases', 'Create a list of databases available to the department.');
PERFORM serhub_batch_import_task('3.7.3', 'List special equipment and infrastructure', 'Create a list of special equipment, additional infrastructure, and other relevant materials.');

-- Section 3.8: Ultra-orthodox study program
PERFORM serhub_batch_import_task('3.8.1', 'Write ultra-orthodox program summary', 'Write a summary describing the study program: name, date of accreditation and opening, the campus/es where the study program takes place, and the connection between the ultra-orthodox and the regular program. Up to 1000 words.');
PERFORM serhub_batch_import_task('3.8.1', 'Describe program modifications for ultra-orthodox population', 'Describe the modifications made in the regular program to adapt it to the Ultra-Orthodox population (e.g., preparatory pre-academic program, faculty, location, tutoring, training for faculty, etc.). Specify the challenges of ensuring that the programs correspond.');
PERFORM serhub_batch_import_task('3.8.1', 'Document ultra-orthodox program strengths and weaknesses', 'Document the strengths and weaknesses of the program and what actions are planned and taken to address them.');
PERFORM serhub_batch_import_task('3.8.2', 'Specify program structure differences', 'Specify the differences (if exist) in the structure and content of the study program compared to the regular program including number of semesters, courses/credits required, offered elective courses, different parent unit or supervision, etc.');
PERFORM serhub_batch_import_task('3.8.2', 'Describe rationale for differences', 'Describe the rationale for the differences and the mechanisms to ensure the study programs correspond.');
PERFORM serhub_batch_import_task('3.8.2', 'Describe student achievement evaluation methods', 'Describe the methods for evaluating the achievements of students in the study program. Document the differences from the regular program (if any exists) and the reasons for it.');
PERFORM serhub_batch_import_task('3.8.2', 'Describe final project and practical training', 'Describe the final project and/or practical training requirements, guidance, and evaluation. Address the differences (if any exist) from the regular program.');
PERFORM serhub_batch_import_task('3.8.3', 'Document faculty differences and constraints', 'Document whether the faculty in the ultra-orthodox program is different from that in the regular program. Indicate any constraints related to choosing the teaching staff in the program (gender, sector, academic degrees, etc.) and their implications.');
PERFORM serhub_batch_import_task('3.8.4', 'Describe pre-academic preparatory programs', 'Describe the pre-academic preparatory study programs for the ultra-orthodox program. Address the admission and graduation regulations and the curriculum.');
PERFORM serhub_batch_import_task('3.8.4', 'Assess student support services similarity', 'Assess and rate (1-5 scale) to what extent the student support services given in the ultra-orthodox program are similar to the services given in the regular program for academic, personal, financial, job placement, and other support. Provide short explanation.');
PERFORM serhub_batch_import_task('3.8.4', 'Document dropout reasons and measures', 'Specify the reasons for dropout and measures taken to address it.');
PERFORM serhub_batch_import_task('3.8.4', 'Describe alumni contact maintenance', 'Describe how the institution and/or the department maintains contact with alumni.');
PERFORM serhub_batch_import_task('3.8.5', 'Describe ultra-orthodox program infrastructure', 'Describe the overall physical infrastructure that serves the study program including classrooms, computerization, offices, laboratories, libraries, etc.');
PERFORM serhub_batch_import_task('3.8.5', 'Document physical separation challenges', 'Indicate the challenges caused by the physical separation from the main campus.');
PERFORM serhub_batch_import_task('3.8.5', 'Create ultra-orthodox program staff list', 'Create a list of the program''s academic and administrative staff including position, name, and title.');
PERFORM serhub_batch_import_task('3.8.5', 'Complete ultra-orthodox student registration data', 'Complete student registration data based on Excel Appendix Table 5 format for ultra-orthodox program.');
PERFORM serhub_batch_import_task('3.8.5', 'Complete ultra-orthodox student dropout data', 'Complete student dropout rate data based on Excel Appendix Table 6 format for ultra-orthodox program.');
PERFORM serhub_batch_import_task('3.8.5', 'Create ultra-orthodox grade distribution histogram', 'Create a histogram showing distribution of the final grades of students in the ultra-orthodox study program over the last three years, compared with those of students in the regular program.');
PERFORM serhub_batch_import_task('3.8.5', 'Create ultra-orthodox alumni labor market integration table', 'Create a table/chart showing integration of alumni (up to 7 years from graduation) into the labor market including workplace, position, and relation to study field.');
PERFORM serhub_batch_import_task('3.8.5', 'Create ultra-orthodox advanced studies continuation table', 'Create a table/chart showing the number of students that continue their studies to advanced degrees including field of study and degree level.');

-- Additional Required Materials (Guide section)
PERFORM serhub_batch_import_task('Guide', 'Prepare all syllabi in uniform format', 'Prepare detailed syllabi in a uniform format for all courses taught in the academic year during which the quality assessment is taking place. Each syllabus must include: title, name of lecturer, year offered, one- or two-semester, year of program, how often given, number of hours/credits, prerequisites, mandatory or elective, goals/learning outcomes, course description/summary, week-by-week content assignments and readings, assessment method and grade composition, and bibliography. All syllabi must be in English.');
PERFORM serhub_batch_import_task('Guide', 'Prepare all faculty CVs in uniform format', 'Prepare updated curricula vitae of all faculty members in a uniform format. Each CV must include: education, academic and other positions, awards and fellowships, research areas, and list of publications. All CVs must be in English.');
PERFORM serhub_batch_import_task('Guide', 'Obtain rector/president approval letter', 'Obtain approval of the self-evaluation report from the president/rector in an attached cover letter.');
PERFORM serhub_batch_import_task('Guide', 'Organize submission folders', 'Organize all materials for digital submission according to the required folder structure: Institution__Syllabi_dd_mm_yyyy, Institution__CV_dd_mm_yyyy, Institution__Extras_dd_mm_yyyy, and Institution__Evaluation Report_dd_mm_yyyy. Ensure all files are PDF format (except Excel tables), no larger than 20MB, and named to represent their content.');

END $$;

-- ============================================================
-- STEP 5: Cleanup helper function
-- ============================================================

DROP FUNCTION IF EXISTS serhub_batch_import_task(TEXT, TEXT, TEXT);

-- ============================================================
-- STEP 6: Display import summary
-- ============================================================

SELECT 'IMPORT COMPLETE' as status,
       (SELECT count(*) FROM serhub_profiles) as total_profiles,
       (SELECT count(*) FROM serhub_sections) as total_sections,
       (SELECT count(*) FROM serhub_tasks) as total_tasks,
       (SELECT count(*) FROM serhub_task_collaborators) as total_collaborator_links;
