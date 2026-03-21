import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";

// Import core APIs
import { MCPRegistry } from "./src/core/mcp/MCPRegistry.js";
import { ApprovalEngine } from "./src/core/security/ApprovalEngine.js";
import { Telemetry } from "./src/core/telemetry/TraceContract.js";
import { AutomationInbox } from "./src/core/events/AutomationInbox.js";
import { TaskEngine } from "./src/core/engine/TaskEngine.js";
import { ProjectSoul } from "./src/core/soul/ProjectSoul.js";
import { QuarantineEngine } from "./src/core/security/QuarantineEngine.js";
import { FactoryEngine } from "./src/core/factory/FactoryEngine.js";
import { GuardrailEngine } from "./src/core/security/GuardrailEngine.js";
import { MissionControl } from "./src/core/soul/MissionControl.js";
import { Commander } from "./src/core/agents/Commander.js";
import { Ralph } from "./src/core/agents/Ralph.js";
import { TaskProcessor } from "./src/core/engine/TaskProcessor.js";
import { ProjectEngine } from "./src/core/engine/ProjectEngine.js";
import { ThinkingEngine } from "./src/core/engine/ThinkingEngine.js";
import { AgentCommBus } from "./src/core/events/AgentCommBus.js";
import { GatewayProxy } from "./src/core/gateway/GatewayProxy.js";
import { broadcastStateUpdate, clients } from "./src/core/events/broadcast.js";

