"use client";

import React, { useState, useCallback } from 'react';
import { WorkspaceCanvas } from '../components/WorkspaceCanvas';
import { WORKSPACES, type WorkspaceId } from '../lib/workspaces';

export default function AdminAgentShell() {
  const [toggleTarget, setToggleTarget] = useState<WorkspaceId | null>(null);

  const handleNavClick = useCallback((id: WorkspaceId) => {
    setToggleTarget(id);
  }, []);

  const handleToggleConsumed = useCallback(() => {
    setToggleTarget(null);
  }, []);

  return (
    <div className="app-shell">
      <header className="header flex items-center px-4 gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 pr-3 border-r border-white/10">
          <div className="w-7 h-7 rounded bg-white text-zinc-950 flex items-center justify-center font-bold text-sm tracking-tighter">AA</div>
          <div>
            <div className="font-semibold text-sm tracking-tight">admin-agent</div>
            <div className="text-[10px] text-zinc-500 -mt-0.5">control plane</div>
          </div>
        </div>

        <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto py-1 no-scrollbar">
          {WORKSPACES.map(workspace => {
            const Icon = workspace.icon;
            return (
              <button
                key={workspace.id}
                onClick={() => handleNavClick(workspace.id)}
                className="nav-link"
                title={workspace.description}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{workspace.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-mono border border-white/10">G</div>
        </div>
      </header>

      <div className="app-pane">
        <WorkspaceCanvas
          toggleTarget={toggleTarget}
          onToggleConsumed={handleToggleConsumed}
        />
      </div>
    </div>
  );
}
