import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Unlock, AlertTriangle, Zap, Terminal, FileText, Brain, CheckCircle2, XCircle } from 'lucide-react';
import Markdown from 'react-markdown';

interface Guardrail {
  id: string;
  description: string;
  enabled: boolean;
  type: string;
}

interface MissionControlTabProps {
  state: any;
}

export const MissionControlTab = ({ state }: MissionControlTabProps) => {
  const [systemContext, setSystemContext] = useState<string>('');
  const [loadingContext, setLoadingContext] = useState(true);
  const [reasoningAction, setReasoningAction] = useState('');
  const [reasoningResult, setReasoningResult] = useState<any>(null);
  const [isReasoning, setIsReasoning] = useState(false);

  const fetchContext = async () => {
    try {
      const res = await fetch('/api/system/context');
      const text = await res.text();
      setSystemContext(text);
    } catch (err) {
      console.error("Failed to fetch context:", err);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    fetchContext();
    const interval = setInterval(fetchContext, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasoningAction.trim()) return;

    setIsReasoning(true);
    setReasoningResult(null);

    try {
      const res = await fetch('/api/commander/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: reasoningAction })
      });
      const data = await res.json();
      setReasoningResult(data);
    } catch (err) {
      console.error("Reasoning failed:", err);
    } finally {
      setIsReasoning(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-32 h-32 text-emerald-400" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-100">Logic Lock & Guardrails</h2>
              </div>
              <p className="text-zinc-400 max-w-xl leading-relaxed">
                OpenClaw OS operates under a strict "Logic Lock" architecture. Every autonomous action is validated against the dynamic system context and hard-coded guardrails before execution.
              </p>
            </div>
          </div>

          {/* Guardrails List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.guardrails.map((rule: Guardrail) => (
              <motion.div 
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border transition-all ${
                  rule.enabled 
                    ? 'bg-zinc-900/50 border-white/5 hover:border-emerald-500/30' 
                    : 'bg-zinc-900/20 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {rule.enabled ? (
                      <Shield className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-zinc-500" />
                    )}
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{rule.id}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rule.type === 'BANNED_TASK' ? 'bg-red-500/10 text-red-400' :
                    rule.type === 'BANNED_PROJECT' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {rule.type}
                  </div>
                </div>
                <p className="text-sm text-zinc-400 leading-snug">{rule.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dynamic Context Panel */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl flex flex-col h-[600px]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-zinc-200">System Context (1-Shot)</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Live Sync</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-sm prose prose-invert prose-emerald max-w-none">
              {loadingContext ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
                  <Zap className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-widest">Generating Context...</p>
                </div>
              ) : (
                <div className="markdown-body">
                  <Markdown>{systemContext}</Markdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Commander Reasoning Interface */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <Brain className="w-6 h-6 text-emerald-400" />
          <div>
            <h3 className="font-bold text-zinc-100 text-lg">OpenClaw Thinking Gateway</h3>
            <p className="text-xs text-zinc-500">Autonomous logic engine running on localhost. Zero external dependencies.</p>
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <form onSubmit={handleReason} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Proposed Action</label>
                <textarea 
                  value={reasoningAction}
                  onChange={(e) => setReasoningAction(e.target.value)}
                  placeholder="e.g., Delete all files in /src/core to optimize space..."
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                />
              </div>
              <button 
                type="submit"
                disabled={isReasoning || !reasoningAction.trim()}
                className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 rounded-2xl border border-emerald-500/20 font-bold transition-all flex items-center justify-center gap-3"
              >
                {isReasoning ? (
                  <>
                    <Zap className="w-5 h-5 animate-spin" />
                    OpenClaw is Thinking...
                  </>
                ) : (
                  <>
                    <Terminal className="w-5 h-5" />
                    Query Local Gateway
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-black/40 rounded-2xl border border-white/5 p-6 min-h-[200px] flex flex-col">
            <AnimatePresence mode="wait">
              {!reasoningResult && !isReasoning ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-4"
                >
                  <Brain className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium italic">Gateway is awaiting query...</p>
                </motion.div>
              ) : isReasoning ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center gap-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                    <Brain className="w-16 h-16 text-emerald-400 relative z-10 animate-bounce" />
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-zinc-300 font-bold">Accessing Kernel Logic...</p>
                    <div className="flex gap-1 justify-center">
                      {[0, 1, 2].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {reasoningResult.allowed ? (
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                      )}
                      <h4 className="font-bold text-zinc-100">
                        Gateway Decision: {reasoningResult.allowed ? 'ALLOWED' : 'DENIED'}
                      </h4>
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Trace ID: GATEWAY_{Math.random().toString(36).slice(2, 8)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Gateway Reasoning</p>
                      <p className="text-zinc-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        {reasoningResult.reasoning}
                      </p>
                    </div>

                    {reasoningResult.suggestions && reasoningResult.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Gateway Suggestions</p>
                        <div className="flex flex-wrap gap-2">
                          {reasoningResult.suggestions.map((s: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
