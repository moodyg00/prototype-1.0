'use client';

import { FlasksChemistryIcon } from '@prototype/icons';
import { Bell, ChevronDown, LayoutGrid, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher';
import { cn } from '@/lib/utils';

export function AgentHeader() {
  const { layoutEditMode, setLayoutEditMode, activeLayout } = useWorkspace();
  const [layoutSavedFlash, setLayoutSavedFlash] = useState(false);

  useEffect(() => {
    if (!layoutSavedFlash) return;
    const timer = window.setTimeout(() => setLayoutSavedFlash(false), 2200);
    return () => window.clearTimeout(timer);
  }, [layoutSavedFlash]);

  const toggleLayoutEditMode = useCallback(() => {
    if (layoutEditMode) {
      setLayoutSavedFlash(true);
    }
    setLayoutEditMode(!layoutEditMode);
  }, [layoutEditMode, setLayoutEditMode]);

  return (
    <header className="header chrome-header relative z-[40] flex h-14 shrink-0 items-center gap-4 px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <FlasksChemistryIcon size={32} className="shrink-0" title="App Lab" />
          <span className="text-sm font-semibold tracking-tight text-zinc-100">App Lab</span>
        </div>
        <WorkspaceSwitcher />
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
            layoutSavedFlash
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
              : layoutEditMode
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-100'
                : 'border-white/10 text-zinc-400 hover:bg-white/6 hover:text-zinc-200',
          )}
          onClick={toggleLayoutEditMode}
          title={
            layoutEditMode
              ? `Changes save automatically to "${activeLayout.name}". Click to finish editing.`
              : 'Edit bars and panel zones. Changes save to the current workspace as you go.'
          }
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          {layoutSavedFlash
            ? 'Saved'
            : layoutEditMode
              ? `Editing · ${activeLayout.name}`
              : 'Edit layout'}
        </button>
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