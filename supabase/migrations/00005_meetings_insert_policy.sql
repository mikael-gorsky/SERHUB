-- Allow all authenticated users to create meetings
-- Previously only coordinators/admins could create meetings

-- Drop the restrictive policy
drop policy if exists "meetings_insert_coordinator" on serhub_meetings;

-- Create new policy allowing all authenticated users to insert
create policy "meetings_insert_authenticated" on serhub_meetings
  for insert to authenticated
  with check (true);
