import React from 'react';
import { motion } from 'motion/react';
import { Box, Database } from 'lucide-react';

export const MCPTab = ({ state }: { state: any }) => {
  return (
    <motion.div key="mcp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-4">
          <Box className="w-8 h-8 text-purple-500" /> Tool Bus (MCP)
        </h2>
        <p className="text-zinc-500 text-sm font-medium">Standardized tool access via Model Context Protocol. Least privilege enforced.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.mcp.map((tool:any, i:number) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 hover:border-purple-500/30 transition-all group">
            <div className="flex items-center justify-between mb-8">
              <div className="p-3 bg-white/5 rounded-2xl text-zinc-400 group-hover:text-purple-400 transition-colors">
                <Database className="w-6 h-6" />
              </div>
              <div className={`w-2 h-2 rounded-full ${tool.status === 'AVAILABLE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'} animate-pulse`}></div>
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">{tool.name}</h3>
            <div className="space-y-4 pt-6 border-t border-white/5">
              <div>
                <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-black mb-2">Permission Level</p>
                <span className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-black font-mono uppercase tracking-widest ${
                  tool.permission === 'READ_ONLY' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  tool.permission === 'REQUIRES_APPROVAL' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                  'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {tool.permission}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
