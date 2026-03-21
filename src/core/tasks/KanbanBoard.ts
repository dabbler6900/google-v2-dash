/**
 * Kanban Task Tracking & Planning API
 * Managed by the Commander agent for structured execution.
 */
import { Telemetry } from '../telemetry/TraceContract.js';
import fs from 'fs';
import path from 'path';
import { broadcastStateUpdate } from '../events/broadcast.js';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  parentId?: string;
  subtasks?: KanbanTask[];
  createdAt: string;
}

export class KanbanBoard {
  private static getTasksFilePath(): string {
    return path.join(process.cwd(), 'tasks.json');
  }

  private static loadTasks(): Map<string, KanbanTask> {
    try {
      const filePath = this.getTasksFilePath();
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const tasksArray: KanbanTask[] = JSON.parse(data);
        return new Map(tasksArray.map(t => [t.id, t]));
      }
    } catch (err) {
      console.error("Failed to load tasks.json", err);
    }
    return new Map();
  }

  private static saveTasks(tasks: Map<string, KanbanTask>) {
    try {
      const filePath = this.getTasksFilePath();
      const tasksArray = Array.from(tasks.values());
      fs.writeFileSync(filePath, JSON.stringify(tasksArray, null, 2), 'utf-8');
    } catch (err) {
      console.error("Failed to save tasks.json", err);
    }
  }

  static async createTask(title: string, description: string, assignee?: string, parentId?: string, priority: TaskPriority = 'MEDIUM'): Promise<KanbanTask> {
    const tasks = this.loadTasks();
    const id = `TASK-${Math.floor(Math.random() * 10000)}`;
    const task: KanbanTask = {
      id,
      title,
      description,
      status: 'TODO',
      priority,
      assignee,
      parentId,
      subtasks: [],
      createdAt: new Date().toISOString()
    };
    
    tasks.set(id, task);
    this.saveTasks(tasks);

    broadcastStateUpdate('KANBAN_UPDATE', this.getTasks());

    Telemetry.log({
      traceId: `trace-${Date.now()}`,
      agentId: assignee || 'COMMANDER',
      eventType: 'STATE_MUTATION',
      action: parentId ? 'SUBTASK_CREATED' : 'TASK_CREATED',
      payload: { taskId: id, title, parentId }
    });

    return task;
  }

  static async updateTask(id: string, updates: Partial<KanbanTask>, agentId: string): Promise<KanbanTask> {
    const tasks = this.loadTasks();
    const task = tasks.get(id);
    if (!task) throw new Error(`Task ${id} not found.`);
    
    Object.assign(task, updates);
    tasks.set(id, task);
    this.saveTasks(tasks);

    broadcastStateUpdate('KANBAN_UPDATE', this.getTasks());

    Telemetry.log({
      traceId: `trace-${Date.now()}`,
      agentId,
      eventType: 'STATE_MUTATION',
      action: 'TASK_UPDATED',
      payload: { taskId: id, updates }
    });

    return task;
  }

  static async updateTaskStatus(id: string, status: TaskStatus, agentId: string): Promise<void> {
    await this.updateTask(id, { status }, agentId);
  }

  static getTasks(): KanbanTask[] {
    const allTasks = Array.from(this.loadTasks().values());
    // Build the fractal tree
    const taskMap = new Map(allTasks.map(t => [t.id, { ...t, subtasks: [] }]));
    const rootTasks: KanbanTask[] = [];

    taskMap.forEach(task => {
      if (task.parentId && taskMap.has(task.parentId)) {
        taskMap.get(task.parentId)!.subtasks!.push(task);
      } else {
        rootTasks.push(task);
      }
    });

    return rootTasks;
  }

  static getNextAgentTask(agentId: string): KanbanTask | null {
    const allTasks = Array.from(this.loadTasks().values());
    // Find highest priority TODO task assigned to this agent (or unassigned)
    const available = allTasks.filter(t => 
      t.status === 'TODO' && (!t.assignee || t.assignee === agentId || t.assignee === 'OPENCLAW')
    );

    if (available.length === 0) return null;

    // Sort by priority (CRITICAL > HIGH > MEDIUM > LOW)
    const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    available.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    return available[0];
  }
}
