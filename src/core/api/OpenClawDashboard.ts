import fs from 'fs';
import path from 'path';

type JsonValue = Record<string, any>;

export interface OpenClawDashboardSnapshot {
  generatedAt: string;
  rootPath: string;
  config: {
    lastTouchedAt: string | null;
    gateway: {
      mode: string | null;
      bind: string | null;
      port: number | null;
      authMode: string | null;
      tailscaleMode: string | null;
    };
    agents: {
      defaultAgent: string | null;
      allowedAgents: string[];
      primaryModel: string | null;
      workspace: string | null;
    };
    tools: {
      profile: string | null;
      webSearchEnabled: boolean;
      webSearchProvider: string | null;
    };
    channels: Array<{ name: string; enabled: boolean }>;
    plugins: Array<{ name: string; enabled: boolean }>;
  };
  summary: {
    pairedDevices: number;
    pendingDevices: number;
    mainSessions: number;
    opencodeSessions: number;
    cronJobs: number;
    enabledCronJobs: number;
    recentAuditEvents: number;
    workspaceNotes: number;
  };
  sessions: {
    main: SessionGroupSummary;
    opencode: SessionGroupSummary;
  };
  cron: {
    jobs: CronJobSummary[];
  };
  devices: {
    paired: DeviceSummary[];
    pending: DeviceSummary[];
  };
  paths: PathSummary[];
  audit: AuditEventSummary[];
  warnings: string[];
}

interface SessionGroupSummary {
  count: number;
  recent: SessionSummary[];
}

interface SessionSummary {
  sessionKey: string;
  sessionId: string | null;
  label: string | null;
  updatedAt: string | null;
  source: string | null;
  spawnedBy: string | null;
  state: string | null;
  model: string | null;
  cwd: string | null;
}

interface CronJobSummary {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule: string | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastDurationMs: number | null;
}

interface DeviceSummary {
  deviceId: string;
  clientId: string | null;
  clientMode: string | null;
  platform: string | null;
  role: string | null;
  scopeCount: number;
  approvedAt: string | null;
  createdAt: string | null;
}

interface PathSummary {
  name: string;
  path: string;
  exists: boolean;
  childCount: number;
  modifiedAt: string | null;
}

interface AuditEventSummary {
  ts: string | null;
  source: string | null;
  event: string | null;
  result: string | null;
  cwd: string | null;
  gatewayModeAfter: string | null;
}

