/**
 * SERHUB Task Import Script v2
 * Clears existing tasks and imports fresh from markdown
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://lxfwhygolfmfrsgtcckc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4ZndoeWdvbGZtZnJzZ3RjY2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Njc4MjksImV4cCI6MjA4MzU0MzgyOX0.UX8KlthYc9j9AXnavs-LVe3kfraFyjBpUHgbJLgjwsA'
);

const METADATA = {
  ownerEmail: 'MikaelG@hit.ac.il',
  supervisorEmail: 'IlyaL@hit.ac.il',
  collaboratorEmails: ['GiladS@hit.ac.il', 'HilitK@hit.ac.il'],
  startDate: '2026-01-01',
  dueDate: '2026-04-01'
};

function parseTasks(content) {
  const tasks = [];
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

async function main() {
  console.log('='.repeat(60));
  console.log('SERHUB Task Import v2');
  console.log('='.repeat(60));

  // Read markdown
  const content = readFileSync('/Users/mikaelgorsky/001MGfiles/AI.edu/MALAG report/serhub-tasks-complete.md', 'utf8');
  const tasks = parseTasks(content);
  console.log(`Parsed ${tasks.length} tasks from markdown`);

  // Get sections
  const { data: sections } = await supabase.from('serhub_sections').select('id, number');
  const sectionMap = {};
  sections?.forEach(s => sectionMap[s.number] = s.id);
  console.log(`Loaded ${sections?.length} sections`);

  // Get profiles
  const { data: profiles } = await supabase.from('serhub_profiles').select('id, email');
  const profileMap = {};
  profiles?.forEach(p => profileMap[p.email.toLowerCase()] = p.id);

  const ownerId = profileMap[METADATA.ownerEmail.toLowerCase()];
  const supervisorId = profileMap[METADATA.supervisorEmail.toLowerCase()] || ownerId;
  const collaboratorIds = METADATA.collaboratorEmails.map(e => profileMap[e.toLowerCase()]).filter(Boolean);

  console.log(`Owner: ${ownerId ? 'found' : 'NOT FOUND'}`);
  console.log(`Supervisor: ${supervisorId ? 'found' : 'NOT FOUND'}`);
  console.log(`Collaborators: ${collaboratorIds.length} found`);

  if (!ownerId) {
    console.error('Owner not found!');
    return;
  }

  // Check for missing sections
  const missingSections = new Set();
  tasks.forEach(t => {
    if (!sectionMap[t.section]) missingSections.add(t.section);
  });

  if (missingSections.size > 0) {
    console.log(`\nMissing sections: ${[...missingSections].join(', ')}`);
    console.log('Creating missing sections...');

    for (const num of missingSections) {
      const { data, error } = await supabase.from('serhub_sections').insert({
        number: num,
        title: `Section ${num}`,
        level: num.split('.').length,
        sort_order: 9000
      }).select('id').single();

      if (data) {
        sectionMap[num] = data.id;
        console.log(`  Created section ${num}`);
      }
    }
  }

  // Import tasks
  console.log('\nImporting tasks...');
  let success = 0, errors = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const sectionId = sectionMap[task.section];

    if (!sectionId) {
      console.error(`  [${i+1}] Section ${task.section} not found`);
      errors++;
      continue;
    }

    const { data: created, error } = await supabase.from('serhub_tasks').insert({
      title: task.title,
      description: task.description,
      section_id: sectionId,
      owner_id: ownerId,
      supervisor_id: supervisorId,
      status: 0,
      blocked: false,
      start_date: METADATA.startDate,
      due_date: METADATA.dueDate
    }).select('id').single();

    if (error) {
      console.error(`  [${i+1}] Error: ${error.message}`);
      errors++;
      continue;
    }

    // Add collaborators
    for (const collabId of collaboratorIds) {
      await supabase.from('serhub_task_collaborators').insert({
        task_id: created.id,
        user_id: collabId
      });
    }

    success++;
    if ((i + 1) % 50 === 0) console.log(`  Progress: ${i+1}/${tasks.length}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('COMPLETE');
  console.log('='.repeat(60));
  console.log(`Success: ${success}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
