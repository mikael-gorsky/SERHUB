
export enum UserRole {
  ADMIN = 'Admin',
  SUPERVISOR = 'Supervisor',
  COORDINATOR = 'Coordinator',
  TEAM_MEMBER = 'Team Member'
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  sectionId: string;
  assignedTo: string; // Matched to database field 'assignedTo'
  author: string;
  dueDate: string; // ISO Date
  duration: number; // in days
  progress: number; // 0-100
}

export interface Document {
  id: string;
  name: string;
  type: 'PDF' | 'DOC' | 'XLS' | 'PPT';
  url: string; // Drive Link
  lastUpdated: string;
  status: 'Missing' | 'Uploaded' | 'Outdated';
}

export interface Section {
  id: string;
  number: string;
  title: string;
  description: string;
  progress: number;
  docsUrl: string; // Google Doc Link
  driveFolderUrl: string; // Drive Folder Link
  documentsExpected: number;
  documentsUploaded: number;
  tasksTotal: number;
  tasksOpen: number;
  nextDeadline: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  type: 'Guideline' | 'History' | 'Source';
  summary: string;
  tags: string[];
  link: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'Deadline' | 'Meeting' | 'Milestone';
  sectionId?: string;
}