// Initialize Engines
TaskEngine.init();
ProjectSoul.init();
FactoryEngine.init();
GuardrailEngine.init();
MissionControl.init();
Commander.init();
Ralph.init();
TaskProcessor.init();
ProjectEngine.init();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const LOGICAL_PORT = 6543; // OpenClaw Gateway Logical Port

  // Initialize System with real data
  MCPRegistry.discoverTools();
  
  // Initial system events
  AutomationInbox.emit({
    source: 'kernel',
    type: 'SYSTEM_BOOT',
    project: 'OpenClaw OS',
    severity: 'low',
    owner: 'SYSTEM',
    title: 'Kernel Initialized (Logical Port 6543)',
    summary: 'OpenClaw OS kernel has successfully booted. Gateway 6543 is online.',
    payload: { version: '1.0.0-alpha', logicalPort: 6543 },
    requiresApproval: false
  });

  // Initial goals
  ProjectSoul.defineGoal(
    "Establish Autonomous Baseline",
    "Ensure the system can triage and execute simple tasks without human intervention.",
    ["Triage 10 events", "Complete 5 tasks", "Maintain 100% uptime"]
  );

  // Initial tasks
  TaskEngine.createTask("Audit Security Protocols", "Review all current firewall rules and access control lists.", "SecurityScanner");
  TaskEngine.createTask("Optimize Database Queries", "Identify slow queries in the telemetry database and add indexes.", "DBAgent");
  TaskEngine.createTask("Refactor UI Components", "Break down main App.tsx into smaller, reusable components.", "Commander");
  TaskEngine.createTask("Spawn Subagent Ralph", "Spawn Ralph to handle deep feature extraction and task processing.", "Kernel");

  // Initial quarantine
  QuarantineEngine.quarantine('/tmp/suspicious_script.sh', 'Unknown signature detected by file_watcher.');

  app.use(express.json());

  // Middleware to inject Logical Port 6543 header
  app.use((req, res, next) => {
    res.setHeader('X-OpenClaw-Gateway', LOGICAL_PORT.toString());
    next();
  });

  // ==========================================
  // OPENCLAW OS MEGA STATE API (REAL)
  // ==========================================
  
  async function getSystemState() {
    const tasks = TaskEngine.getTasks();
    const inbox = AutomationInbox.getEvents();
    const approvals = ApprovalEngine.getPendingRequests();
    const audit = Telemetry.getHistory().slice().reverse();
    const mission = ProjectSoul.getMission();
    const goals = ProjectSoul.getGoals();
    const factory = FactoryEngine.getPipelineStats();
    const guardrails = GuardrailEngine.getRules();
    const projects = ProjectEngine.getProjects();
    const messages = AgentCommBus.getHistory();
    
    // Try to fetch real data from OpenClaw Gateway
    const gwHealth = await GatewayProxy.getHealth() as any;
    const gwStatus = await GatewayProxy.getStatus() as any;
    
    // Real-ish health metrics
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    
    return {
      health: { 
        status: gwHealth?.ok ? 'OPERATIONAL' : (gwHealth ? 'DEGRADED' : 'OFFLINE'), 
        cpu: gwStatus?.health?.cpu || `${(cpu.user / 1000000).toFixed(1)}%`, 
        mem: gwStatus?.health?.mem || `${(mem.rss / 1024 / 1024 / 1024).toFixed(1)}GB`, 
        uptime: gwStatus?.uptime || `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
        logicalPort: 6543,
        gatewayUrl: process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789',
        connected: !!gwHealth
      },
      guardrails: guardrails.map(r => ({
        id: r.id,
        description: r.description,
        enabled: r.enabled,
        type: r.type
      })),
      commander: { 
        mode: 'Autonomous', 
        mission: mission.northStar, 
        loop: 'observe → classify → act → verify' 
      },
      inbox: inbox.map(e => ({
        id: e.id,
        source: e.source,
        time: new Date(e.timestamp).toLocaleTimeString(),
        title: e.title,
        status: e.status === 'new' ? 'UNREAD' : 'TRIAGED'
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        owner: t.assignee
      })),
      projects,
      messages,
      agents: [
        { name: 'Commander', type: 'Orchestrator', status: 'ACTIVE', tasks: tasks.filter(t => t.assignee === 'Commander' && t.status !== 'DONE').length, color: 'cyber-blue' },
        { name: 'Ralph', type: 'Subagent', status: Ralph.getStatus().status, tasks: Ralph.getStatus().currentTask ? 1 : 0, color: 'cyber-orange' },
        { name: 'TaskProcessor', type: 'Operational', status: 'ACTIVE', tasks: tasks.filter(t => t.assignee === 'TaskProcessor' && t.status !== 'DONE').length, color: 'cyber-pink' },
        { name: 'ThinkingGateway', type: 'Cognitive', status: 'ACTIVE', tasks: tasks.filter(t => t.assignee === 'ThinkingGateway' && t.status !== 'DONE').length, color: 'cyber-sky' },
        { name: 'ProjectSoul', type: 'Creative', status: 'ACTIVE', tasks: tasks.filter(t => t.assignee === 'ProjectSoul' && t.status !== 'DONE').length, color: 'cyber-purple' },
        { name: 'SecurityScanner', type: 'Security', status: 'ACTIVE', tasks: tasks.filter(t => t.assignee === 'SecurityScanner' && t.status !== 'DONE').length, color: 'cyber-pink' },
        { name: 'DBAgent', type: 'Data', status: 'ACTIVE', tasks: tasks.filter(t => t.assignee === 'DBAgent' && t.status !== 'DONE').length, color: 'cyber-blue' }
      ],
      processor: TaskProcessor.getStatus(),
      mcp: MCPRegistry.getAllTools().map(t => ({
        name: t.name,
        permission: t.id === 'mcp-db-query' ? 'READ_ONLY' : (t.id === 'mcp-python-eval' ? 'REQUIRES_APPROVAL' : 'READ_WRITE'),
        status: t.status
      })),
      approvals: approvals.map((a, idx) => ({
        id: `app_${idx}`,
        risk: a.level,
        agent: a.agentId,
        tool: a.toolName,
        target: a.target || 'N/A'
      })),
      quarantine: QuarantineEngine.getItems().map(q => ({
        id: q.id,
        file: q.file,
        reason: q.reason,
        time: new Date(q.timestamp).toLocaleTimeString()
      })),
      audit: audit.map(a => ({
        time: new Date(a.timestamp || '').toLocaleTimeString(),
        agent: a.agentId,
        action: a.action
      })),
      memory: [
        { title: 'North Star', type: 'Mission', updated: mission.updatedAt },
        ...goals.map(g => ({
          title: g.title,
          type: 'Goal',
          updated: 'Just now'
        }))
      ],
      factory: {
        builds: FactoryEngine.getBuilds().slice(-5).map(b => ({
          id: b.id,
          status: b.status,
          time: new Date(b.startedAt).toLocaleTimeString()
        })),
        deployments: FactoryEngine.getDeployments().slice(-5).map(d => ({
          id: d.id,
          env: d.environment,
          status: d.status
        })),
        stats: factory
      }
    };
  }

  app.get("/api/system/state", async (req, res) => {
    res.json(await getSystemState());
  });

  app.get("/api/system/context", (req, res) => {
    res.type('text/markdown').send(MissionControl.generateSystemContext());
  });

  app.get("/api/system/guardrails", (req, res) => {
    res.json(GuardrailEngine.getRules());
  });

  // Agent Documentation API
  app.get("/api/agents/:name/doc", (req, res) => {
    const name = req.params.name;
    const docPath = path.join(process.cwd(), 'src', 'core', 'agents', 'docs', `${name}.md`);
    if (fs.existsSync(docPath)) {
      res.send(fs.readFileSync(docPath, 'utf-8'));
    } else {
      res.status(404).send(`# ${name}\nNo documentation found for this agent.`);
    }
  });

  app.post("/api/agents/:name/doc", (req, res) => {
    const name = req.params.name;
    const { content } = req.body;
    const docDir = path.join(process.cwd(), 'src', 'core', 'agents', 'docs');
    if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
    const docPath = path.join(docDir, `${name}.md`);
    fs.writeFileSync(docPath, content, 'utf-8');
    res.json({ success: true });
  });

  app.get("/api/system/context/file", (req, res) => {
    const context = MissionControl.generateSystemContext();
    const contextPath = path.join(process.cwd(), 'OPENCLAW_SYSTEM_CONTEXT.md');
    fs.writeFileSync(contextPath, context, 'utf-8');
    res.send(context);
  });

  app.post("/api/commander/reason", async (req, res) => {
    const { action, context } = req.body;
    const result = await Commander.reasonAboutAction(action, context || {});
    res.json(result);
  });

  /**
   * OPENCLAW THINKING GATEWAY (LOCAL)
   * This is the "brain" of the system, performing logic-based reasoning.
   */
  app.post("/api/system/thinking", async (req, res) => {
    const { action, context, systemContext, projectId, prompt } = req.body;
    
    // If it's a project generation request
    if (prompt) {
      let targetProjectId = projectId;
      if (!targetProjectId) {
        const project = ProjectEngine.createProject(
          prompt.split(' ').slice(0, 3).join(' '),
          `/src/${prompt.split(' ')[0].toLowerCase()}`,
          prompt
        );
        targetProjectId = project.id;
      }

      broadcastStateUpdate('THINKING_STARTED', { projectId: targetProjectId, prompt });
      const result = await ThinkingEngine.generateProjectPlan(targetProjectId);
      broadcastStateUpdate('THINKING_COMPLETED', { projectId: targetProjectId, ...result });
      return res.json({ success: true, projectId: targetProjectId, ...result });
    }

    // Perform deterministic reasoning using local engines
    const guardrailResult = GuardrailEngine.validateAction(action, context || {});
    
    if (!guardrailResult.allowed) {
      return res.json({
        allowed: false,
        reasoning: `Thinking Gateway Blocked: ${guardrailResult.reason}`,
        suggestions: ["Modify action to comply with system guardrails", "Check Mission Control for constraints"]
      });
    }

    // Simple logic-based reasoning for now
    const isDestructive = action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove') || action.toLowerCase().includes('destroy');
    const isSystemCore = action.toLowerCase().includes('/src/core') || action.toLowerCase().includes('kernel') || action.toLowerCase().includes('soul');

    if (isDestructive && isSystemCore) {
      return res.json({
        allowed: false,
        reasoning: "Thinking Gateway detected a destructive action targeting core system files. This violates the 'Maintain 100% uptime' goal.",
        suggestions: ["Perform a dry-run first", "Use a non-destructive alternative"]
      });
    }

    res.json({
      allowed: true,
      reasoning: "Thinking Gateway validated the action against current mission context and guardrails. No violations found.",
      suggestions: ["Log the contribution", "Monitor telemetry for state drift"]
    });
  });

  // REST APIs to mutate state
  app.post("/api/inbox/:id/triage", (req, res) => {
    AutomationInbox.updateEventStatus(req.params.id, 'routed');
    Telemetry.log({
      traceId: `triage_${req.params.id}`,
      agentId: 'User',
      eventType: 'STATE_MUTATION',
      action: `Manually triaged event: ${req.params.id}`,
      payload: { eventId: req.params.id }
    });
    res.json({ success: true });
  });

  app.post("/api/tasks", async (req, res) => {
    const { title, priority, description, assignee } = req.body;
    const task = await TaskEngine.createTask(title || 'New Task', description || '', assignee || 'Commander');
    if (priority) {
      const allTasks = TaskEngine.getTasks();
      const t = allTasks.find(x => x.id === task.id);
      if (t) t.priority = priority;
    }
    res.json({ success: true, taskId: task.id });
  });

  app.post("/api/approvals/:id/grant", (req, res) => {
    const approvals = ApprovalEngine.getPendingRequests();
    const idx = parseInt(req.params.id.split('_')[1]);
    const app = approvals[idx];
    if (app) {
      ApprovalEngine.grantApproval(app.agentId, app.toolName, app.target || '');
      Telemetry.log({
        traceId: `grant_${req.params.id}`,
        agentId: 'User',
        eventType: 'SECURITY_VIOLATION',
        action: `Granted approval for ${app.toolName}`,
        payload: { req: app }
      });
    }
    res.json({ success: true });
  });

  app.post("/api/approvals/:id/deny", (req, res) => {
    const approvals = ApprovalEngine.getPendingRequests();
    const idx = parseInt(req.params.id.split('_')[1]);
    const app = approvals[idx];
    if (app) {
      ApprovalEngine.denyApproval(app.agentId, app.toolName, app.target || '');
      Telemetry.log({
        traceId: `deny_${req.params.id}`,
        agentId: 'User',
        eventType: 'SECURITY_VIOLATION',
        action: `Denied approval for ${app.toolName}`,
        payload: { req: app }
      });
    }
    res.json({ success: true });
  });

  // ==========================================
  // REST APIs
  // ==========================================

  // Commander API
  app.post("/api/commander/execute", async (req, res) => {
    try {
      const { task: taskTitle } = req.body;
      const task = await TaskEngine.createTask(taskTitle, "Autonomous execution requested via Commander.");
      broadcastStateUpdate('KANBAN_UPDATE', TaskEngine.getTasks());
      res.json({ success: true, taskId: task.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Kanban API
  app.get("/api/kanban", (req, res) => {
    res.json(TaskEngine.getTasks());
  });

  app.post("/api/kanban", async (req, res) => {
    try {
      const { title, description, assignee } = req.body;
      const task = await TaskEngine.createTask(title, description, assignee);
      broadcastStateUpdate('KANBAN_UPDATE', TaskEngine.getTasks());
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });



  // Project Soul API: Goals & Context
  app.get("/api/soul/goals", (req, res) => {
    res.json(ProjectSoul.getGoals());
  });

  app.get("/api/soul/mission", (req, res) => {
    res.json(ProjectSoul.getMission());
  });

  app.post("/api/soul/mission", (req, res) => {
    const { northStar, constraints } = req.body;
    ProjectSoul.updateMission(northStar, constraints);
    res.json({ success: true });
  });

  app.post("/api/soul/goals", async (req, res) => {
    const { title, description, successCriteria } = req.body;
    const goal = await ProjectSoul.defineGoal(title, description, successCriteria || []);
    res.json(goal);
  });

  // ==========================================
  // AGENT API (For OpenClaw / Subagents)
  // ==========================================
  
  app.get("/api/agent/tasks/next", (req, res) => {
    const agentId = req.query.agentId as string || 'OPENCLAW';
    const task = TaskEngine.getNextAgentTask(agentId);
    if (!task) {
      res.status(404).json({ message: "No tasks available" });
    } else {
      res.json(task);
    }
  });

  app.post("/api/agent/tasks/:id/subtasks", async (req, res) => {
    try {
      const parentId = req.params.id;
      const { subtasks, agentId } = req.body; // Array of { title, description, priority, assignee }
      
      const created = [];
      for (const st of subtasks) {
        const task = await TaskEngine.createTask(
          st.title, 
          st.description || '', 
          st.assignee || agentId || 'OPENCLAW'
        );
        // Note: TaskEngine.createTask doesn't take parentId or priority yet, 
        // but we can add them to metadata or update the method.
        task.metadata.parentId = parentId;
        if (st.priority) task.priority = st.priority;
        created.push(task);
      }
      res.json({ success: true, created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // SOFTWARE FACTORY API
  // ==========================================
  
  app.get("/api/factory/builds", (req, res) => {
    res.json(FactoryEngine.getBuilds());
  });

  app.post("/api/factory/builds", async (req, res) => {
    const { commitHash } = req.body;
    const build = await FactoryEngine.startBuild(commitHash || `HEAD-${Math.random().toString(16).slice(2, 8)}`);
    res.json(build);
  });

  app.get("/api/factory/deployments", (req, res) => {
    res.json(FactoryEngine.getDeployments());
  });

  app.post("/api/factory/deployments", async (req, res) => {
    const { buildId, environment } = req.body;
    const deploy = await FactoryEngine.deploy(buildId, environment || 'STAGING');
    res.json(deploy);
  });

  app.get("/api/factory/contributions", (req, res) => {
    res.json(FactoryEngine.getContributions());
  });

  app.post("/api/factory/contributions", (req, res) => {
    const { agentId, action, impact } = req.body;
    FactoryEngine.logContribution(agentId || 'UNKNOWN', action || 'Performed action', impact || 'MEDIUM');
    res.json({ success: true });
  });

  // ==========================================
  // SYSTEM STATE & OBSERVABILITY API
  // ==========================================

  app.get("/api/events", (req, res) => {
    res.json(Telemetry.getHistory().reverse().slice(0, 50)); // Last 50 events
  });

  app.get("/api/state", (req, res) => {
    res.json({ content: "System state is now managed dynamically via FactoryEngine and Core Engines." });
  });



  // MCP API
  app.get("/api/mcp", async (req, res) => {
    try {
      const tools = await MCPRegistry.discoverTools();
      res.json(tools);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Approvals API
  app.get("/api/approvals", (req, res) => {
    res.json(ApprovalEngine.getPendingRequests());
  });

  app.post("/api/approvals/grant", (req, res) => {
    const { agentId, toolName, target } = req.body;
    ApprovalEngine.grantApproval(agentId, toolName, target);
    res.json({ success: true });
  });

  app.post("/api/approvals/deny", (req, res) => {
    const { agentId, toolName, target } = req.body;
    ApprovalEngine.denyApproval(agentId, toolName, target);
    res.json({ success: true });
  });



  // Telemetry API
  app.get("/api/telemetry", (req, res) => {
    res.json(Telemetry.getHistory());
  });

  // Automation Inbox API
  app.get("/api/automation/events", (req, res) => {
    res.json(AutomationInbox.getEvents());
  });

  app.post("/api/automation/events", (req, res) => {
    try {
      const event = AutomationInbox.emit(req.body);
      res.json(event);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Agent Communication API
  app.post("/api/agent/messages", (req, res) => {
    try {
      const { sender, recipient, type, payload, priority, traceId } = req.body;
      const message = AgentCommBus.publish({
        sender: sender || 'SYSTEM',
        recipient: recipient || 'all',
        type: type || 'BROADCAST',
        payload: payload || {},
        priority: priority || 'low',
        traceId
      });
      res.json(message);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // Vite Middleware for Development
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  // Create HTTP server
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Attach WebSocket server
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
  });

  setTimeout(() => {
    AgentCommBus.publish({
      sender: 'Ralph',
      recipient: 'Commander',
      type: 'STATUS',
      payload: { text: "Deep feature extraction complete for Project Alpha. Ready for task assignment." },
      priority: 'medium'
    });
  }, 3000);

  setTimeout(() => {
    AgentCommBus.publish({
      sender: 'Commander',
      recipient: 'all',
      type: 'BROADCAST',
      payload: { text: "System-wide security sweep initiated. All agents report status." },
      priority: 'high'
    });
  }, 7000);

  // Emit sample events
  setTimeout(() => {
    AutomationInbox.emit({
      source: 'watcher',
      type: 'watcher.diff',
      project: 'openclaw-os',
      severity: 'medium',
      owner: 'architect',
      title: 'Protected file modified',
      summary: 'Detected changes in /docs/OPENCLAW_BLUEPRINT.md',
      payload: { target: '/docs/OPENCLAW_BLUEPRINT.md' },
      requiresApproval: true
    });
  }, 2000);

  setTimeout(() => {
    AutomationInbox.emit({
      source: 'cron',
      type: 'qa.smoke',
      project: 'openclaw-os',
      severity: 'low',
      owner: 'tester',
      title: 'Hourly smoke test run',
      summary: 'Cron triggered smoke test suite for core dashboard routes.',
      payload: { suite: 'smoke-core', target: 'central-control' },
      requiresApproval: false
    });
  }, 5000);
}

startServer();
