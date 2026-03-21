import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Lock, AlertTriangle, FileWarning } from 'lucide-react';

interface SecurityTabProps {
  state: any;
  handleGrant: (id: string) => void;
  handleDeny: (id: string) => void;
}

export const SecurityTab = ({ state, handleGrant, handleDeny }: SecurityTabProps) => {
  return (
    <motion.div key="security" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-4">
          <ShieldAlert className="w-8 h-8 text-orange-500" /> Security Gates
        </h2>
        <p className="text-zinc-500 text-sm font-medium">Approval gates and quarantine patterns. System-wide policy enforcement.</p>
      </div>

      {/* Approvals */}
      <div className="bg-[#0a0a0a] border border-orange-500/10 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500 border border-orange-500/20 shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100">Pending Execution Requests</h3>
        </div>
        <div className="space-y-6">
          {state.approvals.map((req:any, i:number) => (
            <div key={i} className="p-8 bg-orange-500/[0.02] border border-orange-500/10 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-orange-500/[0.04] transition-colors">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-lg uppercase tracking-[0.2em] border border-red-500/20">{req.risk} RISK</span>
                  <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">Agent: {req.agent}</span>
                </div>
                <h4 className="text-lg font-bold text-zinc-200">Tool: {req.tool}</h4>
                <p className="text-xs text-zinc-500 font-mono bg-black/40 px-3 py-2 rounded-xl border border-white/5 inline-block">{req.target}</p>
              </div>
              <div className="flex gap-4 shrink-0">
                <button onClick={() => handleGrant(req.id)} className="px-8 py-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-2xl text-xs font-bold transition-all border border-emerald-500/20">Grant</button>
                <button onClick={() => handleDeny(req.id)} className="px-8 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl text-xs font-bold transition-all border border-red-500/20">Deny</button>
              </div>
            </div>
          ))}
          {state.approvals.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-zinc-600 text-sm font-medium italic">No pending execution requests.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quarantine */}
      <div className="bg-[#0a0a0a] border border-red-500/10 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20 shadow-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100">Isolated Assets (Quarantine)</h3>
        </div>
        <div className="space-y-6">
          {state.quarantine.map((q:any, i:number) => (
            <div key={i} className="p-6 bg-red-500/[0.02] border border-red-500/10 rounded-3xl flex items-start gap-6 group hover:bg-red-500/[0.04] transition-colors">
              <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
                <FileWarning className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="font-mono text-sm text-red-200 font-bold block">{q.file}</span>
                <p className="text-xs text-zinc-500 leading-relaxed">{q.reason}</p>
                <span className="text-[10px] text-red-500/60 font-mono font-bold block mt-2 uppercase tracking-widest">{q.time}</span>
              </div>
            </div>
          ))}
          {state.quarantine.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-zinc-600 text-sm font-medium italic">No quarantined assets detected.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
