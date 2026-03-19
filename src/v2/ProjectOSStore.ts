import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export type TaskStatus =
  | 'inbox'
  | 'planned'
  | 'ready'
  | 'running'
  | 'review'
  | 'done'
  | 'blocked';

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  repoUrl: string | null;
  workspacePath: string | null;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export interface TaskRecord {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: TaskStatus;
  assignee: string | null;
  parentId: string | null;
  plan: Record<string, any> | null;
  constraints: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RunRecord {
  id: string;
  taskId: string;
  projectId: string;
  title: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'needs_review';
  runtime: string;
  sessionKey: string | null;
  summary: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
}

export interface ReviewRecord {
  id: number;
  taskId: string;
  runId: string | null;
  decision: 'approved' | 'changes_requested' | 'blocked';
  evidence: Record<string, any>;
  notes: string | null;
  createdAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class ProjectOSStore {
  private readonly db: Database.Database;

  constructor(rootPath: string = process.cwd()) {
    const dataDir = path.join(rootPath, 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    this.db = new Database(path.join(dataDir, 'project-os-v2.db'));
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        repo_url TEXT,
        workspace_path TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        metadata TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'task',
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'inbox',
        assignee TEXT,
        parent_id TEXT,
        plan TEXT,
        constraints TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(parent_id) REFERENCES tasks(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        runtime TEXT NOT NULL DEFAULT 'openclaw',
        session_key TEXT,
        summary TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        finished_at TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        run_id TEXT,
        decision TEXT NOT NULL,
        evidence TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_runs_task ON runs(task_id);
      CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
    `);
  }

  private mapProject(row: any): ProjectRecord {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      repoUrl: row.repo_url,
      workspacePath: row.workspace_path,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: parseJson(row.metadata, {})
    };
  }

  private mapTask(row: any): TaskRecord {
    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      description: row.description,
      type: row.type,
      priority: row.priority,
      status: row.status,
      assignee: row.assignee,
      parentId: row.parent_id,
      plan: parseJson(row.plan, null),
      constraints: parseJson(row.constraints, []),
      metadata: parseJson(row.metadata, {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRun(row: any): RunRecord {
    return {
      id: row.id,
      taskId: row.task_id,
      projectId: row.project_id,
      title: row.title,
      status: row.status,
      runtime: row.runtime,
      sessionKey: row.session_key,
      summary: row.summary,
      metadata: parseJson(row.metadata, {}),
      createdAt: row.created_at,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      updatedAt: row.updated_at
    };
  }

  private recordEvent(type: string, entityType: string, entityId: string, payload: Record<string, any>): void {
    this.db
      .prepare(
        `INSERT INTO events (type, entity_type, entity_id, payload, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(type, entityType, entityId, JSON.stringify(payload), nowIso());
  }

  listProjects(): ProjectRecord[] {
    return this.db
      .prepare(`SELECT * FROM projects ORDER BY updated_at DESC`)
      .all()
      .map((row) => this.mapProject(row));
  }

  createProject(input: {
    name: string;
    description?: string;
    repoUrl?: string;
    workspacePath?: string;
    metadata?: Record<string, any>;
  }): ProjectRecord {
    const record: ProjectRecord = {
      id: randomId('proj'),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      repoUrl: input.repoUrl?.trim() || null,
      workspacePath: input.workspacePath?.trim() || null,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: input.metadata ?? {}
    };

    this.db
      .prepare(
        `INSERT INTO projects (id, name, description, repo_url, workspace_path, status, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        record.id,
        record.name,
        record.description,
        record.repoUrl,
        record.workspacePath,
        record.status,
        JSON.stringify(record.metadata),
        record.createdAt,
        record.updatedAt
      );

    this.recordEvent('project.created', 'project', record.id, record);
    return record;
  }

  listTasks(filters?: { status?: TaskStatus; projectId?: string }): TaskRecord[] {
    const clauses: string[] = [];
    const values: any[] = [];

    if (filters?.status) {
      clauses.push('status = ?');
      values.push(filters.status);
    }

    if (filters?.projectId) {
      clauses.push('project_id = ?');
      values.push(filters.projectId);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    return this.db
      .prepare(`SELECT * FROM tasks ${whereClause} ORDER BY updated_at DESC, created_at DESC`)
      .all(...values)
      .map((row) => this.mapTask(row));
  }

  getTask(taskId: string): TaskRecord | null {
    const row = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId);
    return row ? this.mapTask(row) : null;
  }

  createTask(input: {
    projectId: string;
    title: string;
    description?: string;
    type?: string;
    priority?: TaskRecord['priority'];
    status?: TaskStatus;
    assignee?: string;
    parentId?: string | null;
    plan?: Record<string, any> | null;
    constraints?: string[];
    metadata?: Record<string, any>;
  }): TaskRecord {
    const project = this.db.prepare(`SELECT id FROM projects WHERE id = ?`).get(input.projectId);
    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    const record: TaskRecord = {
      id: randomId('task'),
      projectId: input.projectId,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      type: input.type?.trim() ?? 'task',
      priority: input.priority ?? 'medium',
      status: input.status ?? 'inbox',
      assignee: input.assignee?.trim() || null,
      parentId: input.parentId ?? null,
      plan: input.plan ?? null,
      constraints: input.constraints ?? [],
      metadata: input.metadata ?? {},
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    this.db
      .prepare(
        `INSERT INTO tasks (
           id, project_id, title, description, type, priority, status, assignee,
           parent_id, plan, constraints, metadata, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        record.id,
        record.projectId,
        record.title,
        record.description,
        record.type,
        record.priority,
        record.status,
        record.assignee,
        record.parentId,
        record.plan ? JSON.stringify(record.plan) : null,
        JSON.stringify(record.constraints),
        JSON.stringify(record.metadata),
        record.createdAt,
        record.updatedAt
      );

    this.recordEvent('task.created', 'task', record.id, record);
    return record;
  }

  updateTask(taskId: string, patch: Partial<Pick<TaskRecord, 'title' | 'description' | 'type' | 'priority' | 'status' | 'assignee' | 'plan' | 'constraints' | 'metadata'>>): TaskRecord {
    const existing = this.getTask(taskId);
    if (!existing) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const next: TaskRecord = {
      ...existing,
      ...patch,
      updatedAt: nowIso()
    };

    this.db
      .prepare(
        `UPDATE tasks
         SET title = ?, description = ?, type = ?, priority = ?, status = ?, assignee = ?,
             plan = ?, constraints = ?, metadata = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        next.title,
        next.description,
        next.type,
        next.priority,
        next.status,
        next.assignee,
        next.plan ? JSON.stringify(next.plan) : null,
        JSON.stringify(next.constraints),
        JSON.stringify(next.metadata),
        next.updatedAt,
        taskId
      );

    this.recordEvent('task.updated', 'task', taskId, next);
    return next;
  }

  applyPlan(taskId: string, plan: {
    summary?: string;
    goals?: string[];
    constraints?: string[];
    steps?: string[];
    subtasks?: Array<{ title: string; description?: string; type?: string; priority?: TaskRecord['priority'] }>;
  }): { task: TaskRecord; subtasks: TaskRecord[] } {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const updatedTask = this.updateTask(taskId, {
      status: task.status === 'inbox' ? 'planned' : task.status,
      plan: {
        summary: plan.summary ?? task.plan?.summary ?? '',
        goals: plan.goals ?? task.plan?.goals ?? [],
        steps: plan.steps ?? task.plan?.steps ?? []
      },
      constraints: plan.constraints ?? task.constraints
    });

    const createdSubtasks = (plan.subtasks ?? []).map((subtask) =>
      this.createTask({
        projectId: task.projectId,
        parentId: task.id,
        title: subtask.title,
        description: subtask.description,
        type: subtask.type ?? 'task',
        priority: subtask.priority ?? 'medium',
        status: 'ready'
      })
    );

    this.recordEvent('task.planned', 'task', taskId, {
      task: updatedTask,
      createdSubtaskIds: createdSubtasks.map((subtask) => subtask.id)
    });

    return { task: updatedTask, subtasks: createdSubtasks };
  }

  listRuns(limit = 50): RunRecord[] {
    return this.db
      .prepare(`SELECT * FROM runs ORDER BY updated_at DESC LIMIT ?`)
      .all(limit)
      .map((row) => this.mapRun(row));
  }

  executeTask(taskId: string, input: { runtime?: string; sessionKey?: string; summary?: string; metadata?: Record<string, any> }): { task: TaskRecord; run: RunRecord } {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const run: RunRecord = {
      id: randomId('run'),
      taskId: task.id,
      projectId: task.projectId,
      title: task.title,
      status: 'queued',
      runtime: input.runtime ?? 'openclaw',
      sessionKey: input.sessionKey ?? null,
      summary: input.summary ?? null,
      metadata: input.metadata ?? {},
      createdAt: nowIso(),
      startedAt: null,
      finishedAt: null,
      updatedAt: nowIso()
    };

    this.db
      .prepare(
        `INSERT INTO runs (id, task_id, project_id, title, status, runtime, session_key, summary, metadata, created_at, started_at, finished_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        run.id,
        run.taskId,
        run.projectId,
        run.title,
        run.status,
        run.runtime,
        run.sessionKey,
        run.summary,
        JSON.stringify(run.metadata),
        run.createdAt,
        run.startedAt,
        run.finishedAt,
        run.updatedAt
      );

    const updatedTask = this.updateTask(taskId, { status: 'running' });
    this.recordEvent('task.executed', 'task', taskId, { runId: run.id, runtime: run.runtime, sessionKey: run.sessionKey });
    return { task: updatedTask, run };
  }

  reviewTask(taskId: string, input: { runId?: string | null; decision: ReviewRecord['decision']; evidence?: Record<string, any>; notes?: string }): { task: TaskRecord; review: ReviewRecord } {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const review: ReviewRecord = {
      id: 0,
      taskId,
      runId: input.runId ?? null,
      decision: input.decision,
      evidence: input.evidence ?? {},
      notes: input.notes ?? null,
      createdAt: nowIso()
    };

    const result = this.db
      .prepare(
        `INSERT INTO reviews (task_id, run_id, decision, evidence, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        review.taskId,
        review.runId,
        review.decision,
        JSON.stringify(review.evidence),
        review.notes,
        review.createdAt
      );

    review.id = Number(result.lastInsertRowid);

    const nextStatus: TaskStatus =
      input.decision === 'approved' ? 'done' : input.decision === 'changes_requested' ? 'planned' : 'blocked';

    const updatedTask = this.updateTask(taskId, { status: nextStatus });

    if (review.runId) {
      this.db
        .prepare(`UPDATE runs SET status = ?, finished_at = ?, updated_at = ? WHERE id = ?`)
        .run(
          input.decision === 'approved' ? 'completed' : input.decision === 'changes_requested' ? 'needs_review' : 'failed',
          nowIso(),
          nowIso(),
          review.runId
        );
    }

    this.recordEvent('task.reviewed', 'task', taskId, {
      reviewId: review.id,
      decision: review.decision,
      nextStatus
    });

    return { task: updatedTask, review };
  }

  getOverview() {
    const projectCount = Number(this.db.prepare(`SELECT COUNT(*) AS count FROM projects`).get().count);
    const runCount = Number(this.db.prepare(`SELECT COUNT(*) AS count FROM runs`).get().count);
    const reviewCount = Number(
      this.db
        .prepare(`SELECT COUNT(*) AS count FROM tasks WHERE status = 'review'`)
        .get().count
    );

    const taskCountsRows = this.db
      .prepare(`SELECT status, COUNT(*) AS count FROM tasks GROUP BY status`)
      .all() as Array<{ status: TaskStatus; count: number }>;

    const taskCounts: Record<TaskStatus, number> = {
      inbox: 0,
      planned: 0,
      ready: 0,
      running: 0,
      review: 0,
      done: 0,
      blocked: 0
    };

    taskCountsRows.forEach((row) => {
      taskCounts[row.status] = Number(row.count);
    });

    return {
      projectCount,
      runCount,
      reviewCount,
      taskCounts
    };
  }
}
