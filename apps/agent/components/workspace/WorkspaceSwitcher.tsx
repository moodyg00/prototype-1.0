'use client';

import { ChevronDown, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { WorkspaceEditorModal } from '@/components/workspace/WorkspaceEditorModal';

export function WorkspaceSwitcher() {
  const { layouts, activeLayoutId, switchWorkspace, resetActiveWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const active = layouts.find((layout) => layout.id === activeLayoutId);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/6"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="max-w-32 truncate">{active?.name ?? 'Workspace'}</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        </button>

        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[60]"
              aria-label="Close workspace menu"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 z-[61] mt-1 w-56 overflow-hidden rounded-md border border-white/10 bg-[#111113] py-1 shadow-xl">
              {layouts.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  className="flex w-full items-center px-3 py-2 text-left text-xs hover:bg-white/6"
                  onClick={() => {
                    switchWorkspace(layout.id);
                    setOpen(false);
                  }}
                >
                  <span className={layout.id === activeLayoutId ? 'text-blue-300' : 'text-zinc-300'}>
                    {layout.name}
                  </span>
                </button>
              ))}
              <div className="my-1 border-t border-white/8" />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/6"
                onClick={() => {
                  setOpen(false);
                  setEditorOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add new workspace
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-400 hover:bg-white/6"
                onClick={() => {
                  if (window.confirm('Reset this workspace session to defaults?')) {
                    resetActiveWorkspace();
                    setOpen(false);
                  }
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset layout
              </button>
            </div>
          </>
        ) : null}
      </div>

      <WorkspaceEditorModal open={editorOpen} onOpenChange={setEditorOpen} />
    </>
  );
}