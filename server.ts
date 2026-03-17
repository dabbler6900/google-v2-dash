import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import { WebSocketServer, WebSocket } from "ws";

// Import core APIs
import { KanbanBoard } from "./src/core/tasks/KanbanBoard.js";
import { DocManager } from "./src/core/docs/DocManager.js";
import { MCPRegistry } from "./src/core/mcp/MCPRegistry.js";
import { ApprovalEngine } from "./src/core/security/ApprovalEngine.js";
import { GoogleAuth } from "./src/core/integrations/GoogleAuth.js";
import { GoogleCalendar } from "./src/core/integrations/GoogleCalendar.js";
import { Telemetry } from "./src/core/telemetry/TraceContract.js";
import { CommanderAgent } from "./src/core/agents/Commander.js";
import { AutomationInbox } from "./src/core/events/AutomationInbox.js";

const upload = multer({ dest: 'docs/' });

// WebSocket clients
const clients = new Set<WebSocket>();

export function broadcastStateUpdate(type: string, payload?: any) {
  const message = JSON.stringify({ type, payload });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // REST APIs
  // ==========================================

  // Commander API
  app.post("/api/commander/execute", async (req, res) => {
    try {
      const { task } = req.body;
      const agent = new CommanderAgent();
      // Run in background
      agent.executeTask(task).catch(err => console.error("Commander failed:", err));
      res.json({ success: true, message: "Task execution started" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Kanban API
  app.get("/api/kanban", (req, res) => {
    res.json(KanbanBoard.getTasks());
  });

  app.post("/api/kanban", async (req, res) => {
    try {
      const { title, description, assignee, parentId, priority } = req.body;
      const task = await KanbanBoard.createTask(title, description, assignee, parentId, priority);
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/kanban/:id", async (req, res) => {
    try {
      const { status, agentId, assignee, priority } = req.body;
      const updates: any = {};
      if (status) updates.status = status;
      if (assignee) updates.assignee = assignee;
      if (priority) updates.priority = priority;
      
      await KanbanBoard.updateTask(req.params.id, updates, agentId || 'HUMAN');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // AGENT API (For OpenClaw / Subagents)
  // ==========================================
  
  app.get("/api/agent/tasks/next", (req, res) => {
    const agentId = req.query.agentId as string || 'OPENCLAW';
    const task = KanbanBoard.getNextAgentTask(agentId);
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
        const task = await KanbanBoard.createTask(
          st.title, 
          st.description || '', 
          st.assignee || agentId || 'OPENCLAW', 
          parentId, 
          st.priority || 'MEDIUM'
        );
        created.push(task);
      }
      res.json({ success: true, created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // SYSTEM STATE & OBSERVABILITY API
  // ==========================================

  app.get("/api/events", (req, res) => {
    res.json(Telemetry.getHistory().reverse().slice(0, 50)); // Last 50 events
  });

  app.get("/api/state", (req, res) => {
    try {
      const statePath = path.join(process.cwd(), 'CURRENT_STATE.md');
      if (fs.existsSync(statePath)) {
        res.json({ content: fs.readFileSync(statePath, 'utf-8') });
      } else {
        res.json({ content: "No CURRENT_STATE.md found." });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/commander/status", (req, res) => {
    // Mocked live state for the Commander
    res.json({
      identity: "Commander",
      mission: "Stabilize OpenClaw OS control loop",
      strategy: "Finish state backbone before expanding tools",
      activeDelegation: "Architect -> registry design",
      risk: "State drift between docs and dashboard",
      needsHumanInput: false,
      status: "Active",
      mode: "Autonomous",
      currentProject: "OpenClaw OS",
      health: "Healthy"
    });
  });

  // Docs API
  app.get("/api/docs", async (req, res) => {
    try {
      const docs = await DocManager.listDocs();
      res.json(docs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/docs", async (req, res) => {
    try {
      const { filename, content, agentId } = req.body;
      await DocManager.saveDoc(filename, content, agentId || 'HUMAN');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/docs/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const content = fs.readFileSync(req.file.path, 'utf8');
      await DocManager.saveDoc(req.file.originalname, content, 'HUMAN');
      // Clean up the temp file
      fs.unlinkSync(req.file.path);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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

  // Integrations API
  app.get("/api/integrations/google/url", (req, res) => {
    const origin = `${req.protocol}://${req.get('host')}`;
    res.json({ url: GoogleAuth.getAuthUrl(origin) });
  });

  app.get("/api/integrations/google/session", (req, res) => {
    res.json(GoogleAuth.getSession());
  });

  app.post("/api/integrations/google/callback", async (req, res) => {
    try {
      const { code } = req.body;
      await GoogleAuth.handleCallback(code);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/integrations/google/calendar/events", async (req, res) => {
    try {
      const events = await GoogleCalendar.listEvents();
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/integrations/google/calendar/events", async (req, res) => {
    try {
      const event = await GoogleCalendar.createEvent(req.body);
      res.json(event);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