function resolveOpenClawRoot(startDir = process.cwd()): string {
  let current = path.resolve(startDir);

  for (let index = 0; index < 8; index += 1) {
    if (fs.existsSync(path.join(current, 'openclaw.json'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return path.resolve(startDir, '..', '..');
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readJsonLines(filePath: string, limit: number): AuditEventSummary[] {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) {
      return [];
    }

    return raw
      .split(/\r?\n/)
      .slice(-limit)
      .map((line) => {
        try {
          const parsed = JSON.parse(line);
          return {
            ts: toIso(parsed.ts),
            source: parsed.source ?? null,
            event: parsed.event ?? null,
            result: parsed.result ?? null,
            cwd: parsed.cwd ?? null,
            gatewayModeAfter: parsed.gatewayModeAfter ?? null
          };
        } catch {
          return null;
        }
      })
      .filter((entry): entry is AuditEventSummary => entry !== null)
      .reverse();
  } catch {
    return [];
  }
}

function toIso(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value === 'string' && value.trim()) {
    const time = Date.parse(value);
    if (!Number.isNaN(time)) {
      return new Date(time).toISOString();
    }
  }

  return null;
}

function getChildCount(targetPath: string): number {
  try {
    return fs.readdirSync(targetPath).length;
  } catch {
    return 0;
  }
}

function getModifiedAt(targetPath: string): string | null {
  try {
    return fs.statSync(targetPath).mtime.toISOString();
  } catch {
    return null;
  }
}

function truncateMiddle(value: string, maxLength = 64): string {
  if (value.length <= maxLength) {
    return value;
  }

  const head = Math.max(18, Math.floor(maxLength / 2) - 3);
  const tail = Math.max(12, Math.floor(maxLength / 2) - 6);
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function buildSessionSummary(entry: [string, JsonValue]): SessionSummary {
  const [sessionKey, session] = entry;
  const source =
    session.origin?.provider ??
    session.deliveryContext?.channel ??
    session.acp?.backend ??
    null;

  const cwd = session.acp?.cwd ?? session.acp?.runtimeOptions?.cwd ?? null;

  return {
    sessionKey,
    sessionId: session.sessionId ?? null,
    label: session.label ?? session.origin?.label ?? session.sessionKey ?? null,
    updatedAt: toIso(session.updatedAt),
    source,
    spawnedBy: session.spawnedBy ?? null,
    state: session.acp?.state ?? (session.abortedLastRun ? 'aborted' : 'active'),
    model: session.model ?? session.modelProvider ? `${session.modelProvider ?? ''}${session.model ? `/${session.model}` : ''}`.replace(/^\/|\/$/g, '') : null,
    cwd: cwd ? truncateMiddle(cwd) : null
  };
}

function readSessionGroup(rootPath: string, agentName: 'main' | 'opencode'): SessionGroupSummary {
  const filePath = path.join(rootPath, 'agents', agentName, 'sessions', 'sessions.json');
  const data = readJsonFile<Record<string, JsonValue>>(filePath, {});
  const recent = Object.entries(data)
    .sort(([, left], [, right]) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0))
    .slice(0, 10)
    .map(buildSessionSummary);

  return {
    count: Object.keys(data).length,
    recent
  };
}

function readCronJobs(rootPath: string): CronJobSummary[] {
  const filePath = path.join(rootPath, 'cron', 'jobs.json');
  const data = readJsonFile<{ jobs?: JsonValue[] }>(filePath, {});
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];

  return jobs
    .slice()
    .sort((left, right) => (right.updatedAtMs ?? 0) - (left.updatedAtMs ?? 0))
    .map((job) => ({
      id: job.id,
      name: job.name ?? 'Unnamed job',
      description: job.description ?? '',
      enabled: Boolean(job.enabled),
      schedule: job.schedule?.expr ?? null,
      lastRunAt: toIso(job.state?.lastRunAtMs),
      lastRunStatus: job.state?.lastRunStatus ?? null,
      lastDurationMs: typeof job.state?.lastDurationMs === 'number' ? job.state.lastDurationMs : null
    }));
}

function buildDeviceSummary(entry: [string, JsonValue]): DeviceSummary {
  const [deviceId, device] = entry;
  return {
    deviceId,
    clientId: device.clientId ?? null,
    clientMode: device.clientMode ?? null,
    platform: device.platform ?? null,
    role: device.role ?? null,
    scopeCount: Array.isArray(device.approvedScopes)
      ? device.approvedScopes.length
      : Array.isArray(device.scopes)
        ? device.scopes.length
        : 0,
    approvedAt: toIso(device.approvedAtMs),
    createdAt: toIso(device.createdAtMs)
  };
}

function readDevices(rootPath: string): { paired: DeviceSummary[]; pending: DeviceSummary[] } {
  const pairedPath = path.join(rootPath, 'devices', 'paired.json');
  const pendingPath = path.join(rootPath, 'devices', 'pending.json');

  const pairedRaw = readJsonFile<Record<string, JsonValue>>(pairedPath, {});
  const pendingRaw = readJsonFile<Record<string, JsonValue>>(pendingPath, {});

  return {
    paired: Object.entries(pairedRaw)
      .map(buildDeviceSummary)
      .sort((left, right) => Date.parse(right.approvedAt ?? right.createdAt ?? '') - Date.parse(left.approvedAt ?? left.createdAt ?? '')),
    pending: Object.entries(pendingRaw)
      .map(buildDeviceSummary)
      .sort((left, right) => Date.parse(right.createdAt ?? '') - Date.parse(left.createdAt ?? ''))
  };
}

function buildPathSummary(rootPath: string): PathSummary[] {
  const trackedPaths = [
    'agents',
    path.join('cron', 'runs'),
    'devices',
    'logs',
    'memory',
    'subagents',
    'telegram',
    'workspace',
    'workspace-opencode'
  ];

  return trackedPaths.map((relativePath) => {
    const absolutePath = path.join(rootPath, relativePath);
    return {
      name: relativePath,
      path: absolutePath,
      exists: fs.existsSync(absolutePath),
      childCount: getChildCount(absolutePath),
      modifiedAt: getModifiedAt(absolutePath)
    };
  });
}

function sanitizeConfig(config: JsonValue) {
  const channels = Object.entries(config.channels ?? {}).map(([name, channel]) => ({
    name,
    enabled: Boolean((channel as JsonValue).enabled)
  }));

  const plugins = Object.entries(config.plugins?.entries ?? {}).map(([name, plugin]) => ({
    name,
    enabled: Boolean((plugin as JsonValue).enabled)
  }));

  return {
    lastTouchedAt: toIso(config.meta?.lastTouchedAt),
    gateway: {
      mode: config.gateway?.mode ?? null,
      bind: config.gateway?.bind ?? null,
      port: typeof config.gateway?.port === 'number' ? config.gateway.port : null,
      authMode: config.gateway?.auth?.mode ?? null,
      tailscaleMode: config.gateway?.tailscale?.mode ?? null
    },
    agents: {
      defaultAgent: config.acp?.defaultAgent ?? null,
      allowedAgents: Array.isArray(config.acp?.allowedAgents) ? config.acp.allowedAgents : [],
      primaryModel: config.agents?.defaults?.model?.primary ?? null,
      workspace: config.agents?.defaults?.workspace ?? null
    },
    tools: {
      profile: config.tools?.profile ?? null,
      webSearchEnabled: Boolean(config.tools?.web?.search?.enabled),
      webSearchProvider: config.tools?.web?.search?.provider ?? null
    },
    channels,
    plugins
  };
}

function buildWarnings(snapshot: Omit<OpenClawDashboardSnapshot, 'warnings'>): string[] {
  const warnings: string[] = [];

  if (snapshot.summary.enabledCronJobs === 0) {
    warnings.push('All cron jobs are disabled, so the dashboard will only reflect passive state.');
  }

  if (snapshot.summary.pendingDevices > 0) {
    warnings.push(`${snapshot.summary.pendingDevices} device pairing request${snapshot.summary.pendingDevices === 1 ? '' : 's'} still need approval.`);
  }

  if (snapshot.summary.opencodeSessions > 25) {
    warnings.push(`OpenCode ACP session history is large (${snapshot.summary.opencodeSessions}); cleanup is probably overdue.`);
  }

  if (!snapshot.config.gateway.port) {
    warnings.push('Gateway configuration looks incomplete.');
  }

  return warnings;
}

export function getOpenClawDashboardSnapshot(): OpenClawDashboardSnapshot {
  const rootPath = resolveOpenClawRoot();
  const config = readJsonFile<JsonValue>(path.join(rootPath, 'openclaw.json'), {});
  const sessions = {
    main: readSessionGroup(rootPath, 'main'),
    opencode: readSessionGroup(rootPath, 'opencode')
  };
  const cronJobs = readCronJobs(rootPath);
  const devices = readDevices(rootPath);
  const audit = readJsonLines(path.join(rootPath, 'logs', 'config-audit.jsonl'), 12);
  const workspaceMemoryPath = path.join(rootPath, 'workspace', 'memory');
  const workspaceNotes = fs.existsSync(workspaceMemoryPath)
    ? fs.readdirSync(workspaceMemoryPath).filter((file) => file.endsWith('.md')).length
    : 0;

  const baseSnapshot = {
    generatedAt: new Date().toISOString(),
    rootPath,
    config: sanitizeConfig(config),
    summary: {
      pairedDevices: devices.paired.length,
      pendingDevices: devices.pending.length,
      mainSessions: sessions.main.count,
      opencodeSessions: sessions.opencode.count,
      cronJobs: cronJobs.length,
      enabledCronJobs: cronJobs.filter((job) => job.enabled).length,
      recentAuditEvents: audit.length,
      workspaceNotes
    },
    sessions,
    cron: {
      jobs: cronJobs
    },
    devices,
    paths: buildPathSummary(rootPath),
    audit
  };

  return {
    ...baseSnapshot,
    warnings: buildWarnings(baseSnapshot)
  };
}
