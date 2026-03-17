import { Activity, CheckCircle, Cpu, Database, GitMerge, Shield, Terminal as TerminalIcon, ListTree, History, Wrench, ChevronRight, Ban, LayoutDashboard, ListFilter, ShieldAlert, Plus, X, AlertTriangle, FileWarning, Archive, Trash2, Fingerprint, Play, KanbanSquare, FileText, Box, CheckSquare, Mail, Calendar, Lock, Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'planning' | 'quarantine' | 'audit' | 'configs' | 'kanban' | 'docs' | 'mcp' | 'approvals' | 'integrations' | 'calendar'>('overview');
  const [registry, setRegistry] = useState<string>('Loading...');
  const [guardrails, setGuardrails] = useState<string>('Loading...');
  const [workflows, setWorkflows] = useState<string>('Loading...');
  const [tools, setTools] = useState<string>('Loading...');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  
  // API States
  const [kanbanTasks, setKanbanTasks] = useState<any[]>([]);
  const [docsList, setDocsList] = useState<string[]>([]);
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [googleSession, setGoogleSession] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [systemEvents, setSystemEvents] = useState<any[]>([]);
  const [commanderStatus, setCommanderStatus] = useState<any>(null);
  const [systemState, setSystemState] = useState<string>('Loading...');
  
  // Banning State
  interface BannedTask {
    name: string;
    description: string;
  }
  const [bannedTasks, setBannedTasks] = useState<BannedTask[]>([
    { name: "delete_root_directory", description: "Prevents accidental deletion of the entire workspace." },
    { name: "bypass_dry_run", description: "Forces all structural changes to be previewed first." },
    { name: "force_push_master", description: "Protects the main branch from destructive overwrites." }
  ]);
  const [bannedProjects, setBannedProjects] = useState<string[]>(["legacy_test_project", "unauthorized_crypto_miner"]);
  const [newTask, setNewTask] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newProject, setNewProject] = useState('');

  // Drift & Dry-Run State
  const [quarantinedFiles, setQuarantinedFiles] = useState([
    { path: "/random_test_folder", reason: "Unknown top-level directory", risk: "high" },
    { path: "/dashboards/CENTRAL_CONTROL/temp_backup.zip", reason: "Unauthorized archive in protected project", risk: "medium" },
    { path: "/SOUL_copy.md", reason: "Duplicate governance file", risk: "high" }
  ]);

  const [dryRuns, setDryRuns] = useState([
    { id: "wi_042", action: "MOVE", target: "/SOUL_copy.md -> /archive/SOUL_copy.md", risk: "low", status: "pending_approval" },
    { id: "wi_043", action: "DELETE", target: "/random_test_folder", risk: "high", status: "pending_approval" }
  ]);

  useEffect(() => {
    Promise.all([
      fetch('/config/registry.yml').then(res => res.text()),
      fetch('/config/guardrails.yml').then(res => res.text()),
      fetch('/config/workflows.yml').then(res => res.text()),
      fetch('/config/tools.yml').then(res => res.text())
    ]).then(([regData, guardData, wfData, toolData]) => {
      setRegistry(regData);
      setGuardrails(guardData);
      setWorkflows(wfData);
      setTools(toolData);
    }).catch(err => {
      console.error("Failed to load configs", err);
    });

    // Fetch API Data
    const fetchApiData = async () => {
      try {
        const [kanbanRes, docsRes, mcpRes, approvalsRes, sessionRes, telemetryRes, calendarRes, eventsRes, stateRes, commanderRes, automationRes] = await Promise.all([
          fetch('/api/kanban').then(res => res.json()).catch(() => []),
          fetch('/api/docs').then(res => res.json()).catch(() => []),
          fetch('/api/mcp').then(res => res.json()).catch(() => []),
          fetch('/api/approvals').then(res => res.json()).catch(() => []),
          fetch('/api/integrations/google/session').then(res => res.json()).catch(() => null),
          fetch('/api/telemetry').then(res => res.json()).catch(() => []),
          fetch('/api/integrations/google/calendar/events').then(res => res.json()).catch(() => []),
          fetch('/api/events').then(res => res.json()).catch(() => []),
          fetch('/api/state').then(res => res.json()).catch(() => ({ content: 'Error loading state' })),
          fetch('/api/commander/status').then(res => res.json()).catch(() => null),
          fetch('/api/automation/events').then(res => res.json()).catch(() => [])
        ]);
        
        setKanbanTasks(Array.isArray(kanbanRes) ? kanbanRes : []);
        setDocsList(Array.isArray(docsRes) ? docsRes : []);
        setMcpTools(Array.isArray(mcpRes) ? mcpRes : []);
        setPendingApprovals(Array.isArray(approvalsRes) ? approvalsRes : []);
        setGoogleSession(sessionRes);
        setAuditLogs(Array.isArray(telemetryRes) ? telemetryRes.reverse() : []);
        setCalendarEvents(Array.isArray(calendarRes) ? calendarRes : []);
        
        // Merge system events and automation events
        const mergedEvents = [...(Array.isArray(eventsRes) ? eventsRes : []), ...(Array.isArray(automationRes) ? automationRes : [])]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50);
        setSystemEvents(mergedEvents);
        
        setSystemState(stateRes?.content || 'Loading...');
        setCommanderStatus(commanderRes);
      } catch (err) {
        console.error("Failed to fetch API data", err);
      }
    };

    fetchApiData();
    // Poll every 5 seconds for things not covered by websockets
    const interval = setInterval(fetchApiData, 5000);

    // WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'KANBAN_UPDATE') {
          setKanbanTasks(Array.isArray(data.payload) ? data.payload : []);
        } else if (data.type === 'TELEMETRY_UPDATE' || data.type === 'AUTOMATION_EVENT') {
          setSystemEvents(prev => [data.payload, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50));
          if (data.type === 'TELEMETRY_UPDATE') {
            setAuditLogs(prev => [data.payload, ...prev]);
          }
        } else if (data.type === 'APPROVALS_UPDATE') {
          setPendingApprovals(Array.isArray(data.payload) ? data.payload : []);
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'overview') return;
    const bootSequence = [
      "[SYSTEM] Commander Node Initialized...",
      "[ENFORCED] Reading AGENTS.md Control Centre...",
      "[LOAD] Fetching registry.yml and guardrails.yml...",
      "[VERIFY] Cross-referencing workspace with registry... OK",
      "[HISTORY] Analyzing recent structural history... OK",
      "[GUARDRAILS] Structural integrity locked. Zero-duplication enforced.",
      "[READY] Bootstrapping complete. Built-in rules active."
    ];

    let currentLine = 0;
    setTerminalLines([]);
    const interval = setInterval(() => {
      if (currentLine < bootSequence.length) {
        setTerminalLines(prev => [...prev, bootSequence[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleBanTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() && !bannedTasks?.some(t => t.name === newTask.trim())) {
      setBannedTasks([...(bannedTasks || []), { name: newTask.trim(), description: newTaskDesc.trim() }]);
      setNewTask('');
      setNewTaskDesc('');
    }
  };

  const handleBanProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.trim() && !bannedProjects?.includes(newProject.trim())) {
      setBannedProjects([...(bannedProjects || []), newProject.trim()]);
      setNewProject('');
    }
  };

  const removeBanTask = (name: string) => {
    setBannedTasks(prev => prev.filter(t => t.name !== name));
  };

  const removeBanProject = (name: string) => {
    setBannedProjects(prev => prev.filter(p => p !== name));
  };

  const handleGrantApproval = async (agentId: string, toolName: string, target: string) => {
    await fetch('/api/approvals/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, toolName, target })
    });
    setPendingApprovals(prev => prev.filter(p => !(p.agentId === agentId && p.toolName === toolName && p.target === target)));
  };

  const handleDenyApproval = async (agentId: string, toolName: string, target: string) => {
    await fetch('/api/approvals/deny', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, toolName, target })
    });
    setPendingApprovals(prev => prev.filter(p => !(p.agentId === agentId && p.toolName === toolName && p.target === target)));
  };

  const handleGoogleConnect = async () => {
    try {
      const res = await fetch('/api/integrations/google/url');
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
        // In a real app, you'd handle the callback. For now, we'll simulate it.
        setTimeout(async () => {
          await fetch('/api/integrations/google/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'simulated_code' })
          });
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to connect Google", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-200 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-[#0a0a0a] flex flex-col">
        <div className="p-6 flex flex-col gap-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">OpenClaw OS</h1>
              <p className="text-[10px] text-emerald-400/70 font-mono tracking-wider uppercase">Central Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 rounded-lg border border-blue-500/10 text-[10px] font-medium text-blue-400 w-fit">
            <Activity className="w-3 h-3 animate-pulse" />
            File Watcher: Active (git diff)
          </div>
        </div>
        <nav className="p-4 flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Mission Control
          </button>
          <button 
            onClick={() => setActiveTab('planning')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'planning' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            <ListFilter className="w-4 h-4" /> Inbox & Triage
          </button>
          <button 
            onClick={() => setActiveTab('quarantine')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'quarantine' ? 'bg-red-500/10 text-red-400' : 'text-zinc-400 hover:bg-red-500/5 hover:text-red-300'}`}
          >
            <Ban className="w-4 h-4" /> Quarantine & Bans
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'audit' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            <History className="w-4 h-4" /> Audit & Traces
          </button>
          <button 
            onClick={() => setActiveTab('configs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'configs' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            <GitMerge className="w-4 h-4" /> Registry & Configs
          </button>
          <button 
            onClick={() => setActiveTab('approvals')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'approvals' ? 'bg-orange-500/10 text-orange-400' : 'text-zinc-400 hover:bg-orange-500/5 hover:text-orange-300'}`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4" /> Approvals
            </div>
            {pendingApprovals.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Agent Capabilities</p>
          </div>
          
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'kanban' ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-400 hover:bg-blue-500/5 hover:text-blue-300'}`}
          >
            <KanbanSquare className="w-4 h-4" /> Kanban Tracking
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'docs' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-emerald-500/5 hover:text-emerald-300'}`}
          >
            <FileText className="w-4 h-4" /> Docs Drop
          </button>
          <button 
            onClick={() => setActiveTab('mcp')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'mcp' ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-400 hover:bg-purple-500/5 hover:text-purple-300'}`}
          >
            <Box className="w-4 h-4" /> MCP Docker Toolkit
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'calendar' ? 'bg-orange-500/10 text-orange-400' : 'text-zinc-400 hover:bg-orange-500/5 hover:text-orange-300'}`}
          >
            <Calendar className="w-4 h-4" /> Calendar
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'integrations' ? 'bg-pink-500/10 text-pink-400' : 'text-zinc-400 hover:bg-pink-500/5 hover:text-pink-300'}`}
          >
            <Mail className="w-4 h-4" /> Integrations
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <AnimatePresence mode="wait">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-6xl mx-auto">
              
              {/* LIVE STATUS STRIP */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${commanderStatus?.health === 'HEALTHY' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                  <span className="text-sm font-medium text-zinc-300">System Status</span>
                </div>
                
                <div className="flex items-center gap-6 text-xs">
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Commander</span>
                    <span className="text-emerald-400 font-mono">{commanderStatus?.status || 'Active'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Mode</span>
                    <span className="text-blue-400 font-mono">Autonomous</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Current Project</span>
                    <span className="text-zinc-200 font-mono">OpenClaw OS</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Current Objective</span>
                    <span className="text-zinc-200 font-mono truncate max-w-[200px]">{commanderStatus?.mission || 'Stabilize startup contract'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Active Worker</span>
                    <span className="text-purple-400 font-mono">{commanderStatus?.delegation?.activeSubagents?.[0] || 'Architect'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Pending Approvals</span>
                    <span className={pendingApprovals.length > 0 ? 'text-orange-400 font-mono font-bold' : 'text-zinc-400 font-mono'}>{pendingApprovals.length}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Health</span>
                    <span className={`font-mono ${commanderStatus?.health === 'HEALTHY' ? 'text-emerald-400' : 'text-yellow-400'}`}>{commanderStatus?.health || 'Healthy'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Commander & State */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* COMMANDER PANEL */}
                  <section className="bg-blue-950/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Shield className="w-32 h-32 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Cpu className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-blue-100 tracking-tight">Commander Node</h2>
                        <p className="text-xs text-blue-400/70 font-mono">ID: CMD-001 | Uptime: 99.9%</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                      <div className="bg-[#050505]/50 border border-white/5 rounded-xl p-4">
                        <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Current Strategy</h3>
                        <p className="text-sm text-zinc-300 leading-relaxed">{commanderStatus?.strategy || 'Establishing core observability and governance loops.'}</p>
                      </div>
                      <div className="bg-[#050505]/50 border border-white/5 rounded-xl p-4">
                        <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Risk Assessment</h3>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${commanderStatus?.riskLevel === 'LOW' ? 'text-emerald-400' : commanderStatus?.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'}`} />
                          <span className="text-sm font-mono text-zinc-300">{commanderStatus?.riskLevel || 'LOW'}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">Monitoring for unauthorized state mutations.</p>
                      </div>
                    </div>
                  </section>

                  {/* LIVE TERMINAL */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <TerminalIcon className="w-4 h-4 text-zinc-400" />
                      <h2 className="text-sm font-medium tracking-tight text-zinc-300 uppercase">Live Bootstrapping Sequence</h2>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 font-mono text-sm shadow-2xl shadow-emerald-900/10">
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                        <span className="ml-2 text-xs text-zinc-500">commander-node-tty1</span>
                      </div>
                      <div className="space-y-2 min-h-[160px]">
                        {terminalLines?.map((line, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className={line?.includes('[ENFORCED]') ? 'text-orange-400' : line?.includes('[READY]') ? 'text-emerald-400 font-bold' : line?.includes('[GUARDRAILS]') ? 'text-blue-400' : 'text-zinc-300'}>
                              {line}
                            </span>
                          </motion.div>
                        ))}
                        {(!terminalLines || terminalLines.length < 7) && (
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="w-2 h-4 bg-emerald-500 animate-pulse"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                {/* RIGHT COLUMN: Now/Next/Blocked & Events */}
                <div className="space-y-8">
                  
                  {/* NOW / NEXT / BLOCKED */}
                  <section className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                     <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <h2 className="text-sm font-medium tracking-tight text-zinc-300 uppercase">Execution Queue</h2>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] uppercase tracking-wider text-emerald-500 mb-3 font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Now
                        </h3>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3">
                           {kanbanTasks.filter(t => t.status === 'IN_PROGRESS').slice(0, 1).map(task => (
                             <div key={task.id}>
                               <div className="text-xs font-mono text-zinc-500 mb-1">{task.id}</div>
                               <div className="text-sm text-zinc-200">{task.title}</div>
                             </div>
                           )) || <div className="text-xs text-zinc-500 italic">No active tasks</div>}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-[10px] uppercase tracking-wider text-blue-500 mb-3 font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Next
                        </h3>
                        <div className="space-y-2">
                          {kanbanTasks.filter(t => t.status === 'TODO').slice(0, 2).map(task => (
                             <div key={task.id} className="bg-zinc-900/30 border border-white/5 rounded-xl p-3">
                               <div className="text-sm text-zinc-300">{task.title}</div>
                             </div>
                           ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[10px] uppercase tracking-wider text-red-500 mb-3 font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Blocked / Waiting
                        </h3>
                        <div className="space-y-2">
                          {pendingApprovals.length > 0 ? pendingApprovals.slice(0,2).map((app, i) => (
                             <div key={i} className="bg-red-950/20 border border-red-500/20 rounded-xl p-3">
                               <div className="text-xs text-red-400 font-mono mb-1">Approval Required</div>
                               <div className="text-sm text-zinc-300">{app.toolName} on {app.target}</div>
                             </div>
                          )) : (
                            <div className="text-xs text-zinc-500 italic px-2">No blocked items</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* EVENT STREAM */}
                  <section className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-zinc-400" />
                        <h2 className="text-sm font-medium tracking-tight text-zinc-300 uppercase">Live Events</h2>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{systemEvents.length} events</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {systemEvents.slice(0, 10).map((ev, i) => {
                        const isAutomation = 'source' in ev;
                        const typeLabel = isAutomation ? ev.type : ev.eventType;
                        const title = isAutomation ? ev.title : ev.action;
                        const desc = isAutomation ? ev.summary : (ev.targetPath ? `on ${ev.targetPath}` : '');
                        
                        return (
                          <div key={i} className="flex gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-1.5 shrink-0"></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-zinc-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded-sm ${typeLabel === 'SECURITY_VIOLATION' ? 'bg-red-500/20 text-red-400' : typeLabel === 'STATE_MUTATION' ? 'bg-blue-500/20 text-blue-400' : isAutomation ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                  {typeLabel}
                                </span>
                              </div>
                              <div className="text-zinc-300 mt-1 text-xs font-medium">{title}</div>
                              {desc && <div className="text-zinc-500 mt-0.5 text-xs">{desc}</div>}
                            </div>
                          </div>
                        );
                      })}
                      {systemEvents.length === 0 && (
                        <div className="text-xs text-zinc-500 italic text-center py-4">Waiting for telemetry...</div>
                      )}
                    </div>
                  </section>

                </div>
              </div>
            </motion.div>
          )}

          {/* PLANNING & SORTING TAB */}
          {activeTab === 'planning' && (
            <motion.div key="planning" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 max-w-5xl mx-auto">
              <div className="border-b border-white/10 pb-6">
                <h2 className="text-2xl font-semibold tracking-tight mb-2">Canonical Planning & Sorting Agent</h2>
                <p className="text-zinc-400 text-sm">The deterministic pipeline for safe, drift-resistant execution.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Pipeline Steps */}
                {[
                  { title: "1. Planner", desc: "Produces structured JSON plan. No execution.", color: "text-blue-400", bg: "bg-blue-500/10" },
                  { title: "2. Sorter", desc: "Decomposes to work items. Orders by risk.", color: "text-purple-400", bg: "bg-purple-500/10" },
                  { title: "3. Executor", desc: "Proposes changes (dry-run). Applies if approved.", color: "text-orange-400", bg: "bg-orange-500/10" },
                  { title: "4. Verifier", desc: "Grades by outcome (tests/validators).", color: "text-emerald-400", bg: "bg-emerald-500/10" }
                ].map((step, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 relative">
                    <div className={`p-2 w-10 h-10 flex items-center justify-center rounded-lg mb-4 ${step.bg} ${step.color} font-bold`}>
                      {i + 1}
                    </div>
                    <h3 className="font-medium mb-2">{step.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
                    {i < 3 && <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-600 z-10" />}
                  </div>
                ))}
              </div>

              {/* Continuous Feedback Loop Integration */}
              <div className="mt-8 p-6 rounded-2xl bg-blue-950/10 border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.05)]">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-lg font-medium text-blue-400">OpenClaw Continuous Integration Loop</h3>
                    <p className="text-xs text-blue-400/70 mt-1">How the File Watcher, Diff Checker, and Agent Feedback operate in real-time.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-orange-500/20 -z-10 hidden md:block"></div>
                  
                  <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-xl z-10">
                    <div className="text-xs font-mono text-zinc-500 mb-2">STEP 1: INTERCEPT</div>
                    <h4 className="font-medium text-zinc-200 mb-2">File Watcher & Diff Check</h4>
                    <p className="text-xs text-zinc-400">A background process (e.g., Chokidar/Git Hooks) monitors the workspace. When an agent attempts a write, it intercepts the <code className="text-blue-300">git diff</code> before it commits.</p>
                  </div>

                  <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-xl z-10">
                    <div className="text-xs font-mono text-zinc-500 mb-2">STEP 2: VALIDATE</div>
                    <h4 className="font-medium text-zinc-200 mb-2">Guardrail Engine</h4>
                    <p className="text-xs text-zinc-400">The diff is compared against <code className="text-emerald-300">registry.yml</code> and <code className="text-emerald-300">guardrails.yml</code>. If it creates a banned project or violates a path rule, the write is <strong>blocked</strong>.</p>
                  </div>

                  <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-xl z-10">
                    <div className="text-xs font-mono text-zinc-500 mb-2">STEP 3: FEEDBACK</div>
                    <h4 className="font-medium text-zinc-200 mb-2">Agent Correction</h4>
                    <p className="text-xs text-zinc-400">The system returns a structured JSON error to the OpenClaw agent (e.g., <code className="text-orange-300">"Path /forbidden not in registry"</code>). The agent learns and proposes a new, compliant plan.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                  <h3 className="font-medium mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-yellow-500" /> Deterministic Gate Status</h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5">
                      <span className="text-zinc-400">Schema Validation</span>
                      <span className="text-emerald-400">ENFORCED</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5">
                      <span className="text-zinc-400">Path Allowlists</span>
                      <span className="text-emerald-400">ENFORCED</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5">
                      <span className="text-zinc-400">Risk Gate (Delete/Move)</span>
                      <span className="text-yellow-400">REQUIRES APPROVAL</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5">
                      <span className="text-zinc-400">Two-Phase Commit (Dry-Run)</span>
                      <span className="text-emerald-400">ACTIVE</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.05)]">
                  <h3 className="font-medium mb-4 flex items-center gap-2 text-orange-400"><Play className="w-4 h-4" /> Dry-Run Staging Area</h3>
                  <p className="text-xs text-zinc-400 mb-4">Proposed structural changes waiting for explicit approval. No files have been mutated yet.</p>
                  <div className="space-y-3">
                    {dryRuns?.map((run, i) => (
                      <div key={i} className="p-3 bg-orange-950/20 border border-orange-900/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">{run.id}</span>
                          <span className={`text-[10px] font-bold tracking-wider uppercase ${run.risk === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>{run.risk} RISK</span>
                        </div>
                        <div className="font-mono text-xs text-zinc-300 mb-3">
                          <span className="text-orange-300 font-bold">{run.action}</span> {run.target}
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded text-xs font-medium transition-colors">Approve & Apply</button>
                          <button className="flex-1 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-xs font-medium transition-colors">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* QUARANTINE & BANS TAB */}
          {activeTab === 'quarantine' && (
            <motion.div key="quarantine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-5xl mx-auto">
              
              {/* Active Workspace Drift */}
              <div className="p-6 rounded-2xl bg-red-950/10 border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.05)]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Active Workspace Drift (Quarantine Inbox)
                    </h3>
                    <p className="text-xs text-red-400/70 mt-1">Files and folders found outside of the workspace_registry.yaml guardrails. Awaiting classification.</p>
                  </div>
                  <div className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold animate-pulse">
                    {quarantinedFiles?.length || 0} VIOLATIONS DETECTED
                  </div>
                </div>
                
                <div className="space-y-3">
                  {quarantinedFiles?.map((file, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#0a0a0a] border border-red-900/50 rounded-xl gap-4">
                      <div className="flex items-start gap-3">
                        <FileWarning className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-sm text-red-200 block">{file.path}</span>
                          <span className="text-xs text-red-400/70 mt-1 block">Reason: {file.reason}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded-lg transition-colors tooltip-trigger" title="Classify & Move">
                          <GitMerge className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 rounded-lg transition-colors tooltip-trigger" title="Archive">
                          <Archive className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors tooltip-trigger" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-b border-red-500/20 pb-6 pt-4">
                <h2 className="text-2xl font-semibold tracking-tight mb-2 text-red-400 flex items-center gap-2">
                  <Ban className="w-6 h-6" /> Quarantine & Banned Registry
                </h2>
                <p className="text-zinc-400 text-sm">Hard-stop enforcement for specific tasks and projects. Agents will immediately reject these.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Banned Tasks */}
                <div className="space-y-4">
                  <h3 className="font-medium text-zinc-200">Banned Tasks (Operations)</h3>
                  <form onSubmit={handleBanTask} className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="e.g., bypass_dry_run" 
                        className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500/50"
                      />
                      <button type="submit" className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm font-medium">
                        <Plus className="w-4 h-4" /> Ban
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Reason for ban (optional)" 
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </form>
                  <div className="space-y-2">
                    {bannedTasks?.map((task, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-red-950/20 border border-red-900/30 rounded-lg group">
                        <div>
                          <span className="font-mono text-xs text-red-300 block">{task.name}</span>
                          {task.description && <span className="text-xs text-zinc-400 mt-1 block">{task.description}</span>}
                        </div>
                        <button onClick={() => removeBanTask(task.name)} className="text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(!bannedTasks || bannedTasks.length === 0) && <p className="text-xs text-zinc-500 italic">No banned tasks.</p>}
                  </div>
                </div>

                {/* Banned Projects */}
                <div className="space-y-4">
                  <h3 className="font-medium text-zinc-200">Quarantined / Banned Projects</h3>
                  <form onSubmit={handleBanProject} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      placeholder="e.g., legacy_test_project" 
                      className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500/50"
                    />
                    <button type="submit" className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm font-medium">
                      <Plus className="w-4 h-4" /> Ban
                    </button>
                  </form>
                  <div className="space-y-2">
                    {bannedProjects?.map((project, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-red-950/20 border border-red-900/30 rounded-lg group">
                        <span className="font-mono text-xs text-red-300">{project}</span>
                        <button onClick={() => removeBanProject(project)} className="text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(!bannedProjects || bannedProjects.length === 0) && <p className="text-xs text-zinc-500 italic">No banned projects.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* AUDIT & TRACES TAB */}
          {activeTab === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-2xl font-semibold tracking-tight mb-2 flex items-center gap-2">
                  <Fingerprint className="w-6 h-6 text-blue-400" /> Immutable Audit & Traces
                </h2>
                <p className="text-zinc-400 text-sm">Every structural and governance change is recorded with a mandatory Trace ID.</p>
              </div>
              
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="space-y-4">
                  {auditLogs?.map((log, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 text-sm border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                        <span className="font-mono text-xs text-zinc-500 w-40">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-mono tracking-wider truncate max-w-[120px]">{log.traceId}</span>
                      </div>
                      <span className="px-2 py-1 bg-zinc-800 rounded text-xs font-medium text-zinc-300 shrink-0 w-fit">{log.agentId}</span>
                      <span className="text-zinc-300 flex-1">{log.eventType}: {log.action} {log.targetPath ? `(${log.targetPath})` : ''}</span>
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 hidden md:block" />
                    </div>
                  ))}
                  {(!auditLogs || auditLogs.length === 0) && <p className="text-xs text-zinc-500 italic">No telemetry traces recorded yet.</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* CONFIGS TAB */}
          {activeTab === 'configs' && (
            <motion.div key="configs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-2xl font-semibold tracking-tight mb-2">Registry & Configs</h2>
                <p className="text-zinc-400 text-sm">Raw YAML files enforcing the deterministic spine of the OS.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden flex flex-col h-96">
                  <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">registry.yml</span>
                  </div>
                  <div className="p-4 overflow-auto flex-1"><pre className="text-xs font-mono text-emerald-400/80 leading-relaxed">{registry}</pre></div>
                </div>
                <div className="rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden flex flex-col h-96">
                  <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">guardrails.yml</span>
                  </div>
                  <div className="p-4 overflow-auto flex-1"><pre className="text-xs font-mono text-blue-400/80 leading-relaxed">{guardrails}</pre></div>
                </div>
                <div className="rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden flex flex-col h-96">
                  <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">workflows.yml</span>
                  </div>
                  <div className="p-4 overflow-auto flex-1"><pre className="text-xs font-mono text-orange-400/80 leading-relaxed">{workflows}</pre></div>
                </div>
                <div className="rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden flex flex-col h-96">
                  <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">tools.yml</span>
                  </div>
                  <div className="p-4 overflow-auto flex-1"><pre className="text-xs font-mono text-pink-400/80 leading-relaxed">{tools}</pre></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* KANBAN TAB */}
          {activeTab === 'kanban' && (
            <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-2xl font-semibold tracking-tight mb-2 flex items-center gap-2">
                  <KanbanSquare className="w-6 h-6 text-blue-400" /> Commander Kanban
                </h2>
                <p className="text-zinc-400 text-sm">Task tracking and planning managed automatically by the Commander agent.</p>
              </div>

              {/* Execution Status Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-emerald-900/5">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Play className="w-16 h-16 text-emerald-500" />
                  </div>
                  <h3 className="text-[10px] uppercase tracking-wider text-emerald-500 mb-3 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Now
                  </h3>
                  {kanbanTasks.filter(t => t.status === 'IN_PROGRESS').slice(0, 1).map(task => (
                    <div key={task.id} className="relative z-10">
                      <div className="text-xs font-mono text-emerald-500/70 mb-1">{task.id}</div>
                      <div className="text-sm text-zinc-200 font-medium">{task.title}</div>
                    </div>
                  ))}
                  {kanbanTasks.filter(t => t.status === 'IN_PROGRESS').length === 0 && (
                    <div className="text-xs text-zinc-500 italic relative z-10">No active tasks</div>
                  )}
                </div>

                <div className="bg-[#0a0a0a] border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-blue-900/5">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ListFilter className="w-16 h-16 text-blue-500" />
                  </div>
                  <h3 className="text-[10px] uppercase tracking-wider text-blue-500 mb-3 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Next
                  </h3>
                  <div className="space-y-2 relative z-10">
                    {kanbanTasks.filter(t => t.status === 'TODO').slice(0, 2).map(task => (
                      <div key={task.id} className="text-sm text-zinc-300 truncate">{task.title}</div>
                    ))}
                    {kanbanTasks.filter(t => t.status === 'TODO').length === 0 && (
                      <div className="text-xs text-zinc-500 italic">Queue is empty</div>
                    )}
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-red-900/5">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldAlert className="w-16 h-16 text-red-500" />
                  </div>
                  <h3 className="text-[10px] uppercase tracking-wider text-red-500 mb-3 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Blocked
                  </h3>
                  <div className="space-y-2 relative z-10">
                    {pendingApprovals.length > 0 ? pendingApprovals.slice(0, 2).map((app, i) => (
                      <div key={i} className="text-sm text-zinc-300 truncate">
                        <span className="text-red-400 font-mono text-xs mr-2">Approval</span>
                        {app.toolName}
                      </div>
                    )) : (
                      <div className="text-xs text-zinc-500 italic">No blocked items</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 mb-6">
                <h3 className="text-sm font-medium text-zinc-300 mb-4">Add New Task</h3>
                <form 
                  className="flex flex-col md:flex-row gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                    const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
                    // Fix for submitter action
                    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
                    const action = submitter?.getAttribute('data-action');
                    
                    if (title) {
                      if (action === 'commander') {
                        await fetch('/api/commander/execute', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ task: `${title} - ${desc}` })
                        });
                      } else {
                        await fetch('/api/kanban', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ title, description: desc, assignee: 'HUMAN' })
                        });
                      }
                      form.reset();
                      const res = await fetch('/api/kanban');
                      const data = await res.json();
                      setKanbanTasks(Array.isArray(data) ? data : []);
                    }
                  }}
                >
                  <input name="title" type="text" placeholder="Task Title" className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50" required />
                  <input name="desc" type="text" placeholder="Description (optional)" className="flex-2 bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50" />
                  <button type="submit" data-action="add" className="bg-blue-500/10 text-blue-400 px-6 py-2 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium whitespace-nowrap">
                    Add Task
                  </button>
                  <button type="submit" data-action="commander" className="bg-orange-500/10 text-orange-400 px-6 py-2 rounded-lg hover:bg-orange-500/20 transition-colors text-sm font-medium whitespace-nowrap flex items-center gap-2">
                    <Play className="w-4 h-4" /> Run via Commander
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((status) => (
                  <div key={status} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 min-h-[400px]">
                    <h3 className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-wider">{status.replace('_', ' ')}</h3>
                    {kanbanTasks?.filter(t => t.status === status).map((task, i) => (
                      <div key={i} className={`bg-${status === 'DONE' ? 'emerald' : 'blue'}-950/30 border border-${status === 'DONE' ? 'emerald' : 'blue'}-500/30 rounded-xl p-3 mb-3 ${status === 'DONE' ? 'opacity-70' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-mono text-${status === 'DONE' ? 'emerald' : 'blue'}-400 bg-${status === 'DONE' ? 'emerald' : 'blue'}-500/10 px-2 py-0.5 rounded`}>{task.id}</span>
                          <div className="flex items-center gap-2">
                            {task.priority && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                task.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                                task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                                task.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-zinc-500/20 text-zinc-400'
                              }`}>
                                {task.priority}
                              </span>
                            )}
                            {status === 'IN_PROGRESS' ? <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> : <CheckCircle className="w-3 h-3 text-emerald-500" />}
                          </div>
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200 mb-1">{task.title}</h4>
                        <p className="text-xs text-zinc-400">{task.description}</p>
                        
                        {/* Subtasks */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Subtasks ({task.subtasks.filter((s: any) => s.status === 'DONE').length}/{task.subtasks.length})</p>
                            <div className="space-y-1">
                              {task.subtasks.map((st: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <div className={`w-1.5 h-1.5 rounded-full ${st.status === 'DONE' ? 'bg-emerald-500' : st.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-zinc-600'}`} />
                                  <span className={st.status === 'DONE' ? 'text-zinc-500 line-through' : 'text-zinc-300'}>{st.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {task.assignee && <p className="text-[10px] text-zinc-500 mt-2 font-mono">Assignee: {task.assignee}</p>}
                      </div>
                    ))}
                    {(!kanbanTasks || kanbanTasks.filter(t => t.status === status).length === 0) && (
                      <p className="text-xs text-zinc-600 italic">No tasks</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* DOCS DROP TAB */}
          {activeTab === 'docs' && (
            <motion.div key="docs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-2xl font-semibold tracking-tight mb-2 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-emerald-400" /> Docs Drop & Save
                </h2>
                <p className="text-zinc-400 text-sm">A safe folder for agents to drop context, research, and execution logs.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                   <label className="border-2 border-dashed border-white/10 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-emerald-500/30 transition-colors cursor-pointer bg-white/5 block">
                     <FileText className="w-8 h-8 text-zinc-500 mb-4" />
                     <h3 className="text-sm font-medium text-zinc-300 mb-1">Drop documents here or click to upload</h3>
                     <p className="text-xs text-zinc-500">Agents will automatically read files placed in /docs</p>
                     <input 
                       type="file" 
                       className="hidden" 
                       onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const formData = new FormData();
                           formData.append('file', file);
                           await fetch('/api/docs/upload', {
                             method: 'POST',
                             body: formData
                           });
                           // Refresh docs list
                           const res = await fetch('/api/docs');
                           const data = await res.json();
                           setDocsList(Array.isArray(data) ? data : []);
                         }
                       }} 
                     />
                   </label>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-medium text-zinc-300 mb-4">Saved Documents</h3>
                  <div className="space-y-2">
                    {docsList?.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono text-zinc-300 truncate">{doc}</span>
                      </div>
                    ))}
                    {(!docsList || docsList.length === 0) && <p className="text-xs text-zinc-500 italic">No documents saved.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MCP TOOLKIT TAB */}
          {activeTab === 'mcp' && (
            <motion.div key="mcp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-2xl font-semibold tracking-tight mb-2 flex items-center gap-2">
                  <Box className="w-6 h-6 text-purple-400" /> MCP Docker Toolkit
                </h2>
                <p className="text-zinc-400 text-sm">Model Context Protocol tools discovered and available to agents.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mcpTools?.map((tool, i) => (
                  <div key={i} className="bg-[#0a0a0a] border border-purple-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Box className="w-5 h-5" /></div>
                      <span className={`px-2 py-1 ${tool.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'} text-[10px] font-bold rounded uppercase`}>{tool.status}</span>
                    </div>
                    <h3 className="font-medium text-zinc-200 mb-1">{tool.name}</h3>
                    <p className="text-xs text-zinc-400 mb-4">{tool.description}</p>
                    <div className="px-3 py-2 bg-black/50 border border-white/5 rounded-lg text-[10px] font-mono text-zinc-500 truncate">
                      {tool.dockerImage}
                    </div>
                  </div>
                ))}
                {(!mcpTools || mcpTools.length === 0) && <p className="text-sm text-zinc-500 italic col-span-3">No MCP tools discovered.</p>}
              </div>
            </motion.div>
          )}

          {/* APPROVALS TAB */}
          {activeTab === 'approvals' && (
            <motion.div key="approvals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-2xl font-semibold tracking-tight mb-2 flex items-center gap-2">
                  <CheckSquare className="w-6 h-6 text-orange-400" /> Run-Wide Approvals
                </h2>
                <p className="text-zinc-400 text-sm">Least privilege enforcement. Destructive or high-impact tools require explicit sign-off.</p>
              </div>
              <div className="bg-[#0a0a0a] border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_40px_rgba(249,115,22,0.05)]">
                <div className="flex items-center gap-3 mb-6">
                  <Lock className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-medium text-orange-400">Pending Execution Requests</h3>
                </div>
                <div className="space-y-4">
                  {pendingApprovals?.map((req, i) => (
                    <div key={i} className="p-4 bg-orange-950/20 border border-orange-900/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${req.level === 'DESTRUCTIVE' ? 'text-red-400 bg-red-500/10' : 'text-orange-400 bg-orange-500/10'} px-2 py-0.5 rounded uppercase`}>{req.level}</span>
                          <span className="text-xs font-mono text-zinc-400">Agent: {req.agentId}</span>
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200">Tool: {req.toolName}</h4>
                        <p className="text-xs text-zinc-500 mt-1">Target: {req.target}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleGrantApproval(req.agentId, req.toolName, req.target)} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-medium transition-colors">Grant Approval</button>
                        <button onClick={() => handleDenyApproval(req.agentId, req.toolName, req.target)} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors">Deny</button>
                      </div>
                    </div>
                  ))}
                  {(!pendingApprovals || pendingApprovals.length === 0) && <p className="text-sm text-zinc-500 italic">No pending execution requests.</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <motion.div key="integrations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-2xl font-semibold tracking-tight mb-2 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-pink-400" /> Integrations & Auth
                </h2>
                <p className="text-zinc-400 text-sm">Connect external services for agents to interact with.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg"><Mail className="w-6 h-6 text-zinc-300" /></div>
                      <div>
                        <h3 className="font-medium text-zinc-200">Google Workspace</h3>
                        <p className="text-xs text-zinc-500">Gmail & Calendar API</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 ${googleSession?.isAuthenticated ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'} text-[10px] font-bold rounded uppercase`}>
                      {googleSession?.isAuthenticated ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-6">Allows agents to read emails, schedule events, and manage your calendar directly.</p>
                  {googleSession?.isAuthenticated ? (
                    <div className="w-full py-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Connected as {googleSession.userEmail}
                    </div>
                  ) : (
                    <button onClick={handleGoogleConnect} className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                      Connect Google Account
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-white/10 pb-6 mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight mb-2 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-orange-400" /> Google Calendar
                  </h2>
                  <p className="text-zinc-400 text-sm">Manage deadlines, schedule tasks, and coordinate activities.</p>
                </div>
                {!googleSession?.isAuthenticated && (
                  <button onClick={handleGoogleConnect} className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors">
                    Connect Google
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-zinc-200">Upcoming Events</h3>
                  </div>
                  {calendarEvents?.length > 0 ? (
                    calendarEvents.map((event, i) => (
                      <div key={i} className="p-4 bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-zinc-200">{event.summary}</h4>
                            <p className="text-sm text-zinc-400 mt-1">{event.description || 'No description'}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-[#0a0a0a] border border-white/10 rounded-xl text-center">
                      <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400">No upcoming events found.</p>
                      {!googleSession?.isAuthenticated && <p className="text-xs text-zinc-500 mt-2">Connect your Google account to view events.</p>}
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                    <h3 className="font-medium text-zinc-200 mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-orange-400" /> Schedule Event
                    </h3>
                    <form className="space-y-4" onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const newEvent = {
                        summary: formData.get('summary'),
                        description: formData.get('description'),
                        startTime: new Date(formData.get('startTime') as string).toISOString(),
                        endTime: new Date(formData.get('endTime') as string).toISOString(),
                      };
                      try {
                        await fetch('/api/integrations/google/calendar/events', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newEvent)
                        });
                        // Refresh will happen via polling
                        (e.target as HTMLFormElement).reset();
                      } catch (err) {
                        console.error(err);
                      }
                    }}>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Event Title</label>
                        <input name="summary" required type="text" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50" placeholder="e.g., Code Review" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
                        <textarea name="description" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 h-20" placeholder="Event details..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">Start Time</label>
                          <input name="startTime" required type="datetime-local" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">End Time</label>
                          <input name="endTime" required type="datetime-local" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50" />
                        </div>
                      </div>
                      <button type="submit" disabled={!googleSession?.isAuthenticated} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors">
                        Create Event
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
