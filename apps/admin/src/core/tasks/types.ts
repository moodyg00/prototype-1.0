export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskActionType =
  | 'approve'
  | 'reject'
  | 'provide_input'
  | 'record_decision'
  | 'defer'
  | 'escalate'
  | 'mark_complete';

export interface TaskAction {
  id: string;
  taskId: string;
  type: TaskActionType;
  payload: Record<string, any>;
  actor: 'human' | 'agent';
  actorId?: string;
  note?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  source: 'agent' | 'human' | 'system';
  sourceId?: string;
  assigneeId?: string;
  relatedEntity?: { type: string; id: string };
  actionHistory: TaskAction[];
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  value?: number;
  stage: string;
  priority: TaskPriority;
  createdAt: string;
}
