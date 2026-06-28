'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

export function WorkspaceEditorModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  return (
    <div className="overlay-layer fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#111113] p-5 shadow-2xl">
        <h2 className="text-sm font-semibold text-zinc-100">New workspace</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Create a blank layout. Pin bars, containers, and tools from the live UI.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-400">Name</span>
            <input
              className="input w-full"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ops desk"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-400">Description</span>
            <textarea
              className="input min-h-20 w-full resize-y"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional notes"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const trimmed = name.trim();
              if (!trimmed) return;
              createWorkspace(trimmed, description.trim() || undefined);
              setName('');
              setDescription('');
              onOpenChange(false);
            }}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}