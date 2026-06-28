'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="overlay-layer fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/55 p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close new workspace dialog"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-workspace-title"
        className="relative my-auto w-full max-w-md rounded-xl border border-white/10 bg-[#111113] p-5 shadow-2xl"
      >
        <h2 id="new-workspace-title" className="text-sm font-semibold text-zinc-100">
          New workspace
        </h2>
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
              autoFocus
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
    </div>,
    document.body,
  );
}