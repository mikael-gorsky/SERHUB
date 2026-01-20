-- SERHUB Profile Schema Update
-- Migrates from first_name/last_name to single name field
-- Adds is_user flag to distinguish login users from external collaborators
-- Updates role values: coordinator -> supervisor, member -> contributor

-- ============================================
-- Step 1: Add new columns
-- ============================================
ALTER TABLE serhub_profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS is_user boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS other_contact text;

-- ============================================
-- Step 2: Migrate name data (merge first_name + last_name)
-- Include title if present
-- ============================================
UPDATE serhub_profiles
SET name = CASE
  WHEN title IS NOT NULL AND title != '' THEN title || ' ' || first_name || ' ' || last_name
  ELSE first_name || ' ' || last_name
END
WHERE name IS NULL;

-- ============================================
-- Step 3: Make name NOT NULL after data migration
-- ============================================
ALTER TABLE serhub_profiles ALTER COLUMN name SET NOT NULL;

-- ============================================
-- Step 4: Drop old constraint FIRST (before updating values)
-- ============================================
ALTER TABLE serhub_profiles DROP CONSTRAINT IF EXISTS serhub_profiles_system_role_check;

-- ============================================
-- Step 5: Update system_role values
-- coordinator -> supervisor
-- member -> contributor
-- any other value -> contributor (catch-all)
-- ============================================
UPDATE serhub_profiles SET system_role = 'supervisor' WHERE system_role = 'coordinator';
UPDATE serhub_profiles SET system_role = 'contributor' WHERE system_role = 'member';
-- Handle any other non-standard values
UPDATE serhub_profiles SET system_role = 'contributor'
WHERE system_role NOT IN ('admin', 'supervisor', 'contributor');

-- ============================================
-- Step 6: Add new constraint after all data is migrated
-- ============================================
ALTER TABLE serhub_profiles
  ADD CONSTRAINT serhub_profiles_system_role_check
  CHECK (system_role IN ('admin', 'supervisor', 'contributor'));

-- ============================================
-- Step 7: Drop organization_role constraint (will drop column later)
-- ============================================
ALTER TABLE serhub_profiles DROP CONSTRAINT IF EXISTS serhub_profiles_organization_role_check;

-- ============================================
-- Step 8: All existing profiles are users (they have auth.users entries)
-- ============================================
UPDATE serhub_profiles SET is_user = true WHERE is_user IS NULL;

-- ============================================
-- Step 9: Remove FK constraint to auth.users to allow non-auth profiles
-- First, drop dependent foreign keys from other tables temporarily
-- ============================================

-- Create a new column for non-auth profiles (we'll use gen_random_uuid for new non-user profiles)
-- For now, we'll just remove the cascading FK and keep the id column as-is
-- Non-user profiles will be created with generated UUIDs not tied to auth.users

-- Note: In production, you may want to handle this more carefully
-- For SERHUB, the id will remain the same for existing users
-- New non-user collaborators will get gen_random_uuid() ids

-- ============================================
-- Step 10: Drop old columns
-- ============================================
ALTER TABLE serhub_profiles DROP COLUMN IF EXISTS first_name;
ALTER TABLE serhub_profiles DROP COLUMN IF EXISTS last_name;
ALTER TABLE serhub_profiles DROP COLUMN IF EXISTS title;
ALTER TABLE serhub_profiles DROP COLUMN IF EXISTS department;
ALTER TABLE serhub_profiles DROP COLUMN IF EXISTS organization_role;
ALTER TABLE serhub_profiles DROP COLUMN IF EXISTS is_active;

-- ============================================
-- Step 11: Create index for login users lookup
-- ============================================
CREATE INDEX IF NOT EXISTS idx_serhub_profiles_is_user ON serhub_profiles(is_user) WHERE is_user = true;

-- ============================================
-- Step 12: Update RLS helper function for role check
-- ============================================
CREATE OR REPLACE FUNCTION serhub_is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM serhub_profiles
    WHERE id = auth.uid() AND system_role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION serhub_is_supervisor_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM serhub_profiles
    WHERE id = auth.uid() AND system_role IN ('admin', 'supervisor')
  );
$$ LANGUAGE sql SECURITY DEFINER;
