import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Loader2, Sparkles } from 'lucide-react';

interface ThinkingOverlayProps {
  isThinking: boolean;
  prompt: string;
}

export const ThinkingOverlay = ({ isThinking, prompt }: ThinkingOverlayProps) => {
  return (
    <AnimatePresence>
      {isThinking && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-black border-2 border-emerald-500/40 rounded-none p-10 max-w-2xl w-full shadow-[0_0_50px_rgba(16,185,129,0.2)] relative overflow-hidden neon-glow"
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-pink-500/5 animate-pulse"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-none animate-pulse"></div>
                <div className="bg-emerald-500/10 p-6 rounded-none border border-emerald-500/20 relative">
                  <Brain className="w-12 h-12 text-emerald-400 animate-bounce" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white flex items-center justify-center gap-3 uppercase tracking-tighter neon-text-emerald">
                  Thinking Gateway <Sparkles className="w-5 h-5 text-emerald-400" />
                </h2>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-none p-6 font-mono text-sm text-emerald-500/60 italic">
                  "{prompt}"
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                <div className="w-full h-1 bg-emerald-500/10 rounded-none overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-emerald-500/60">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Autonomous Planning in Progress
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                {[
                  "Analyzing Intent",
                  "Decomposing Tasks",
                  "Assigning Agents",
                  "Validating Guardrails"
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 bg-emerald-500/5 rounded-none px-4 py-3 border border-emerald-500/10">
                    <div className="w-1.5 h-1.5 rounded-none bg-emerald-500/40 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-wider">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
