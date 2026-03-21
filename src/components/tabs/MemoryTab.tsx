import React from 'react';
import { motion } from 'motion/react';
import { Database, FileText, Clock, Eye } from 'lucide-react';

export const MemoryTab = ({ state }: { state: any }) => {
  return (
    <motion.div key="memory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-4">
          <Database className="w-8 h-8 text-emerald-500" /> System Memory
        </h2>
        <p className="text-zinc-500 text-sm font-medium">Source of truth for mission, goals, and long-term state. Prevents system drift.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.memory.map((doc:any, i:number) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 hover:border-emerald-500/30 transition-all group cursor-pointer">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6" /></div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{doc.title}</h3>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{doc.type}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" /> {doc.updated}
              </div>
              <Eye className="w-4 h-4 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
