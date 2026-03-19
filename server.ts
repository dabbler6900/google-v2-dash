import express, { Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { getOpenClawDashboardSnapshot } from './src/core/api/OpenClawDashboard.js';
import { ProjectOSStore, TaskStatus } from './src/v2/ProjectOSStore.js';

interface StreamEvent {
  id: string;
  type: string;
  payload: Record<string, any>;
  timestamp: string;
}

class EventHub {
  private readonly clients = new Set<Response>();
  private sequence = 0;

  subscribe(client: Response): void {
    this.clients.add(client);
  }

  unsubscribe(client: Response): void {
    this.clients.delete(client);
  }

  emit(type: string, payload: Record<string, any>): void {
    const event: StreamEvent = {
      id: `evt_${Date.now()}_${this.sequence += 1}`,
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    const body = `event: ${type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      client.write(body);
    }
  }
}

const PORT = Number(process.env.PORT ?? 3000);
const store = new ProjectOSStore(process.cwd());
const eventHub = new EventHub();

export function broadcastStateUpdate(type: string, payload?: any) {
  eventHub.emit(type, { payload: payload ?? null });
}

function flattenRuntimeSessions(snapshot: ReturnType<typeof getOpenClawDashboardSnapshot>) {
  return [
    ...snapshot.sessions.main.recent.map((session) => ({ source: 'main', ...session })),
    ...snapshot.sessions.opencode.recent.map((session) => ({ source: 'opencode', ...session }))
  ].sort((left, right) => Date.parse(right.updatedAt ?? '') - Date.parse(left.updatedAt ?? ''));
}

function parseTaskStatus(value: unknown): TaskStatus | undefined {
  const statuses: TaskStatus[] = ['inbox', 'planned', 'ready', 'running', 'review', 'done', 'blocked'];
  return typeof value === 'string' && statuses.includes(value as TaskStatus) ? (value as TaskStatus) : undefined;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/runtime/overview', (_req, res) => {
    const runtime = getOpenClawDashboardSnapshot();
    const workspace = store.getOverview();

    res.json({
      generatedAt: new Date().toISOString(),
      runtime,
      workspace
    });
  });

  app.get('/api/runtime/runs', (_req, res) => {
    const runtime = getOpenClawDashboardSnapshot();
    res.json({
      generatedAt: new Date().toISOString(),
      storedRuns: store.listRuns(100),
      runtimeSessions: flattenRuntimeSessions(runtime)
    });
  });

  app.get('/api/projects', (_req, res) => {
    res.json({
      projects: store.listProjects()
    });
  });

  app.post('/api/projects', (req, res) => {
    try {
      const name = String(req.body?.name ?? '').trim();
      if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      const project = store.createProject({
        name,
        description: req.body?.description,
        repoUrl: req.body?.repoUrl,
        workspacePath: req.body?.workspacePath,
        metadata: req.body?.metadata
      });

      eventHub.emit('project.created', { project });
      return res.status(201).json({ project });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/tasks', (req, res) => {
    try {
      const status = parseTaskStatus(req.query.status);
      const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
      const tasks = store.listTasks({ status, projectId });
      return res.json({ tasks });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tasks', (req, res) => {
    try {
      const projectId = String(req.body?.projectId ?? '').trim();
      const title = String(req.body?.title ?? '').trim();
      if (!projectId || !title) {
        return res.status(400).json({ error: 'projectId and title are required' });
      }

      const task = store.createTask({
        projectId,
        title,
        description: req.body?.description,
        type: req.body?.type,
        priority: req.body?.priority,
        status: parseTaskStatus(req.body?.status),
        assignee: req.body?.assignee,
        constraints: Array.isArray(req.body?.constraints) ? req.body.constraints : [],
        metadata: req.body?.metadata
      });

      eventHub.emit('task.created', { task });
      return res.status(201).json({ task });
    } catch (err: any) {
      const statusCode = err.message?.includes('Project not found') ? 404 : 500;
      return res.status(statusCode).json({ error: err.message });
    }
  });

  app.patch('/api/tasks/:id', (req, res) => {
    try {
      const task = store.updateTask(req.params.id, {
        title: typeof req.body?.title === 'string' ? req.body.title : undefined,
        description: typeof req.body?.description === 'string' ? req.body.description : undefined,
        type: typeof req.body?.type === 'string' ? req.body.type : undefined,
        priority: req.body?.priority,
        status: parseTaskStatus(req.body?.status),
        assignee: typeof req.body?.assignee === 'string' ? req.body.assignee : req.body?.assignee === null ? null : undefined,
        plan: typeof req.body?.plan === 'object' ? req.body.plan : undefined,
        constraints: Array.isArray(req.body?.constraints) ? req.body.constraints : undefined,
        metadata: typeof req.body?.metadata === 'object' ? req.body.metadata : undefined
      });

      eventHub.emit('task.updated', { task });
      return res.json({ task });
    } catch (err: any) {
      const statusCode = err.message?.includes('Task not found') ? 404 : 500;
      return res.status(statusCode).json({ error: err.message });
    }
  });

  app.post('/api/tasks/:id/plan', (req, res) => {
    try {
      const result = store.applyPlan(req.params.id, {
        summary: req.body?.summary,
        goals: Array.isArray(req.body?.goals) ? req.body.goals : [],
        constraints: Array.isArray(req.body?.constraints) ? req.body.constraints : [],
        steps: Array.isArray(req.body?.steps) ? req.body.steps : [],
        subtasks: Array.isArray(req.body?.subtasks) ? req.body.subtasks : []
      });

      eventHub.emit('task.planned', result);
      return res.json(result);
    } catch (err: any) {
      const statusCode = err.message?.includes('Task not found') ? 404 : 500;
      return res.status(statusCode).json({ error: err.message });
    }
  });

  app.post('/api/tasks/:id/execute', (req, res) => {
    try {
      const result = store.executeTask(req.params.id, {
        runtime: req.body?.runtime,
        sessionKey: req.body?.sessionKey,
        summary: req.body?.summary,
        metadata: req.body?.metadata
      });

      eventHub.emit('task.executed', result);
      return res.json(result);
    } catch (err: any) {
      const statusCode = err.message?.includes('Task not found') ? 404 : 500;
      return res.status(statusCode).json({ error: err.message });
    }
  });

  app.post('/api/tasks/:id/review', (req, res) => {
    try {
      const decision = req.body?.decision;
      if (!['approved', 'changes_requested', 'blocked'].includes(decision)) {
        return res.status(400).json({ error: 'decision must be approved, changes_requested, or blocked' });
      }

      const result = store.reviewTask(req.params.id, {
        runId: req.body?.runId ?? null,
        decision,
        evidence: typeof req.body?.evidence === 'object' ? req.body.evidence : {},
        notes: req.body?.notes
      });

      eventHub.emit('task.reviewed', result);
      return res.json(result);
    } catch (err: any) {
      const statusCode = err.message?.includes('Task not found') ? 404 : 500;
      return res.status(statusCode).json({ error: err.message });
    }
  });

  app.get('/api/events/stream', (_req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    });

    res.write(`event: ready\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
    eventHub.subscribe(res);

    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
    }, 15000);

    _req.on('close', () => {
      clearInterval(heartbeat);
      eventHub.unsubscribe(res);
      res.end();
    });
  });

  app.get('/api/admin/shutdown', (_req, res) => {
    res.json({ success: true, message: 'shutdown requested' });
    setTimeout(() => process.exit(0), 250);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
  }

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    const indexPath = path.join(process.cwd(), 'index.html');
    if (process.env.NODE_ENV === 'production') {
      return res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    }

    return res.sendFile(indexPath);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[v2] OpenClaw Forge server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[v2] failed to start server', err);
  process.exit(1);
});
