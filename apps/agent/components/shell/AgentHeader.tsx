'use client';

import { Bell, ChevronDown, Search } from 'lucide-react';
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher';

export function AgentHeader() {
  return (
    <header className="header chrome-header relative z-[40] flex h-14 shrink-0 items-center gap-4 px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-xs font-bold tracking-tighter text-zinc-950">
          Ag
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">Agent</div>
          <div className="-mt-0.5 text-[10px] text-zinc-500">control plane</div>
        </div>
        <WorkspaceSwitcher />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden w-64 lg:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            className="input w-full pl-9"
            placeholder="Search tools, runs, agents..."
            aria-label="Search"
          />
        </div>

        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/6 hover:text-zinc-100"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500" />
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full pe-1 transition-colors hover:bg-white/6"
          aria-label="User menu"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-[10px] font-mono">
            G
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        </button>
      </div>
    </header>
  );
}