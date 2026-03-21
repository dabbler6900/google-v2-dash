import React from 'react';
import { motion } from 'motion/react';
import { Inbox, Clock, Eye, Zap } from 'lucide-react';

interface InboxTabProps {
  state: any;
  handleTriage: (id: string) => void;
}

export const InboxTab = ({ state, handleTriage }: InboxTabProps) => {
  return (
    <motion.div key="inbox" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-4">
          <Inbox className="w-8 h-8 text-blue-500" /> Event Intake Pipeline
        </h2>
        <p className="text-zinc-500 text-sm font-medium">Feedback from sub-agents and external API plugs. Triage required for execution.</p>
      </div>
      
      <div className="space-y-4">
        {state.inbox.map((evt:any, i:number) => (
          <div key={i} className="group relative">
            <div className="absolute -inset-px bg-gradient-to-r from-blue-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl gap-6 transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                  {evt.source === 'cron' ? <Clock className="w-6 h-6" /> : 
                   evt.source === 'watcher' ? <Eye className="w-6 h-6" /> : 
                   <Zap className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{evt.source}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span className="text-[10px] font-mono text-zinc-600 font-bold">{evt.time}</span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-200">{evt.title}</h4>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${evt.status === 'UNREAD' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                  {evt.status}
                </span>
                {evt.status === 'UNREAD' && (
                  <button 
                    onClick={() => handleTriage(evt.id)}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-100 text-xs font-bold rounded-xl border border-white/10 transition-all active:scale-95"
                  >
                    Triage Signal
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {state.inbox.length === 0 && (
          <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-zinc-600 font-medium">No pending signals in intake.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
