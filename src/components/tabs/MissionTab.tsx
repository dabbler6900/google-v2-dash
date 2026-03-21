import React from 'react';
import { motion } from 'motion/react';
import { Shield, Terminal as TerminalIcon, Cpu, ListFilter, ShieldAlert, Rocket, Activity, Zap } from 'lucide-react';

export const MissionTab = ({ state }: { state: any }) => {
  return (
    <motion.div 
      key="mission" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="space-y-12 max-w-7xl mx-auto relative z-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Commander Status */}
        <div className="lg:col-span-2 space-y-10">
          <section className="glass-card p-12 relative overflow-hidden group neon-glow">
            <div className="absolute -top-24 -right-24 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700">
              <Shield className="w-96 h-96 text-emerald-500" />
            </div>
            <div className="relative z-10 space-y-10">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-emerald-500/10 rounded-none border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <TerminalIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-4xl font-black tracking-tighter text-white uppercase neon-text-emerald">OpenClaw Commander</h3>
                  <p className="text-[10px] text-emerald-500/80 font-mono font-black tracking-[0.4em] uppercase mt-2">
                    {state.health?.connected ? 'Gateway Link: Synchronized' : 'Gateway Link: Local Mode'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-6">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-emerald-500/40 font-black">Current Mission Directive</h4>
                  <p className="text-2xl text-white leading-tight font-black italic border-l-4 border-emerald-500/40 pl-8 py-2 uppercase tracking-tighter">
                    "{state.commander?.mission || 'Initializing...'}"
                  </p>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-emerald-500/40 font-black">Operational Logic</h4>
                  <div className="flex flex-wrap gap-3">
                    {(state.commander?.loop || '').split(' → ').map((step: string, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold rounded-none border border-emerald-500/20 backdrop-blur-md">
                          {step}
                        </span>
                        {i < (state.commander?.loop || '').split(' → ').length - 1 && <span className="text-emerald-500/20 font-bold">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { label: 'Active Agents', value: state.agents?.filter((a:any) => a.status === 'ACTIVE' || a.status === 'WORKING').length || 0, color: 'emerald', icon: Cpu },
              { label: 'Pending Tasks', value: state.tasks?.filter((t:any) => t.status === 'TODO').length || 0, color: 'emerald', icon: ListFilter },
              { label: 'Security Alerts', value: state.quarantine?.length || 0, color: 'pink', icon: ShieldAlert },
              { label: 'System Goals', value: (state.memory || []).filter((m:any) => m.type === 'Goal').length, color: 'emerald', icon: Rocket },
              { label: 'Kernel Power', value: state.processor?.kernelPower || '0%', color: 'emerald', icon: Zap }
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 hover:bg-emerald-500/5 transition-all group cursor-default">
                <div className={`p-2.5 bg-emerald-500/10 rounded-none w-fit mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                  <stat.icon className={`w-4 h-4 text-emerald-400`} />
                </div>
                <h4 className="text-[9px] uppercase tracking-[0.2em] text-emerald-500/40 font-black mb-1">{stat.label}</h4>
                <p className="text-3xl font-black text-white font-mono tracking-tighter">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Projects & Subagents */}
        <div className="glass-card p-10 flex flex-col h-[650px] shadow-2xl neon-glow">
          <div className="flex items-center justify-between mb-10 shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60 flex items-center gap-4">
              <Rocket className="w-5 h-5 text-emerald-500" /> Active Projects
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-8">
            {(state.projects || []).length === 0 ? (
              <div className="text-center py-16 space-y-6">
                <div className="bg-emerald-500/5 p-6 rounded-none w-fit mx-auto animate-pulse border border-emerald-500/20">
                  <Rocket className="w-8 h-8 text-emerald-900" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-500/40 font-black">No Active Projects</p>
              </div>
            ) : (
              state.projects.map((project: any, i: number) => (
                <div key={i} className="bg-emerald-500/[0.02] border border-emerald-500/10 rounded-none p-6 space-y-4 group hover:border-emerald-500/40 transition-all hover:translate-x-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{project.name}</h4>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-none ${
                      project.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-500/60 leading-relaxed line-clamp-2 font-medium">
                    {project.description}
                  </p>
                  <div className="flex items-center gap-6 pt-4 border-t border-emerald-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-none bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest">
                        {state.tasks?.filter((t: any) => t.projectId === project.id).length || 0} Tasks
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-500/20 font-bold">{project.createdAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-10 pt-10 border-t border-emerald-500/10 shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60 flex items-center gap-4 mb-8">
              <Cpu className="w-5 h-5 text-emerald-500" /> Subagent Matrix
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {['Ralph', 'TaskProcessor', 'ThinkingGateway', 'ProjectSoul'].map((agent, i) => (
                <div key={i} className="flex items-center gap-4 bg-emerald-500/[0.02] rounded-none px-5 py-4 border border-emerald-500/10 hover:border-emerald-500/40 transition-all group">
                  <div className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">{agent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
