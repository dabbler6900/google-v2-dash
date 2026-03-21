import { Telemetry } from "../telemetry/TraceContract.js";
import { AutomationInbox } from "../events/AutomationInbox.js";
import { ProjectSoul } from "../soul/ProjectSoul.js";

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignee: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export class TaskEngine {
  private static tasks: Task[] = [];

  static init() {
    this.startHeartbeat();
  }

  private static startHeartbeat() {
    console.log("TaskEngine Heartbeat Started (Passive Mode).");
    setInterval(() => {
      this.broadcastTelemetry();
    }, 5000); // Broadcast state every 5 seconds
  }

  private static broadcastTelemetry() {
    const activeTasks = this.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const pendingTasks = this.tasks.filter(t => t.status === 'TODO').length;
    
    Telemetry.log({
      traceId: 'heartbeat',
      agentId: 'SYSTEM',
      eventType: 'LIFECYCLE',
      action: 'HEARTBEAT',
      payload: { activeTasks, pendingTasks, mode: 'OPENCLAW_DRIVEN' }
    });
  }

  static async createTask(title: string, description: string, assignee: string = 'COMMANDER', projectId?: string): Promise<Task> {
    const id = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const task: Task = {
      id,
      projectId,
      title,
      description,
      status: 'TODO',
      priority: 'MEDIUM', // Default, will be triaged
      assignee,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };

    this.tasks.push(task);
    
    // Trigger Triage Pipeline
    this.triageTask(task);
    
    return task;
  }

  private static async triageTask(task: Task) {
    Telemetry.log({
      traceId: `triage_${task.id}`,
      agentId: 'SYSTEM',
      eventType: 'LIFECYCLE',
      action: 'WAITING_FOR_TRIAGE',
      targetPath: task.id,
      payload: { title: task.title, status: 'PENDING_OPENCLAW' }
    });
  }

  static async executeTask(task: Task) {
    if (task.status === 'IN_PROGRESS') return;
    
    task.status = 'IN_PROGRESS';
    task.updatedAt = new Date().toISOString();

    Telemetry.log({
      traceId: `exec_${task.id}`,
      agentId: 'ACPX_CLI',
      eventType: 'LIFECYCLE',
      action: 'EXECUTION_STARTED',
      targetPath: task.id,
      payload: { task: task.title, driver: 'ACPX_CLI' }
    });
  }

  private static async checkAlignment(task: Task, mission: any): Promise<boolean> {
    // In OpenClaw mode, alignment is assumed or checked by the agent before submission.
    return true;
  }

  static async verifyTask(task: Task) {
    task.status = 'REVIEW';
    task.updatedAt = new Date().toISOString();

    Telemetry.log({
      traceId: `verify_${task.id}`,
      agentId: 'OPENCLAW',
      eventType: 'VERIFICATION_RESULT',
      action: 'QA_STARTED',
      targetPath: task.id,
      payload: { task: task.title }
    });
  }

  private static async triggerRCA(task: Task) {
    Telemetry.log({
      traceId: `rca_${task.id}`,
      agentId: 'ARCHITECT',
      eventType: 'LIFECYCLE',
      action: 'SELF_HEALING_TRIGGERED',
      targetPath: task.id,
      payload: { originalTask: task.title, reason: task.metadata.blockReason }
    });

    const rcaTask = await this.createTask(
      `RCA: ${task.title}`,
      `Analyze why task ${task.id} failed QA. Original reason: ${task.metadata.blockReason}. Propose a fix or re-plan.`,
      'ARCHITECT'
    );
    rcaTask.priority = 'CRITICAL';
    rcaTask.metadata.originalTaskId = task.id;
  }

  private static async extractPatterns(task: Task) {
    // Learning loop
    Telemetry.log({
      traceId: `learn_${task.id}`,
      agentId: 'ARCHITECT',
      eventType: 'BEHAVIOR_DRIFT',
      action: 'PATTERN_EXTRACTED',
      targetPath: task.id,
      payload: { 
        insight: `Successfully completed ${task.title}. Pattern: ${task.metadata.suggestedAgent} is effective for this type of work.` 
      }
    });
  }

  static getTasks() {
    return this.tasks;
  }

  static getNextAgentTask(agentId: string): Task | undefined {
    return this.tasks.find(t => t.status === 'TODO' && (t.assignee === agentId || t.metadata.suggestedAgent === agentId));
  }
}
