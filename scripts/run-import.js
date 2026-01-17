import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://lxfwhygolfmfrsgtcckc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4ZndoeWdvbGZtZnJzZ3RjY2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2NzgyOSwiZXhwIjoyMDgzNTQzODI5fQ.i5SBy2Frkks6wcBFibPBCZCVqKBoyTvIB76AmUBQeWc'
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
    tasks.push({
      taskId: match[1].trim(),
      section: match[2].trim(),
      title: match[3].trim(),
      description: match[4].trim()
    });
  }
  return tasks;
}

async function main() {
  console.log('SERHUB Task Import');
  console.log('==================');

  const content = readFileSync('/Users/mikaelgorsky/001MGfiles/AI.edu/MALAG report/serhub-tasks-complete.md', 'utf8');
  const tasks = parseTasks(content);
  console.log(`Parsed ${tasks.length} tasks`);

  const { data: sections } = await supabase.from('serhub_sections').select('id, number');
  const sectionMap = {};
  sections?.forEach(s => sectionMap[s.number] = s.id);
  console.log(`Loaded ${sections?.length} sections`);

  const { data: profiles } = await supabase.from('serhub_profiles').select('id, email');
  const profileMap = {};
  profiles?.forEach(p => profileMap[p.email.toLowerCase()] = p.id);

  const ownerId = profileMap[METADATA.ownerEmail.toLowerCase()];
  const supervisorId = profileMap[METADATA.supervisorEmail.toLowerCase()] || ownerId;
  const collaboratorIds = METADATA.collaboratorEmails.map(e => profileMap[e.toLowerCase()]).filter(Boolean);

  if (!ownerId) { console.error('Owner not found!'); return; }
  console.log(`Owner: ${ownerId}, Supervisor: ${supervisorId}, Collaborators: ${collaboratorIds.length}`);

  // Find missing sections
  const missingSections = new Set();
  tasks.forEach(t => { if (!sectionMap[t.section]) missingSections.add(t.section); });

  if (missingSections.size > 0) {
    console.log(`Creating ${missingSections.size} missing sections...`);
    for (const num of missingSections) {
      const level = num.includes('.') ? Math.min(num.split('.').length, 3) : 1;
      const { data } = await supabase.from('serhub_sections').insert({
        number: num, title: `Section ${num}`, level, sort_order: 9000
      }).select('id').single();
      if (data) sectionMap[num] = data.id;
    }
  }

  console.log('Importing tasks...');
  let success = 0, errors = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const sectionId = sectionMap[task.section];
    if (!sectionId) { errors++; continue; }

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

    if (error) { errors++; continue; }

    for (const collabId of collaboratorIds) {
      await supabase.from('serhub_task_collaborators').insert({ task_id: created.id, user_id: collabId });
    }
    success++;
    if ((i + 1) % 50 === 0) console.log(`  ${i+1}/${tasks.length}`);
  }

  console.log(`\nDone! Success: ${success}, Errors: ${errors}`);
}

main();
