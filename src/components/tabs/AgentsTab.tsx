import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, FileText, ChevronRight, Save, X, Edit3, Terminal, Zap, Activity, Brain, Sparkles, ShieldAlert, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const agentIcons: { [key: string]: any } = {
  Commander: Terminal,
  Ralph: Zap,
  TaskProcessor: Activity,
  ThinkingGateway: Brain,
  ProjectSoul: Sparkles,
  SecurityScanner: ShieldAlert,
  DBAgent: Database,
};

const agentColors: { [key: string]: string } = {
  'cyber-blue': '#06b6d4', // Computer Cyan
  'cyber-pink': '#8b5cf6', // Computer Violet
  'cyber-orange': '#f59e0b', // Human Amber
  'cyber-purple': '#a3e635', // Human Sage
  'cyber-sky': '#cbd5e1', // Slate 300
};

export const AgentsTab = ({ state }: { state: any }) => {
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [docContent, setDocContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchDoc = async (name: string) => {
    try {
      const res = await fetch(`/api/agents/${name}/doc`);
      const text = await res.text();
      setDocContent(text);
    } catch (err) {
      console.error("Failed to fetch agent doc", err);
    }
  };

  const saveDoc = async () => {
    if (!selectedAgent) return;
    try {
      await fetch(`/api/agents/${selectedAgent.name}/doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: docContent })
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save agent doc", err);
    }
  };

  useEffect(() => {
    if (selectedAgent) {
      fetchDoc(selectedAgent.name);
    }
  }, [selectedAgent]);

  return (
    <motion.div key="agents" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 max-w-6xl mx-auto relative z-10">
      <div className="flex flex-col gap-2 mb-10">
        <h2 className="text-3xl font-black tracking-tighter text-slate-100 flex items-center gap-4 uppercase neon-text-comp">
          <Cpu className="w-8 h-8" /> Agent Roster
        </h2>
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Active workers and their current load. Real-time status from the kernel.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.agents.map((agent:any, i:number) => {
          const Icon = agentIcons[agent.name] || Cpu;
          const color = agentColors[agent.color] || '#10b981';
          return (
            <div 
              key={i} 
              onClick={() => setSelectedAgent(agent)}
              className="glass-card p-8 group cursor-pointer hover:neon-glow transition-all"
              style={{ borderColor: `${color}40` }}
            >
              <div className="absolute -right-8 -bottom-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
                <Icon className="w-32 h-32" style={{ color }} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-none border shadow-lg" style={{ backgroundColor: `${color}10`, color, borderColor: `${color}20` }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter">{agent.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: `${color}80` }}>{agent.type}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-none uppercase tracking-widest`} style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }}>
                      {agent.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black opacity-40">Active Tasks</span>
                    <p className="text-xl font-mono text-white font-bold">{agent.tasks}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black opacity-40">Efficiency</span>
                    <p className="text-xl font-mono font-bold" style={{ color }}>98%</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity" style={{ color }}>
                  <FileText className="w-3 h-3" /> View Definition <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedAgent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card max-w-4xl w-full h-[80vh] flex flex-col neon-glow overflow-hidden"
              style={{ borderColor: `${agentColors[selectedAgent.color] || '#10b981'}40` }}
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-6">
                  <div className="p-4 rounded-none border" style={{ backgroundColor: `${agentColors[selectedAgent.color] || '#10b981'}10`, borderColor: `${agentColors[selectedAgent.color] || '#10b981'}20` }}>
                    {React.createElement(agentIcons[selectedAgent.name] || Cpu, { className: "w-8 h-8", style: { color: agentColors[selectedAgent.color] || '#10b981' } })}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedAgent.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Agent Definition Matrix</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {isEditing ? (
                    <>
                      <button 
                        onClick={saveDoc}
                        className="flex items-center gap-2 px-6 py-3 font-black text-[10px] uppercase tracking-widest transition-colors"
                        style={{ backgroundColor: agentColors[selectedAgent.color] || '#10b981', color: '#000' }}
                      >
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-3 border font-black text-[10px] uppercase tracking-widest transition-colors"
                        style={{ backgroundColor: `${agentColors[selectedAgent.color] || '#10b981'}10`, color: agentColors[selectedAgent.color] || '#10b981', borderColor: `${agentColors[selectedAgent.color] || '#10b981'}20` }}
                      >
                        <Edit3 className="w-4 h-4" /> Edit Definition
                      </button>
                      <button 
                        onClick={() => setSelectedAgent(null)}
                        className="p-3 bg-white/5 text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-black/20">
                {isEditing ? (
                  <textarea 
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    className="w-full h-full bg-transparent border-none focus:ring-0 font-mono text-white/80 resize-none leading-relaxed"
                    placeholder="# Agent Definition..."
                  />
                ) : (
                  <div className="prose prose-invert max-w-none prose-headings:uppercase prose-headings:tracking-tighter prose-headings:font-black prose-p:text-white/60 prose-p:font-medium prose-strong:text-white">
                    <ReactMarkdown>{docContent}</ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: agentColors[selectedAgent.color] || '#10b981' }}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Agent Link: Synchronized</span>
                </div>
                <span className="text-[10px] font-mono opacity-20">OPENCLAW_OS_V1.0.0</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
