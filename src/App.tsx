import { CheckCircle2, FolderPlus, GitBranch, Moon, Play, RefreshCw, Sparkles, Sun, TriangleAlert } from 'lucide-react';
import React, { startTransition, useEffect, useEffectEvent, useState } from 'react';
import { ThemeProvider, useTheme } from './components/theme';

type TabKey = 'command' | 'projects' | 'planner' | 'board' | 'runs' | 'runtime' | 'review';
type TaskStatus = 'inbox' | 'planned' | 'ready' | 'running' | 'review' | 'done' | 'blocked';

interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  repoUrl: string | null;
  workspacePath: string | null;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface TaskRecord {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: TaskStatus;
  plan: Record<string, any> | null;
}

interface RunRecord {
  id: string;
  taskId: string;
  title: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'needs_review';
  runtime: string;
  sessionKey: string | null;
  updatedAt: string;
}

interface RuntimeOverview {
  generatedAt: string;
  runtime: {
    config: {
      gateway: { mode: string | null; port: number | null; bind: string | null; authMode: string | null };
      agents: { defaultAgent: string | null; primaryModel: string | null; workspace: string | null };
    };
    summary: {
      pairedDevices: number;
      mainSessions: number;
      opencodeSessions: number;
      cronJobs: number;
      enabledCronJobs: number;
    };
    warnings: string[];
    audit: Array<{ ts: string | null; event: string | null; cwd: string | null }>;
  };
  workspace: {
    projectCount: number;
    runCount: number;
    reviewCount: number;
    taskCounts: Record<TaskStatus, number>;
  };
}

interface RuntimeRunsResponse {
  storedRuns: RunRecord[];
  runtimeSessions: Array<{ source: string; sessionKey: string; label: string | null; updatedAt: string | null; state: string | null; model: string | null; cwd: string | null }>;
}

const tabs: TabKey[] = ['command', 'projects', 'planner', 'board', 'runs', 'runtime', 'review'];

function formatDate(value: string | null): string {
  if (!value) return 'Never';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function ThemeToggle() {
  const { resolvedTheme, theme, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)]">
      <span className="inline-flex items-center gap-2">{resolvedTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}{theme}</span>
    </button>
  );
}

