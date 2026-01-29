-- Add Level 2 and Level 3 sub-groups to existing Level 1 groups
-- Run this after the initial migration

-- Get Level 1 group IDs
DO $$
DECLARE
  v_phase1_id uuid;
  v_phase2_id uuid;
  v_phase3_id uuid;
  v_phase4_id uuid;
  v_phase5_id uuid;
  v_subgroup_id uuid;
BEGIN
  -- Get Level 1 group IDs
  SELECT id INTO v_phase1_id FROM serhub_groups WHERE number = '1' AND level = 1;
  SELECT id INTO v_phase2_id FROM serhub_groups WHERE number = '2' AND level = 1;
  SELECT id INTO v_phase3_id FROM serhub_groups WHERE number = '3' AND level = 1;
  SELECT id INTO v_phase4_id FROM serhub_groups WHERE number = '4' AND level = 1;
  SELECT id INTO v_phase5_id FROM serhub_groups WHERE number = '5' AND level = 1;

  -- ============================================
  -- 1. Creating project Infrastructure
  -- ============================================

  -- 1.1 File storage protocol
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('1.1', 'File storage protocol', v_phase1_id, 2, 1, false);

  -- 1.2 Task management system
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('1.2', 'Task management system', v_phase1_id, 2, 2, false);

  -- 1.3 Reporting protocol
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('1.3', 'Reporting protocol', v_phase1_id, 2, 3, false);

  -- 1.4 Establishing schedule of regular status meetings
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('1.4', 'Establishing schedule of regular status meetings', v_phase1_id, 2, 4, false)
  RETURNING id INTO v_subgroup_id;

  -- 1.4.1 School team
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('1.4.1', 'School team', v_subgroup_id, 3, 1, false);

  -- 1.4.2 HIT team (SCS + SID)
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('1.4.2', 'HIT team (SCS + SID)', v_subgroup_id, 3, 2, false);

  -- ============================================
  -- 2. Data collection
  -- ============================================

  -- 2.1 School level data
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('2.1', 'School level data', v_phase2_id, 2, 1, false)
  RETURNING id INTO v_subgroup_id;

  -- 2.1.1 CVs
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('2.1.1', 'CVs', v_subgroup_id, 3, 1, false);

  -- 2.1.2 Syllabi
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('2.1.2', 'Syllabi', v_subgroup_id, 3, 2, false);

  -- 2.2 Faculty level data
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('2.2', 'Faculty level data', v_phase2_id, 2, 2, false);

  -- 2.3 HIT level data
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('2.3', 'HIT level data', v_phase2_id, 2, 3, false)
  RETURNING id INTO v_subgroup_id;

  -- 2.3.1 Student enrollment
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('2.3.1', 'Student enrollment', v_subgroup_id, 3, 1, false);

  -- 2.3.2 Student support
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('2.3.2', 'Student support', v_subgroup_id, 3, 2, false);

  -- 2.3.3 Physical infrastructure
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('2.3.3', 'Physical infrastructure', v_subgroup_id, 3, 3, false);

  -- ============================================
  -- 3. Data processing
  -- ============================================

  -- 3.1 Document translation
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('3.1', 'Document translation', v_phase3_id, 2, 1, false);

  -- 3.2 Building components of report based on collected data
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('3.2', 'Building components of report based on collected data', v_phase3_id, 2, 2, false);

  -- 3.3 Filling tables
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('3.3', 'Filling tables', v_phase3_id, 2, 3, false);

  -- 3.4 Converting collected data to requested formats
  INSERT INTO serhub_groups (number, title, parent_id, level, sort_order, is_fixed)
  VALUES ('3.4', 'Converting collected data to requested formats', v_phase3_id, 2, 4, false);

  -- ============================================
  -- 4. Writing the report - No sub-groups
  -- 5. Reviewing the report - No sub-groups
  -- ============================================

  RAISE NOTICE 'All sub-groups created successfully!';
END $$;
