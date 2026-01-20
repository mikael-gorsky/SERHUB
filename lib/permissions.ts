import { Profile } from '../types';

export type Permission = 'create_tasks' | 'edit_tasks' | 'create_meetings' | 'edit_meetings';

/**
 * Check if a user has a specific permission.
 * - Admins always have full access (bypass all checks)
 * - Non-login users (is_user=false) have no permissions
 * - Login users check their specific permission flags
 */
export const hasPermission = (
  profile: Profile | null | undefined,
  permission: Permission
): boolean => {
  if (!profile) return false;

  // Admins always have full access
  if (profile.role === 'admin') return true;

  // Non-login users (external collaborators) have no permissions
  if (!profile.is_user) return false;

  // Check specific permission for login users
  switch (permission) {
    case 'create_tasks':
      return profile.can_create_tasks ?? false;
    case 'edit_tasks':
      return profile.can_edit_tasks ?? false;
    case 'create_meetings':
      return profile.can_create_meetings ?? false;
    case 'edit_meetings':
      return profile.can_edit_meetings ?? false;
    default:
      return false;
  }
};

/**
 * Check if user can create tasks
 */
export const canCreateTasks = (profile: Profile | null | undefined): boolean => {
  return hasPermission(profile, 'create_tasks');
};

/**
 * Check if user can edit tasks (any task)
 */
export const canEditTasks = (profile: Profile | null | undefined): boolean => {
  return hasPermission(profile, 'edit_tasks');
};

/**
 * Check if user can create meetings
 */
export const canCreateMeetings = (profile: Profile | null | undefined): boolean => {
  return hasPermission(profile, 'create_meetings');
};

/**
 * Check if user can edit meetings (any meeting)
 */
export const canEditMeetings = (profile: Profile | null | undefined): boolean => {
  return hasPermission(profile, 'edit_meetings');
};