function AppShell() {
  const [tab, setTab] = useState<TabKey>('command');
  const [overview, setOverview] = useState<RuntimeOverview | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [runs, setRuns] = useState<RuntimeRunsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [projectForm, setProjectForm] = useState({ name: '', description: '', repoUrl: '', workspacePath: '' });
  const [taskForm, setTaskForm] = useState({ projectId: '', title: '', description: '', type: 'feature', priority: 'medium' });
  const [planTaskId, setPlanTaskId] = useState('');
  const [planSummary, setPlanSummary] = useState('');
  const [planGoals, setPlanGoals] = useState('');
  const [planSteps, setPlanSteps] = useState('');
  const [planConstraints, setPlanConstraints] = useState('');
  const [planSubtasks, setPlanSubtasks] = useState('');

  const loadAll = useEffectEvent(async (background: boolean) => {
    background ? setRefreshing(true) : setLoading(true);
    try {
      const [overviewRes, projectsRes, tasksRes, runsRes] = await Promise.all([fetch('/api/runtime/overview'), fetch('/api/projects'), fetch('/api/tasks'), fetch('/api/runtime/runs')]);
      if (!overviewRes.ok || !projectsRes.ok || !tasksRes.ok || !runsRes.ok) throw new Error('Failed to load dashboard endpoints');
      const nextOverview = await overviewRes.json() as RuntimeOverview;
      const nextProjects = await projectsRes.json() as { projects: ProjectRecord[] };
      const nextTasks = await tasksRes.json() as { tasks: TaskRecord[] };
      const nextRuns = await runsRes.json() as RuntimeRunsResponse;
      startTransition(() => {
        setOverview(nextOverview);
        setProjects(nextProjects.projects);
        setTasks(nextTasks.tasks);
        setRuns(nextRuns);
        setError(null);
      });
    } catch (err: any) {
      setError(err.message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  });

  useEffect(() => {
    loadAll(false);
    const source = new EventSource('/api/events/stream');
    source.onmessage = () => loadAll(true);
    source.addEventListener('project.created', () => loadAll(true));
    source.addEventListener('task.created', () => loadAll(true));
    source.addEventListener('task.updated', () => loadAll(true));
    source.addEventListener('task.planned', () => loadAll(true));
    source.addEventListener('task.executed', () => loadAll(true));
    source.addEventListener('task.reviewed', () => loadAll(true));
    return () => source.close();
  }, [loadAll]);

  useEffect(() => {
    if (!taskForm.projectId && projects[0]) setTaskForm((current) => ({ ...current, projectId: projects[0].id }));
    if (!planTaskId && tasks[0]) setPlanTaskId(tasks[0].id);
  }, [projects, tasks, taskForm.projectId, planTaskId]);

  const call = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(payload.error);
    }
    return response;
  };

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault();
    await call('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(projectForm) });
    setProjectForm({ name: '', description: '', repoUrl: '', workspacePath: '' });
    loadAll(true);
  };

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();
    await call('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskForm) });
    setTaskForm((current) => ({ ...current, title: '', description: '' }));
    loadAll(true);
  };

  const planTask = async (event: React.FormEvent) => {
    event.preventDefault();
    await call(`/api/tasks/${planTaskId}/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: planSummary, goals: splitLines(planGoals), steps: splitLines(planSteps), constraints: splitLines(planConstraints), subtasks: splitLines(planSubtasks).map((title) => ({ title, type: 'task', priority: 'medium' })) }) });
    setPlanSummary('');
    setPlanGoals('');
    setPlanSteps('');
    setPlanConstraints('');
    setPlanSubtasks('');
    loadAll(true);
  };

  const patchTask = async (taskId: string, body: Record<string, any>) => {
    await call(`/api/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    loadAll(true);
  };

  const executeTask = async (taskId: string) => {
    await call(`/api/tasks/${taskId}/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runtime: 'openclaw', summary: 'Queued from OpenClaw Forge', metadata: { source: 'dashboard' } }) });
    loadAll(true);
  };

  const reviewTask = async (taskId: string, decision: 'approved' | 'changes_requested' | 'blocked') => {
    await call(`/api/tasks/${taskId}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision, evidence: { actor: 'dashboard' } }) });
    loadAll(true);
  };

  const groupedTasks: Record<TaskStatus, TaskRecord[]> = { inbox: [], planned: [], ready: [], running: [], review: [], done: [], blocked: [] };
  tasks.forEach((task) => groupedTasks[task.status].push(task));

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-white/10 bg-[var(--bg-secondary)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">OpenClaw Forge v2</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">API-led project planning and execution.</h1>
              <p className="mt-3 max-w-3xl text-sm text-[var(--text-secondary)]">Intent becomes projects, tasks, runs, and reviews. Markdown can support memory, but the dashboard runs on structured state.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => loadAll(true)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)]">{refreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Refresh'}</button>
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
            <span>{overview?.workspace.projectCount ?? 0} projects</span>
            <span>{overview?.workspace.runCount ?? 0} runs</span>
            <span>{(overview?.runtime.summary.mainSessions ?? 0) + (overview?.runtime.summary.opencodeSessions ?? 0)} sessions</span>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-full border px-4 py-2 text-sm ${tab === item ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100' : 'border-white/10 bg-white/5 text-[var(--text-secondary)]'}`}>{item}</button>
          ))}
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100"><span className="inline-flex items-center gap-2"><TriangleAlert className="h-4 w-4" />{error}</span></div> : null}
        {loading && !overview ? <div className="mt-6 rounded-2xl border border-white/10 bg-[var(--bg-secondary)] p-8 text-center text-[var(--text-secondary)]">Loading v2 dashboard...</div> : null}

        {overview ? (
          <main className="mt-6 space-y-6">
            {tab === 'command' ? <section className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6 text-sm text-[var(--text-secondary)]"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><Sparkles className="mb-3 h-5 w-5 text-cyan-300" /><div className="font-medium text-[var(--text-primary)]">Command</div><div className="mt-2">Use the dashboard as a project manager, not a giant chat log.</div></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><GitBranch className="mb-3 h-5 w-5 text-cyan-300" /><div className="font-medium text-[var(--text-primary)]">Planner</div><div className="mt-2">Break goals into steps, constraints, and executable subtasks.</div></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><Play className="mb-3 h-5 w-5 text-cyan-300" /><div className="font-medium text-[var(--text-primary)]">Execution</div><div className="mt-2">Queue work into OpenClaw and verify by review, not by vibes.</div></div></div></section> : null}

            {tab === 'projects' ? <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><div className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6"><h2 className="text-xl font-semibold">Create project</h2><form className="mt-4 space-y-3" onSubmit={createProject}><input className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" placeholder="Project name" value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} /><textarea className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" rows={4} placeholder="Description" value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} /><input className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" placeholder="Repo URL" value={projectForm.repoUrl} onChange={(event) => setProjectForm({ ...projectForm, repoUrl: event.target.value })} /><input className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" placeholder="Workspace path" value={projectForm.workspacePath} onChange={(event) => setProjectForm({ ...projectForm, workspacePath: event.target.value })} /><button className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-100"><span className="inline-flex items-center gap-2"><FolderPlus className="h-4 w-4" />Create project</span></button></form></div><div className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6"><h2 className="text-xl font-semibold">Project registry</h2><div className="mt-4 space-y-3">{projects.map((project) => <div key={project.id} className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{project.name}</div><div className="mt-1 text-sm text-[var(--text-tertiary)]">{project.description || 'No description yet.'}</div></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]">{project.status}</span></div><div className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]"><div>Repo: {project.repoUrl ?? 'n/a'}</div><div>Workspace: {project.workspacePath ?? 'n/a'}</div><div>Updated: {formatDate(project.updatedAt)}</div></div></div>)}{projects.length === 0 ? <div className="text-sm text-[var(--text-tertiary)]">No projects yet.</div> : null}</div></div></section> : null}

            {tab === 'planner' ? <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"><div className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6"><h2 className="text-xl font-semibold">Task intake</h2><form className="mt-4 space-y-3" onSubmit={createTask}><select className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" value={taskForm.projectId} onChange={(event) => setTaskForm({ ...taskForm, projectId: event.target.value })}><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><input className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" placeholder="Task title" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /><textarea className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" rows={4} placeholder="Task description" value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} /><div className="grid gap-3 md:grid-cols-2"><select className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" value={taskForm.type} onChange={(event) => setTaskForm({ ...taskForm, type: event.target.value })}><option value="feature">feature</option><option value="bug">bug</option><option value="research">research</option><option value="qa">qa</option><option value="docs">docs</option></select><select className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}><option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="critical">critical</option></select></div><button className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-100">Create task</button></form></div><div className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6"><h2 className="text-xl font-semibold">Plan task</h2><form className="mt-4 space-y-3" onSubmit={planTask}><select className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" value={planTaskId} onChange={(event) => setPlanTaskId(event.target.value)}><option value="">Select task</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select><textarea className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" rows={3} placeholder="Plan summary" value={planSummary} onChange={(event) => setPlanSummary(event.target.value)} /><textarea className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" rows={3} placeholder="Goals, one per line" value={planGoals} onChange={(event) => setPlanGoals(event.target.value)} /><textarea className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" rows={4} placeholder="Steps, one per line" value={planSteps} onChange={(event) => setPlanSteps(event.target.value)} /><textarea className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" rows={3} placeholder="Constraints, one per line" value={planConstraints} onChange={(event) => setPlanConstraints(event.target.value)} /><textarea className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm" rows={4} placeholder="Subtasks, one title per line" value={planSubtasks} onChange={(event) => setPlanSubtasks(event.target.value)} /><button className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-100">Save plan</button></form></div></section> : null}

            {tab === 'board' ? <section className="grid gap-4 xl:grid-cols-7">{(Object.keys(groupedTasks) as TaskStatus[]).map((status) => <div key={status} className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-4"><h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{status}</h2><div className="mt-4 space-y-3">{groupedTasks[status].map((task) => <div key={task.id} className="rounded-2xl border border-white/10 bg-black/10 p-3"><div className="font-medium">{task.title}</div><div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{task.priority}</div><div className="mt-2 text-sm text-[var(--text-tertiary)]">{task.description || 'No description'}</div><div className="mt-3 flex flex-wrap gap-2 text-xs"><button type="button" className="rounded-full border border-white/10 px-2.5 py-1" onClick={() => patchTask(task.id, { status: 'ready' })}>ready</button><button type="button" className="rounded-full border border-white/10 px-2.5 py-1" onClick={() => executeTask(task.id)}>run</button><button type="button" className="rounded-full border border-white/10 px-2.5 py-1" onClick={() => patchTask(task.id, { status: 'review' })}>review</button></div></div>)}</div></div>)}</section> : null}

            {tab === 'runs' ? <section className="grid gap-6 xl:grid-cols-2"><div className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6"><h2 className="text-xl font-semibold">Stored runs</h2><div className="mt-4 space-y-3">{runs?.storedRuns.map((run) => <div key={run.id} className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{run.title}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{run.runtime} · {formatDate(run.updatedAt)}</div></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]">{run.status}</span></div><div className="mt-2 text-xs text-[var(--text-muted)]">Session: {run.sessionKey ?? 'not linked'}</div></div>)}{!runs?.storedRuns.length ? <div className="text-sm text-[var(--text-tertiary)]">No runs yet.</div> : null}</div></div><div className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6"><h2 className="text-xl font-semibold">Runtime sessions</h2><div className="mt-4 space-y-3">{runs?.runtimeSessions.map((session) => <div key={session.sessionKey} className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{session.label ?? session.sessionKey}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{session.source} · {formatDate(session.updatedAt)}</div></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]">{session.state ?? 'idle'}</span></div><div className="mt-2 text-sm text-[var(--text-tertiary)]">{session.cwd ?? 'n/a'}</div></div>)}</div></div></section> : null}

            {tab === 'runtime' ? <section className="grid gap-6 xl:grid-cols-2"><div className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6"><h2 className="text-xl font-semibold">Gateway</h2><div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)]"><div>Mode: {overview.runtime.config.gateway.mode ?? 'n/a'}</div><div>Port: {overview.runtime.config.gateway.port ?? 'n/a'}</div><div>Bind: {overview.runtime.config.gateway.bind ?? 'n/a'}</div><div>Auth: {overview.runtime.config.gateway.authMode ?? 'n/a'}</div><div>Default agent: {overview.runtime.config.agents.defaultAgent ?? 'n/a'}</div><div>Model: {overview.runtime.config.agents.primaryModel ?? 'n/a'}</div></div></div><div className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6"><h2 className="text-xl font-semibold">Warnings and audit</h2><div className="mt-4 space-y-3">{overview.runtime.warnings.map((warning) => <div key={warning} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">{warning}</div>)}{overview.runtime.audit.slice(0, 6).map((event, index) => <div key={`${event.ts ?? 'unknown'}_${index}`} className="rounded-2xl border border-white/10 bg-black/10 p-3 text-sm text-[var(--text-secondary)]"><div className="font-medium">{event.event ?? 'Unknown event'}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{formatDate(event.ts)} · {event.cwd ?? 'n/a'}</div></div>)}</div></div></section> : null}

            {tab === 'review' ? <section className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6"><h2 className="text-xl font-semibold">Review queue</h2><div className="mt-4 space-y-3">{tasks.filter((task) => task.status === 'review').map((task) => <div key={task.id} className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{task.title}</div><div className="mt-1 text-sm text-[var(--text-tertiary)]">{task.description || 'No description provided.'}</div></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]">review</span></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100" onClick={() => reviewTask(task.id, 'approved')}><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Approve</span></button><button type="button" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)]" onClick={() => reviewTask(task.id, 'changes_requested')}>Request changes</button><button type="button" className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100" onClick={() => reviewTask(task.id, 'blocked')}>Block</button></div></div>)}{!tasks.some((task) => task.status === 'review') ? <div className="text-sm text-[var(--text-tertiary)]">Nothing is waiting for review.</div> : null}</div></section> : null}
          </main>
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
