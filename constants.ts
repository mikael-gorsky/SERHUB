// SERHUB Constants
// Mock data removed - now using Supabase database

// Role display labels
export const SYSTEM_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  coordinator: 'Coordinator',
  member: 'Team Member'
};

export const ORGANIZATION_ROLE_LABELS: Record<string, string> = {
  institution_management: 'Institution Management',
  parent_unit: 'Parent Unit',
  department_faculty: 'Department Faculty',
  adjunct_faculty: 'Adjunct Faculty',
  student: 'Student',
  administrative_staff: 'Administrative Staff'
};

// Status colors for UI
export const STATUS_COLORS = {
  on_track: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  approaching: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  blocked: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  complete: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
};

// Meeting type labels
export const MEETING_TYPE_LABELS: Record<string, string> = {
  project_meeting: 'Project Meeting',
  review_meeting: 'Review Meeting',
  recurring_meeting: 'Recurring Meeting',
  other: 'Other'
};
