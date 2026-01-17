/**
 * SERHUB Task Import Script
 * Imports tasks from markdown file into serhub_tasks and serhub_task_collaborators tables
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Supabase configuration
const supabaseUrl = 'https://lxfwhygolfmfrsgtcckc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4ZndoeWdvbGZtZnJzZ3RjY2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Njc4MjksImV4cCI6MjA4MzU0MzgyOX0.UX8KlthYc9j9AXnavs-LVe3kfraFyjBpUHgbJLgjwsA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Global metadata from the markdown
const METADATA = {
  owner: 'Mikael Gorsky',
  ownerEmail: 'MikaelG@hit.ac.il',
  collaborators: [
    { name: 'Gilad Shamir', email: 'GiladS@hit.ac.il' },
    { name: 'Hilit Krugman', email: 'HilitK@hit.ac.il' }
  ],
  supervisor: { name: 'Ilya Levin', email: 'IlyaL@hit.ac.il' },
  startDate: '2026-01-01',
  dueDate: '2026-04-01'
};

// Parse the markdown file and extract tasks
function parseTasks(content) {
  const tasks = [];

  // Split into sections by "### Task"
  const taskRegex = /### Task ([A-Z0-9.-]+)\n\*\*Section:\*\* (.+?)\s*\n\*\*Title:\*\* (.+?)\s*\n\*\*Description:\*\* (.+?)(?=\n\n### Task|\n---|\n\n## |$)/gs;

  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    const [, taskId, section, title, description] = match;
    tasks.push({
      taskId: taskId.trim(),
      section: section.trim(),
      title: title.trim(),
      description: description.trim()
    });
  }

  return tasks;
}

// Get all sections mapped by number
async function getSectionMap() {
  const { data: sections, error } = await supabase
    .from('serhub_sections')
    .select('id, number');

  if (error) {
    console.error('Error fetching sections:', error);
    return {};
  }

  const map = {};
  sections.forEach(s => {
    map[s.number] = s.id;
  });

  return map;
}

// Get all profiles mapped by email
async function getProfileMap() {
  const { data: profiles, error } = await supabase
    .from('serhub_profiles')
    .select('id, email, first_name, last_name');

  if (error) {
    console.error('Error fetching profiles:', error);
    return {};
  }

  const map = {};
  profiles.forEach(p => {
    map[p.email.toLowerCase()] = p.id;
    // Also map by name
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    map[fullName] = p.id;
  });

  return map;
}

// Main import function
async function importTasks() {
  console.log('='.repeat(60));
  console.log('SERHUB Task Import');
  console.log('='.repeat(60));

  // Read markdown file
  const mdPath = '/Users/mikaelgorsky/001MGfiles/AI.edu/MALAG report/serhub-tasks.md';
  let content;
  try {
    content = readFileSync(mdPath, 'utf8');
    console.log('✓ Loaded markdown file');
  } catch (err) {
    console.error('Error reading markdown file:', err.message);
    return;
  }

  // Parse tasks
  const tasks = parseTasks(content);
  console.log(`✓ Parsed ${tasks.length} tasks from markdown`);

  // Get section map
  console.log('\nLoading sections...');
  const sectionMap = await getSectionMap();
  console.log(`✓ Loaded ${Object.keys(sectionMap).length} sections`);

  // Get profile map
  console.log('\nLoading profiles...');
  const profileMap = await getProfileMap();
  console.log(`✓ Loaded ${Object.keys(profileMap).length / 2} profiles`); // /2 because we map both email and name

  // Check for required profiles
  const ownerId = profileMap[METADATA.ownerEmail.toLowerCase()];
  const supervisorId = profileMap[METADATA.supervisor.email.toLowerCase()];
  const collaboratorIds = METADATA.collaborators
    .map(c => profileMap[c.email.toLowerCase()])
    .filter(id => id);

  console.log('\nProfile lookup results:');
  console.log(`  Owner (${METADATA.ownerEmail}): ${ownerId || 'NOT FOUND'}`);
  console.log(`  Supervisor (${METADATA.supervisor.email}): ${supervisorId || 'NOT FOUND'}`);
  console.log(`  Collaborators: ${collaboratorIds.length}/${METADATA.collaborators.length} found`);

  if (!ownerId) {
    console.error('\n❌ Owner profile not found. Please create profiles first.');
    console.log('\nRun this SQL in Supabase SQL Editor to create profiles:');
    console.log(`
INSERT INTO serhub_profiles (id, email, first_name, last_name, title, organization_role, system_role, is_active)
VALUES
  (gen_random_uuid(), 'MikaelG@hit.ac.il', 'Mikael', 'Gorsky', 'Dr.', 'department_faculty', 'admin', true),
  (gen_random_uuid(), 'IlyaL@hit.ac.il', 'Ilya', 'Levin', 'Prof.', 'department_faculty', 'coordinator', true),
  (gen_random_uuid(), 'GiladS@hit.ac.il', 'Gilad', 'Shamir', NULL, 'department_faculty', 'member', true),
  (gen_random_uuid(), 'HilitK@hit.ac.il', 'Hilit', 'Krugman', NULL, 'administrative_staff', 'member', true);
`);
    return;
  }

  // Use owner as supervisor if supervisor not found
  const effectiveSupervisorId = supervisorId || ownerId;

  // Check for Guide section
  if (!sectionMap['Guide']) {
    console.log('\nCreating missing "Guide" section...');
    const { data: newSection, error } = await supabase
      .from('serhub_sections')
      .insert({
        number: 'Guide',
        title: 'Additional Required Materials',
        description: 'Syllabi, CVs, approval letters, and submission organization',
        level: 1,
        sort_order: 9000
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating Guide section:', error.message);
    } else {
      sectionMap['Guide'] = newSection.id;
      console.log(`✓ Created Guide section: ${newSection.id}`);
    }
  }

  // Import tasks
  console.log('\n' + '='.repeat(60));
  console.log('Importing tasks...');
  console.log('='.repeat(60));

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    // Get section ID
    const sectionId = sectionMap[task.section];
    if (!sectionId) {
      console.error(`  [${i+1}] Skipping task "${task.taskId}": section "${task.section}" not found`);
      skippedCount++;
      continue;
    }

    // Create task
    const { data: createdTask, error: taskError } = await supabase
      .from('serhub_tasks')
      .insert({
        title: task.title,
        description: task.description,
        section_id: sectionId,
        owner_id: ownerId,
        supervisor_id: effectiveSupervisorId,
        status: 0,
        blocked: false,
        start_date: METADATA.startDate,
        due_date: METADATA.dueDate
      })
      .select('id')
      .single();

    if (taskError) {
      console.error(`  [${i+1}] Error creating task "${task.taskId}":`, taskError.message);
      errorCount++;
      continue;
    }

    // Add collaborators
    for (const collabId of collaboratorIds) {
      await supabase
        .from('serhub_task_collaborators')
        .insert({
          task_id: createdTask.id,
          user_id: collabId
        });
    }

    successCount++;

    // Progress update every 20 tasks
    if ((i + 1) % 20 === 0 || i === tasks.length - 1) {
      console.log(`  Progress: ${i+1}/${tasks.length} (${successCount} ok, ${errorCount} errors, ${skippedCount} skipped)`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total tasks in markdown: ${tasks.length}`);
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Skipped (missing section): ${skippedCount}`);
  console.log(`Collaborator relationships: ${successCount * collaboratorIds.length}`);
}

// Run the import
importTasks().catch(console.error);
