"use client";

import React, { useState } from 'react';
import { Activity, ExternalLink } from 'lucide-react';

export function LangSmithPanel() {
  const [smithUrl, setSmithUrl] = useState('https://smith.langchain.com');

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
            <Activity size={15} className="text-zinc-300" />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-zinc-100 font-medium truncate">LangSmith</div>
            <div className="text-[10px] text-zinc-500 truncate">Trace dashboard via browser session</div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4 gap-3">
        <div className="flex gap-2">
          <input
            value={smithUrl}
            onChange={e => setSmithUrl(e.target.value)}
            className="input flex-1 text-xs"
            placeholder="https://smith.langchain.com"
          />
          <a href={smithUrl} target="_blank" rel="noreferrer" className="btn btn-ghost text-xs">
            <ExternalLink size={12} /> Open
          </a>
        </div>
        <div className="text-[11px] text-zinc-500">
          Sign in with Google inside this panel to access your LangChain traces.
        </div>
        <div className="flex-1 min-h-0 rounded-lg border border-white/10 overflow-hidden bg-black/40">
          <iframe src={smithUrl} className="w-full h-full" title="LangSmith" />
        </div>
      </div>
    </div>
  );
}
