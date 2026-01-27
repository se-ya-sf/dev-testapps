// Project types
export type ProjectStatus = 'Planning' | 'Active' | 'OnHold' | 'Done' | 'Archived';
export type Role = 'Admin' | 'PM' | 'Manager' | 'Contributor' | 'Viewer';
export type TaskType = 'task' | 'summary' | 'milestone';
export type TaskStatus = 'NotStarted' | 'InProgress' | 'Blocked' | 'Done';
export type ScheduleWarning = 'SCHEDULE_MISSING_DATES' | 'SCHEDULE_VIOLATION';

export interface User {
  id: string;
  entraOid: string;
  email: string;
  displayName: string;
  projects?: { projectId: string; role: Role }[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  autoSchedule: boolean;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: Role;
  user?: {
    email: string;
    displayName: string;
  };
}

export interface Task {
  id: string;
  projectId: string;
  parentId: string | null;
  orderIndex: number;
  type: TaskType;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  status: TaskStatus;
  priority: string | null;
  estimatePd: number | null;
  actualPd: number | null;
  assigneeIds: string[] | null;
  hasScheduleWarning: boolean;
  scheduleWarnings: ScheduleWarning[] | null;
  deletedAt: string | null;
}

export interface Dependency {
  id: string;
  projectId: string;
  predecessorTaskId: string;
  successorTaskId: string;
  type: 'FS';
  lagDays: number;
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  workDate: string;
  pd: number;
  note: string | null;
}

export interface Baseline {
  id: string;
  projectId: string;
  name: string;
  locked: boolean;
  createdAt: string;
}

export interface BaselineDiffItem {
  taskId: string;
  taskTitle?: string;
  baselineStart: string | null;
  baselineEnd: string | null;
  currentStart: string | null;
  currentEnd: string | null;
  deltaDays: number | null;
  deltaPd: number | null;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface Deliverable {
  id: string;
  projectId: string;
  name: string;
  url: string;
  type: string | null;
  note: string | null;
}

export interface ChangeLog {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  field: string;
  before: string | null;
  after: string | null;
  createdAt: string;
}

// UI Helper types
export interface TreeNode extends Task {
  children: TreeNode[];
  level: number;
  isExpanded: boolean;
}
