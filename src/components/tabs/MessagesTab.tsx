import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, User, Terminal, Zap, Shield, Cpu } from 'lucide-react';

export const MessagesTab = ({ state }: { state: any }) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('all');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await fetch('/api/agent/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'User',
          recipient,
          type: 'COMMAND',
          payload: { text: message },
          priority: 'medium'
        })
      });
      setMessage('');
    } catch (err) {
      console.error("Failed to send agent message", err);
    }
  };

  return (
    <motion.div 
      key="messages" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="space-y-12 max-w-7xl mx-auto relative z-10 h-full flex flex-col"
    >
      <div className="flex justify-between items-end gap-8 mb-4">
        <div className="space-y-3">
          <h2 className="text-5xl font-black tracking-tighter text-white flex items-center gap-6 uppercase">
            <MessageSquare className="w-10 h-10 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]" /> Agent Comm Bus
          </h2>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em] ml-1">Real-time inter-agent messaging and command execution</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-[600px]">
        {/* Active Agents List */}
        <div className="glass-card p-8 border border-white/5 shadow-2xl space-y-8">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] border-b border-white/5 pb-6">Connected Agents</h3>
          <div className="space-y-4">
            {state.agents?.map((agent: any, i: number) => (
              <button 
                key={i} 
                onClick={() => setRecipient(agent.name)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                  recipient === agent.name ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${agent.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                <div className="text-left">
                  <p className={`text-xs font-black uppercase tracking-widest ${recipient === agent.name ? 'text-purple-400' : 'text-zinc-300'}`}>{agent.name}</p>
                  <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">{agent.type}</p>
                </div>
              </button>
            ))}
            <button 
              onClick={() => setRecipient('all')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                recipient === 'all' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <div className="text-left">
                <p className={`text-xs font-black uppercase tracking-widest ${recipient === 'all' ? 'text-purple-400' : 'text-zinc-300'}`}>Broadcast (All)</p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">System-wide</p>
              </div>
            </button>
          </div>
        </div>

        {/* Message History */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-card flex-1 p-8 border border-white/5 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6">
              {(state.messages || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4">
                  <Terminal className="w-12 h-12 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">No messages in buffer</p>
                </div>
              ) : (
                state.messages.map((msg: any, i: number) => (
                  <div key={i} className={`flex flex-col ${msg.sender === 'User' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] p-5 rounded-2xl border ${
                      msg.sender === 'User' 
                        ? 'bg-purple-500/10 border-purple-500/20 rounded-tr-none' 
                        : 'bg-white/[0.03] border-white/10 rounded-tl-none'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${msg.sender === 'User' ? 'text-purple-400' : 'text-emerald-400'}`}>
                          {msg.sender}
                        </span>
                        <span className="text-zinc-700 text-[8px] font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        {msg.recipient !== 'all' && (
                          <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">→ {msg.recipient}</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                        {typeof msg.payload === 'string' ? msg.payload : (msg.payload?.text || JSON.stringify(msg.payload))}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          msg.type === 'COMMAND' ? 'bg-red-500/10 text-red-500' : 
                          msg.type === 'STATUS' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {msg.type}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-700">{msg.id}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="mt-8 pt-8 border-t border-white/5 flex gap-4">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Command ${recipient === 'all' ? 'all agents' : recipient}...`}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/50 transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mr-2">Target: {recipient}</span>
                </div>
              </div>
              <button 
                type="submit"
                className="bg-purple-500 text-white px-8 py-4 rounded-2xl hover:bg-purple-600 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.4)] group"
              >
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">Transmit</span>
              </button>
            </form>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'System Status', icon: Zap, type: 'QUERY', payload: { action: 'status_report' } },
              { label: 'Security Sweep', icon: Shield, type: 'COMMAND', payload: { action: 'security_sweep' } },
              { label: 'Agent Sync', icon: Cpu, type: 'BROADCAST', payload: { action: 'sync_agents' } }
            ].map((action, i) => (
              <button 
                key={i}
                onClick={() => {
                  setRecipient('all');
                  setMessage(action.label);
                  // Optionally auto-send
                }}
                className="glass-card p-4 hover:bg-white/[0.05] transition-all border border-white/5 flex items-center gap-4 group"
              >
                <div className="p-2 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <action.icon className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
