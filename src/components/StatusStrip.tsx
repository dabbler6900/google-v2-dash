import React from 'react';

interface StatusStripProps {
  activeTab: string;
  state: any;
}

export const StatusStrip = ({ activeTab, state }: StatusStripProps) => {
  return (
    <div className="mb-16 flex flex-wrap items-center justify-between gap-12 relative z-10">
      <div className="flex items-center gap-6">
        <div className={`w-4 h-4 rounded-full ${state.health?.status === 'OPERATIONAL' ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]' : 'bg-yellow-500 shadow-[0_0_20px_rgba(245,158,11,0.6)]'} animate-pulse`}></div>
        <h2 className="text-5xl font-black tracking-tighter text-white uppercase">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
        </h2>
      </div>
      
      <div className="flex items-center gap-12 glass-card px-10 py-5 shadow-2xl border border-white/10 neon-glow">
        <div className="flex flex-col">
          <span className="text-zinc-600 uppercase tracking-[0.4em] text-[10px] font-black mb-1">CPU Load</span>
          <span className="text-emerald-400 font-mono text-base font-black tracking-tighter">{state.health?.cpu || '0%'}</span>
        </div>
        <div className="w-px h-10 bg-white/10"></div>
        <div className="flex flex-col">
          <span className="text-zinc-600 uppercase tracking-[0.4em] text-[10px] font-black mb-1">Memory</span>
          <span className="text-blue-400 font-mono text-base font-black tracking-tighter">{state.health?.mem || '0GB'}</span>
        </div>
        <div className="w-px h-10 bg-white/10"></div>
        <div className="flex flex-col">
          <span className="text-zinc-600 uppercase tracking-[0.4em] text-[10px] font-black mb-1">Uptime</span>
          <span className="text-zinc-200 font-mono text-base font-black tracking-tighter">{state.health?.uptime || '0s'}</span>
        </div>
        <div className="w-px h-10 bg-white/10"></div>
        <div className="flex flex-col">
          <span className="text-zinc-600 uppercase tracking-[0.4em] text-[10px] font-black mb-1">OpenClaw</span>
          <span className={`${state.health?.connected ? 'text-emerald-400' : 'text-red-400'} font-mono text-base font-black tracking-tighter uppercase`}>
            {state.health?.connected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};
