export type Priority = 'low' | 'medium' | 'high';

export type TaskType =
  | 'feature'
  | 'bug'
  | 'design'
  | 'copy'
  | 'research'
  | 'client'
  | 'marketing'
  | 'launch';

export type StatusLabel =
  | 'blocked'
  | 'needs-approval'
  | 'quick-win'
  | 'revenue-impact';

export type ColumnStage = 'backlog' | 'ready' | 'progress' | 'review' | 'done' | 'custom';

export type SwimlaneKind = 'fast-track' | 'standard' | 'custom';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  type?: TaskType | null;
  statusLabels?: StatusLabel[];
  columnId: string;
  swimlaneId?: string;
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  stage?: ColumnStage;
  wipLimit?: number | null;
  taskIds: string[];
}

export interface Swimlane {
  id: string;
  title: string;
  kind: SwimlaneKind;
}

export interface BoardState {
  columns: Record<string, Column>;
  tasks: Record<string, Task>;
  columnOrder: string[];
  swimlanes?: Record<string, Swimlane>;
  swimlaneOrder?: string[];
}

export interface Project extends BoardState {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsPersistedState {
  version: 2;
  activeProjectId: string;
  projectOrder: string[];
  projects: Record<string, Project>;
}
