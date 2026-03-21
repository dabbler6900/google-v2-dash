import React from 'react';
import { motion } from 'motion/react';
import { History } from 'lucide-react';

export const AuditTab = ({ state }: { state: any }) => {
  return (
    <motion.div key="audit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-4">
          <History className="w-8 h-8 text-blue-500" /> Audit Ledger
        </h2>
        <p className="text-zinc-500 text-sm font-medium">Immutable record of all system actions. Debuggable and trustworthy.</p>
      </div>
      
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="grid grid-cols-12 gap-6 p-6 border-b border-white/5 bg-white/[0.02] text-[10px] font-black tracking-[0.2em] text-zinc-600 uppercase">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">Agent</div>
          <div className="col-span-8">Action Log</div>
        </div>
        <div className="divide-y divide-white/5">
          {state.audit.map((log:any, i:number) => (
            <div key={i} className="grid grid-cols-12 gap-6 p-6 items-center hover:bg-white/[0.02] transition-colors group">
              <div className="col-span-2 text-[11px] font-mono text-zinc-500 font-bold">{log.time}</div>
              <div className="col-span-2 text-[11px] font-mono text-purple-500 font-black uppercase tracking-tighter">{log.agent}</div>
              <div className="col-span-8 text-sm text-zinc-300 font-medium group-hover:text-zinc-100 transition-colors">{log.action}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
