import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { StatusStrip } from './components/StatusStrip';
import { MissionTab } from './components/tabs/MissionTab';
import { MissionControlTab } from './components/tabs/MissionControlTab';
import { FactoryTab } from './components/tabs/FactoryTab';
import { InboxTab } from './components/tabs/InboxTab';
import { KanbanTab } from './components/tabs/KanbanTab';
import { AgentsTab } from './components/tabs/AgentsTab';
import { MCPTab } from './components/tabs/MCPTab';
import { SecurityTab } from './components/tabs/SecurityTab';
import { MemoryTab } from './components/tabs/MemoryTab';
import { AuditTab } from './components/tabs/AuditTab';
import { MessagesTab } from './components/tabs/MessagesTab';
import { GatewayTab } from './components/tabs/GatewayTab';

import { ThinkingOverlay } from './components/ThinkingOverlay';

export default function App() {
  const [activeTab, setActiveTab] = useState<'mission' | 'mission-control' | 'factory' | 'inbox' | 'kanban' | 'agents' | 'mcp' | 'security' | 'memory' | 'audit' | 'messages' | 'gateway'>('mission');
  const [isThinking, setIsThinking] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  
  const [state, setState] = useState<any>({
    health: {}, commander: {}, inbox: [], tasks: [], agents: [], mcp: [], approvals: [], quarantine: [], audit: [], memory: [],
    guardrails: [], projects: [], messages: [],
    factory: { builds: [], deployments: [], stats: { totalBuilds: 0, successRate: 0, activeDeployments: 0, recentContributions: [] } },
    processor: { kernelPower: '0%', status: 'IDLE', queueSize: 0, engine: 'AutoForge-Core-v1' }
  });

  const fetchState = async () => {
    try {
      const res = await fetch('/api/system/state');
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error("Failed to fetch mega state", err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'AGENT_MESSAGE') {
        setState((prev: any) => ({
          ...prev,
          messages: [data.payload, ...(prev.messages || [])].slice(0, 200)
        }));
      } else if (data.type === 'AUTOMATION_EVENT') {
        setState((prev: any) => ({
          ...prev,
          inbox: [data.payload, ...(prev.inbox || [])].slice(0, 100)
        }));
      }
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  const handleTriage = async (id: string) => {
    await fetch(`/api/inbox/${id}/triage`, { method: 'POST' });
    fetchState();
  };

  const handleGrant = async (id: string) => {
    await fetch(`/api/approvals/${id}/grant`, { method: 'POST' });
    fetchState();
  };

  const handleDeny = async (id: string) => {
    await fetch(`/api/approvals/${id}/deny`, { method: 'POST' });
    fetchState();
  };

  const handleNewTask = async () => {
    const title = prompt("Enter task title:");
    if (title) {
      await fetch(`/api/tasks`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority: 'HIGH' })
      });
      fetchState();
    }
  };

  const handleStartBuild = async () => {
    await fetch('/api/factory/builds', { method: 'POST' });
    fetchState();
    setActiveTab('factory');
  };

  const handleDeploy = async (buildId: string) => {
    await fetch('/api/factory/deployments', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildId, environment: 'STAGING' })
    });
    fetchState();
  };

  const handleSpawnProject = async () => {
    const prompt = window.prompt("Enter project intent (e.g., 'Build a secure authentication module'):");
    if (prompt) {
      setIsThinking(true);
      setCurrentPrompt(prompt);
      try {
        await fetch('/api/system/thinking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        fetchState();
      } catch (err) {
        console.error("Thinking Gateway Error:", err);
      } finally {
        setIsThinking(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-emerald-500/80 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 flex flex-col md:flex-row overflow-hidden relative crt-flicker">
      <div className="atmosphere" />
      <div className="arcade-grid" />
      <div className="scanline" />
      <ThinkingOverlay isThinking={isThinking} prompt={currentPrompt} />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        state={state} 
        handleStartBuild={handleStartBuild} 
      />

      <main className="flex-1 overflow-y-auto p-8 md:p-12 bg-[#050505] custom-scrollbar flex flex-col">
        
        <StatusStrip activeTab={activeTab} state={state} />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'mission' && <MissionTab state={state} />}
            {activeTab === 'mission-control' && <MissionControlTab state={state} />}
            {activeTab === 'factory' && <FactoryTab state={state} handleStartBuild={handleStartBuild} handleDeploy={handleDeploy} />}
            {activeTab === 'inbox' && <InboxTab state={state} handleTriage={handleTriage} />}
            {activeTab === 'kanban' && <KanbanTab state={state} handleNewTask={handleNewTask} handleSpawnProject={handleSpawnProject} />}
            {activeTab === 'agents' && <AgentsTab state={state} />}
            {activeTab === 'mcp' && <MCPTab state={state} />}
            {activeTab === 'security' && <SecurityTab state={state} handleGrant={handleGrant} handleDeny={handleDeny} />}
            {activeTab === 'memory' && <MemoryTab state={state} />}
            {activeTab === 'audit' && <AuditTab state={state} />}
            {activeTab === 'messages' && <MessagesTab state={state} />}
            {activeTab === 'gateway' && <GatewayTab state={state} />}
          </AnimatePresence>
        </div>

        {/* System Terminal (Real-ish Logs) */}
        <div className="mt-12 bg-black border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-zinc-500 h-32 overflow-y-auto custom-scrollbar shadow-2xl">
          <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-emerald-500 font-bold uppercase tracking-widest">System Kernel Log</span>
          </div>
          {state.audit?.slice(0, 10).map((log: any, i: number) => (
            <div key={i} className="mb-1">
              <span className="text-zinc-700 mr-2">[{log.time}]</span>
              <span className="text-purple-500 mr-2">{log.agent}:</span>
              <span>{log.action}</span>
            </div>
          ))}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}} />
    </div>
  );
}
