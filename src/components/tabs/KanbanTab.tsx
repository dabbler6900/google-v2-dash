import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KanbanSquare, Plus, Rocket, Folder } from 'lucide-react';

interface KanbanTabProps {
  state: any;
  handleNewTask: () => void;
  handleSpawnProject: () => void;
}

export const KanbanTab = ({ state, handleNewTask, handleSpawnProject }: KanbanTabProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');

  const filteredTasks = selectedProjectId === 'all' 
    ? state.tasks 
    : state.tasks.filter((t: any) => t.projectId === selectedProjectId);

  return (
    <motion.div 
      key="kanban" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="space-y-12 max-w-full mx-auto relative z-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
        <div className="space-y-3">
          <h2 className="text-5xl font-black tracking-tighter text-white flex items-center gap-6 uppercase">
            <KanbanSquare className="w-10 h-10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" /> State Machine
          </h2>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em] ml-1">Unambiguous execution state for all system tasks</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 glass-card px-6 py-3 border border-white/10">
            <Folder className="w-4 h-4 text-zinc-500" />
            <select 
              value={selectedProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-[10px] font-black text-zinc-300 outline-none cursor-pointer uppercase tracking-widest"
            >
              <option value="all" className="bg-[#050505]">All Projects</option>
              {state.projects.map((p: any) => (
                <option key={p.id} value={p.id} className="bg-[#050505]">{p.name}</option>
              ))}
            </select>
          </div>
          
          <button onClick={handleSpawnProject} className="bg-purple-500/10 text-purple-400 px-8 py-4 rounded-2xl hover:bg-purple-500/20 transition-all text-[10px] font-black flex items-center gap-4 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)] uppercase tracking-widest group">
            <Rocket className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Spawn Project
          </button>

          <button onClick={handleNewTask} className="bg-emerald-500/10 text-emerald-400 px-8 py-4 rounded-2xl hover:bg-emerald-500/20 transition-all text-[10px] font-black flex items-center gap-4 border border-emerald-500/20 uppercase tracking-widest">
            <Plus className="w-4 h-4" /> Inject Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((status) => (
          <div key={status} className="glass-card p-8 min-h-[700px] flex flex-col border border-white/5 shadow-2xl">
            <h3 className="text-[10px] font-black text-zinc-500 mb-8 uppercase tracking-[0.4em] flex justify-between items-center border-b border-white/5 pb-6">
              {status.replace('_', ' ')}
              <span className="bg-white/5 px-3 py-1.5 rounded-xl text-zinc-400 font-mono text-[10px] font-bold border border-white/5">{filteredTasks.filter((t:any) => t.status === status).length}</span>
            </h3>
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
              {filteredTasks.filter((t:any) => t.status === status).map((task:any, i:number) => {
                const project = state.projects.find((p: any) => p.id === task.projectId);
                return (
                  <div key={i} className={`bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-emerald-500/40 transition-all cursor-pointer group relative overflow-hidden ${status === 'DONE' ? 'opacity-30 grayscale' : 'shadow-xl hover:translate-y-[-2px]'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-mono text-zinc-600 bg-black px-2.5 py-1.5 rounded-lg border border-white/5 w-fit font-bold">{task.id}</span>
                        {project && (
                          <span className="text-[8px] font-black text-purple-400/80 uppercase tracking-[0.2em]">{project.name}</span>
                        )}
                      </div>
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border ${
                        task.priority === 'HIGH' || task.priority === 'CRITICAL' 
                          ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                          : 'bg-zinc-800/50 text-zinc-500 border-white/5'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-zinc-200 mb-6 leading-tight group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{task.title}</h4>
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-[11px] font-black text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                          {task.owner[0]}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{task.owner}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
