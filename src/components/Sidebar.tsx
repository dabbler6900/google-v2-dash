import React from 'react';
import { 
  Shield, Activity, LayoutDashboard, Rocket, Inbox, 
  KanbanSquare, Cpu, Box, ShieldAlert, Database, History, Zap, MessageSquare, Link2 
} from 'lucide-react';

interface TabButtonProps {
  id: string;
  icon: any;
  label: string;
  badge?: number;
  color?: string;
  activeTab: string;
  setActiveTab: (id: any) => void;
}

const TabButton = ({ id, icon: Icon, label, badge, color = 'emerald', activeTab, setActiveTab }: TabButtonProps) => (
  <button 
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      activeTab === id 
        ? `bg-${color}-500/10 text-${color}-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]` 
        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 ${activeTab === id ? `text-${color}-400` : 'text-zinc-500'}`} /> {label}
    </div>
    {badge && badge > 0 ? (
      <span className={`bg-${color}-500/20 text-${color}-400 text-[10px] font-bold px-2 py-0.5 rounded-full`}>
        {badge}
      </span>
    ) : null}
  </button>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: any) => void;
  state: any;
  handleStartBuild: () => void;
}

export const Sidebar = ({ activeTab, setActiveTab, state, handleStartBuild }: SidebarProps) => {
  return (
    <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/5 bg-[#080808] flex flex-col shrink-0">
      <div className="p-8 flex flex-col gap-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">OpenClaw OS</h1>
            <p className="text-[10px] text-emerald-500/60 font-mono tracking-[0.2em] uppercase font-bold">Autonomous Core</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">
          <Activity className="w-3 h-3 animate-pulse" />
          Kernel: v1.0.0-alpha
        </div>
      </div>
      
      <nav className="p-6 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="pt-2 pb-3"><p className="px-4 text-[10px] font-black tracking-[0.15em] text-zinc-600 uppercase">Operations</p></div>
        <TabButton id="mission" icon={LayoutDashboard} label="System Overview" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="mission-control" icon={Shield} label="Mission Control" color="emerald" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="factory" icon={Rocket} label="Software Factory" color="blue" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="inbox" icon={Inbox} label="Event Inbox" badge={state.inbox.length} color="blue" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="messages" icon={MessageSquare} label="Agent Comm Bus" badge={state.messages?.length} color="purple" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="kanban" icon={KanbanSquare} label="Task Kanban" badge={state.tasks.filter((t:any) => t.status === 'IN_PROGRESS').length} activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="pt-8 pb-3"><p className="px-4 text-[10px] font-black tracking-[0.15em] text-zinc-600 uppercase">Resources</p></div>
        <TabButton id="agents" icon={Cpu} label="Agent Roster" color="purple" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="mcp" icon={Box} label="MCP Toolkit" color="purple" activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="pt-8 pb-3"><p className="px-4 text-[10px] font-black tracking-[0.15em] text-zinc-600 uppercase">Governance</p></div>
        <TabButton id="security" icon={ShieldAlert} label="Security Gates" badge={state.approvals.length + state.quarantine.length} color="orange" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="memory" icon={Database} label="System Memory" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="audit" icon={History} label="Audit Ledger" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="gateway" icon={Link2} label="Gateway Link" color="blue" activeTab={activeTab} setActiveTab={setActiveTab} />
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/20">
        <button 
          onClick={handleStartBuild}
          className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2 group"
        >
          <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Trigger Build Pipeline
        </button>
      </div>
    </aside>
  );
};
