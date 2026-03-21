import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GitCommit, Layers, Server, Code, Zap } from 'lucide-react';

interface FactoryTabProps {
  state: any;
  handleStartBuild: () => void;
  handleDeploy: (buildId: string) => void;
}

export const FactoryTab = ({ state, handleStartBuild, handleDeploy }: FactoryTabProps) => {
  const [contribution, setContribution] = useState({ action: '', impact: 'MEDIUM' });

  const submitContribution = async () => {
    if (!contribution.action) return;
    await fetch('/api/factory/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'User', ...contribution })
    });
    setContribution({ action: '', impact: 'MEDIUM' });
  };

  return (
    <motion.div key="factory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Build Pipeline */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold flex items-center gap-3">
                <GitCommit className="w-5 h-5 text-blue-400" /> Active Build Pipeline
              </h3>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Success Rate</p>
                  <p className="text-sm font-mono text-emerald-400 font-bold">{state.factory.stats.successRate.toFixed(1)}%</p>
                </div>
                <div className="w-px h-8 bg-white/5"></div>
                <div className="text-center">
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Total Builds</p>
                  <p className="text-sm font-mono text-blue-400 font-bold">{state.factory.stats.totalBuilds}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {state.factory.builds.map((build: any) => (
                <div key={build.id} className="p-5 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-blue-500/20 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className={`p-3 rounded-xl ${
                      build.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                      build.status === 'BUILDING' ? 'bg-blue-500/10 text-blue-400 animate-pulse' :
                      'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-sm font-bold text-zinc-200">{build.id}</h4>
                        <span className="text-[10px] font-mono text-zinc-600">{build.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          build.status === 'SUCCESS' ? 'text-emerald-500' :
                          build.status === 'BUILDING' ? 'text-blue-500' :
                          'text-zinc-500'
                        }`}>{build.status}</span>
                      </div>
                    </div>
                  </div>
                  {build.status === 'SUCCESS' && (
                    <button 
                      onClick={() => handleDeploy(build.id)}
                      className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      Deploy to Staging
                    </button>
                  )}
                </div>
              ))}
              {state.factory.builds.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <p className="text-zinc-600 text-sm font-medium">No active builds in pipeline.</p>
                  <button onClick={handleStartBuild} className="mt-4 text-emerald-400 text-xs font-bold hover:underline">Trigger Initial Build</button>
                </div>
              )}
            </div>
          </div>

          {/* Active Deployments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.factory.deployments.map((deploy: any) => (
              <div key={deploy.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">{deploy.env}</h4>
                    <p className="text-[10px] font-mono text-zinc-500">Build: {(deploy.id || '').split('_')[1] || 'N/A'}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                  {deploy.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Contributions & Manual Input */}
        <div className="space-y-8">
          <div className="bg-[#080808] border border-white/5 rounded-3xl p-8 flex flex-col h-[400px]">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-3">
              <Code className="w-4 h-4 text-purple-500" /> Agent Contributions
            </h3>
            <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar flex-1">
              {state.factory.stats.recentContributions.map((c: any, i: number) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{c.agentId}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                      c.impact === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'
                    }`}>{c.impact} Impact</span>
                  </div>
                  <p className="text-sm text-zinc-300 font-medium leading-snug">{c.action}</p>
                  <p className="text-[9px] text-zinc-600 font-mono mt-2">{new Date(c.timestamp).toLocaleTimeString()}</p>
                </div>
              ))}
              {state.factory.stats.recentContributions.length === 0 && (
                <p className="text-center text-zinc-600 text-xs py-10 italic">Waiting for agent activity...</p>
              )}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Manual Contribution</h3>
            <div className="space-y-4">
              <textarea 
                value={contribution.action}
                onChange={(e) => setContribution({ ...contribution, action: e.target.value })}
                placeholder="Describe your contribution..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-purple-500/50 transition-colors min-h-[100px]"
              />
              <div className="flex items-center justify-between">
                <select 
                  value={contribution.impact}
                  onChange={(e) => setContribution({ ...contribution, impact: e.target.value })}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest outline-none"
                >
                  <option value="LOW">Low Impact</option>
                  <option value="MEDIUM">Medium Impact</option>
                  <option value="HIGH">High Impact</option>
                </select>
                <button 
                  onClick={submitContribution}
                  className="px-6 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-purple-500/20"
                >
                  Log Work
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
