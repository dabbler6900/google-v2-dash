import React from 'react';
import { motion } from 'motion/react';
import { Link2, ShieldCheck, ShieldAlert, Globe, Terminal, RefreshCcw } from 'lucide-react';

interface GatewayTabProps {
  state: any;
}

export const GatewayTab = ({ state }: GatewayTabProps) => {
  const isConnected = state.health?.connected;
  const gatewayUrl = state.health?.gatewayUrl || 'http://localhost:18789';

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 relative overflow-hidden neon-glow"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-none ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-pink-500/10 border-pink-500/20'} border shadow-2xl`}>
                  <Link2 className={`w-8 h-8 ${isConnected ? 'text-emerald-400' : 'text-pink-400'}`} />
                </div>
                <div>
                  <h3 className={`text-3xl font-black tracking-tighter text-white uppercase ${isConnected ? 'neon-text-emerald' : 'neon-text-pink'}`}>Gateway Connection</h3>
                  <p className="text-emerald-500/40 text-xs font-black tracking-widest uppercase mt-1">OpenClaw Integration Node</p>
                </div>
              </div>
              <div className={`px-6 py-2 rounded-none border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-pink-500/10 border-pink-500/20 text-pink-400'} text-[10px] font-black tracking-[0.2em] uppercase`}>
                {isConnected ? 'Active Link' : 'Link Offline'}
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-emerald-500/5 rounded-none border border-emerald-500/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Globe className="w-5 h-5 text-emerald-500/40" />
                    <span className="text-emerald-500/60 text-sm font-bold">Gateway Endpoint</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-sm">{gatewayUrl}</span>
                </div>
                <div className="w-full h-px bg-emerald-500/10"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Terminal className="w-5 h-5 text-emerald-500/40" />
                    <span className="text-emerald-500/60 text-sm font-bold">Protocol</span>
                  </div>
                  <span className="text-emerald-300 font-mono text-sm uppercase tracking-widest">OpenResponses v1.2</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-none border border-emerald-500/20 text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3">
                  <RefreshCcw className="w-4 h-4" />
                  Re-Probe Gateway
                </button>
                <button className="px-8 py-4 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500/40 rounded-none border border-emerald-500/10 text-xs font-black tracking-widest uppercase transition-all">
                  Settings
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 border-emerald-500/10">
              <div className="flex items-center gap-4 mb-6">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-black tracking-widest text-emerald-500/60 uppercase">Trusted Proxies</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-none border border-emerald-500/10">
                  <span className="text-emerald-500/40 text-[10px] font-mono">127.0.0.1</span>
                  <span className="text-emerald-500 text-[10px] font-bold uppercase">Local</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-none border border-emerald-500/10 opacity-50">
                  <span className="text-emerald-500/40 text-[10px] font-mono">172.17.0.1</span>
                  <span className="text-emerald-500/60 text-[10px] font-bold uppercase">Docker</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 border-emerald-500/10">
              <div className="flex items-center gap-4 mb-6">
                <ShieldAlert className="w-5 h-5 text-pink-400" />
                <h4 className="text-sm font-black tracking-widest text-emerald-500/60 uppercase">Auth Mode</h4>
              </div>
              <div className="p-4 bg-pink-500/5 rounded-none border border-pink-500/10">
                <p className="text-pink-400/80 text-[10px] font-black tracking-widest uppercase leading-relaxed">
                  Token-based authentication is enforced for all external RPC calls.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-8 border-emerald-500/10">
            <h4 className="text-xs font-black tracking-[0.2em] text-emerald-500/40 uppercase mb-6">Gateway Logs</h4>
            <div className="space-y-4 font-mono text-[10px]">
              <div className="text-emerald-500/60"><span className="text-emerald-500/20">[06:37:01]</span> <span className="text-emerald-400">INFO</span> Gateway listener active on :18789</div>
              <div className="text-emerald-500/60"><span className="text-emerald-500/20">[06:37:05]</span> <span className="text-emerald-400">OK</span> Heartbeat broadcast successful</div>
              <div className={`text-emerald-500/60 ${!isConnected ? 'text-pink-400/80' : ''}`}><span className="text-emerald-500/20">[06:37:09]</span> {isConnected ? <><span className="text-emerald-400">INFO</span> State sync complete</> : <><span className="text-pink-400">ERR</span> Connection refused</>}</div>
            </div>
          </div>

          <div className="glass-card p-8 border-emerald-500/10 bg-emerald-500/5">
            <h4 className="text-xs font-black tracking-[0.2em] text-emerald-400 uppercase mb-4">Documentation</h4>
            <p className="text-emerald-500/40 text-[10px] leading-relaxed mb-6">
              OpenClaw Gateway provides the unified API for all autonomous operations. Ensure your GEMINI_API_KEY is correctly configured in the gateway environment.
            </p>
            <a href="https://docs.openclaw.ai" target="_blank" className="text-emerald-400 text-[10px] font-bold uppercase hover:underline">View Docs →</a>
          </div>
        </div>
      </div>
    </div>
  );
};
