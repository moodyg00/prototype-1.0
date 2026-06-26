import { Task, TaskAction, TaskActionType, TaskStatus, TaskPriority } from './types';
import { memoryService } from '../memory/service';

class TaskStore {
  private tasks: Map<string, Task> = new Map();

  async createTask(input: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    source: 'agent' | 'human' | 'system';
    sourceId?: string;
    relatedEntity?: any;
  }): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: input.title,
      description: input.description,
      status: 'pending',
      priority: input.priority || 'medium',
      source: input.source,
      sourceId: input.sourceId,
      relatedEntity: input.relatedEntity,
      actionHistory: [],
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);

    await memoryService.logStrategicEvent(
      input.sourceId || 'system',
      `Task created: ${task.title}`,
      2,
      { taskId: task.id, source: input.source }
    );

    return task;
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async listTasks(filter?: { status?: TaskStatus; priority?: TaskPriority }): Promise<Task[]> {
    let list = Array.from(this.tasks.values());
    if (filter?.status) list = list.filter(t => t.status === filter.status);
    if (filter?.priority) list = list.filter(t => t.priority === filter.priority);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async performAction(
    taskId: string,
    action: Omit<TaskAction, 'id' | 'taskId' | 'createdAt'> & { note?: string }
  ): Promise<TaskAction> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const fullAction: TaskAction = {
      id: `act_${Date.now()}`,
      taskId,
      type: action.type,
      payload: action.payload || {},
      actor: action.actor,
      actorId: action.actorId,
      note: action.note,
      createdAt: new Date().toISOString(),
    };

    task.actionHistory.push(fullAction);
    task.updatedAt = fullAction.createdAt;

    // Apply side effects for common actions
    if (action.type === 'approve' || action.type === 'mark_complete') {
      task.status = 'completed';
    } else if (action.type === 'reject') {
      task.status = 'cancelled';
    } else if (action.type === 'defer') {
      task.status = 'pending';
    }

    this.tasks.set(taskId, task);

    await memoryService.logStrategicEvent(
      action.actorId || 'human',
      `Action on task ${task.title}: ${action.type}${action.note ? ` - ${action.note}` : ''}`,
      1,
      { taskId, actionType: action.type }
    );

    return fullAction;
  }

  async getRecentActionsForTask(taskId: string, limit = 10): Promise<TaskAction[]> {
    const t = this.tasks.get(taskId);
    return (t?.actionHistory || []).slice(-limit).reverse();
  }
}

export const taskStore = new TaskStore();
