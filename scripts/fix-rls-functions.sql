-- Fix RLS functions to use 'role' instead of 'system_role'
-- The column was renamed in migration 00006_profile_schema_update.sql
-- but the functions were not updated

-- Drop and recreate serhub_is_admin function
CREATE OR REPLACE FUNCTION serhub_is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM serhub_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop and recreate serhub_is_coordinator_or_admin function
-- Note: coordinator was renamed to supervisor, but we keep checking for old values too
CREATE OR REPLACE FUNCTION serhub_is_coordinator_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM serhub_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'supervisor', 'coordinator')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Also update serhub_get_user_role function if it exists
CREATE OR REPLACE FUNCTION serhub_get_user_role()
RETURNS text AS $$
  SELECT role FROM serhub_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
