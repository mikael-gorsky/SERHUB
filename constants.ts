
import { User, UserRole, Section, Task, Document, KnowledgeItem, CalendarEvent } from './types';

export const USERS: User[] = [
  { 
    id: 'u-mg', 
    name: 'Mikael Gorsky', 
    email: 'mikaelg@hit.ac.il', 
    role: UserRole.COORDINATOR, 
    avatar: 'https://ui-avatars.com/api/?name=Mikael+Gorsky&background=005695&color=fff' 
  },
  { 
    id: 'V93sHZzYX4Uoi1h1ATwwxYsftpS2', 
    name: 'Auth Proxy User', 
    email: 'auth@hit.ac.il', 
    role: UserRole.TEAM_MEMBER, 
    avatar: 'https://ui-avatars.com/api/?name=Auth+User&background=666&color=fff' 
  },
  { id: 'u2', name: 'Dr. Sarah Cohen', email: 'sarah.c@hit.ac.il', role: UserRole.SUPERVISOR, avatar: 'https://picsum.photos/id/1011/200/200' },
  { id: 'u3', name: 'Prof. David Levi', email: 'david.l@hit.ac.il', role: UserRole.SUPERVISOR, avatar: 'https://picsum.photos/id/1005/200/200' },
  { id: 'u4', name: 'Maya Regev', email: 'maya.r@hit.ac.il', role: UserRole.TEAM_MEMBER, avatar: 'https://picsum.photos/id/1025/200/200' },
];

export const CURRENT_USER: User = USERS[0];

export const MOCK_SECTIONS: Section[] = [
  {
    id: 'step1',
    number: 'Step 1',
    title: 'Mission and Goals',
    description: 'Review and update the institutional mission statement and strategic goals for the current evaluation period.',
    progress: 45,
    docsUrl: 'https://docs.google.com/document/d/1',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1',
    documentsExpected: 5,
    documentsUploaded: 2,
    tasksTotal: 4,
    tasksOpen: 2,
    nextDeadline: '2023-11-15'
  },
  {
    id: 'step2',
    number: 'Step 2',
    title: 'Program Structure',
    description: 'Documentation of curriculum structure, credit allocations, and course syllabi compliance.',
    progress: 25,
    docsUrl: 'https://docs.google.com/document/d/2',
    driveFolderUrl: 'https://drive.google.com/drive/folders/2',
    documentsExpected: 8,
    documentsUploaded: 3,
    tasksTotal: 6,
    tasksOpen: 4,
    nextDeadline: '2023-12-05'
  },
  {
    id: 'step3',
    number: 'Step 3',
    title: 'Teaching and Learning',
    description: 'Evaluation of teaching methodologies, assessment tools, and learning outcomes attainment.',
    progress: 10,
    docsUrl: 'https://docs.google.com/document/d/3',
    driveFolderUrl: 'https://drive.google.com/drive/folders/3',
    documentsExpected: 12,
    documentsUploaded: 1,
    tasksTotal: 8,
    tasksOpen: 7,
    nextDeadline: '2024-01-20'
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: '1.1',
    title: 'Draft Mission Revision',
    description: 'Update mission statement to reflect current strategic plan.',
    sectionId: 'step1',
    assignedTo: 'u-mg',
    author: 'Mikael Gorsky',
    dueDate: '2023-11-10',
    duration: 5,
    progress: 80
  },
  {
    id: '1.2',
    title: 'Collect Syllabi',
    description: 'Gather all updated syllabi for Semester A.',
    sectionId: 'step2',
    assignedTo: 'u4',
    author: 'AI',
    dueDate: '2023-11-25',
    duration: 14,
    progress: 30
  }
];

export const MOCK_DOCS: Document[] = [
  {
    id: 'd1',
    name: 'Strategic Plan 2022-2027',
    type: 'PDF',
    url: 'https://drive.google.com/file/d/1',
    lastUpdated: '2023-09-15',
    status: 'Uploaded'
  },
  {
    id: 'd2',
    name: 'Curriculum Map v2',
    type: 'XLS',
    url: 'https://drive.google.com/file/d/2',
    lastUpdated: '2023-10-12',
    status: 'Uploaded'
  }
];

export const MOCK_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: 'k1',
    title: 'CHE Evaluation Handbook',
    type: 'Guideline',
    summary: 'Official Council for Higher Education guidelines for institutional self-evaluation.',
    tags: ['step1', 'step2', 'step3'],
    link: 'https://che.org.il/guidelines'
  },
  {
    id: 'k2',
    title: '2018 SER Archive',
    type: 'History',
    summary: 'The previous successful submission for benchmarking.',
    tags: ['step1'],
    link: '#'
  }
];

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Internal Review Meeting',
    date: '2023-11-12',
    type: 'Meeting',
    sectionId: 'step1'
  },
  {
    id: 'e2',
    title: 'Step 1 Submission Deadline',
    date: '2023-11-15',
    type: 'Deadline',
    sectionId: 'step1'
  }
];
