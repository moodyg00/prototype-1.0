'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import { useAgents } from '../AgentsProvider';
import { AgentsPaneShell } from '../agents-pane-utils';

export function AgentTrainingPane({ context: _context }: { context: PaneRenderContext }) {
  const {
    selectedAgent,
    addTrainingExample,
    removeTrainingExample,
    exportTrainingJson,
  } = useAgents();
  const [user, setUser] = useState('');
  const [assistant, setAssistant] = useState('');
  const [saving, setSaving] = useState(false);

  const examples = selectedAgent?.training.examples ?? [];

  async function handleAdd() {
    if (!user.trim() || !assistant.trim()) {
      toast.error('Both user and assistant text required');
      return;
    }
    setSaving(true);
    try {
      await addTrainingExample({ user: user.trim(), assistant: assistant.trim() });
      setUser('');
      setAssistant('');
      toast.success('Example added');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    const json = exportTrainingJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedAgent?.id ?? 'agent'}-training.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!selectedAgent) {
    return (
      <AgentsPaneShell title="Training">
        <p className="text-[11px] text-zinc-500">Select an agent first.</p>
      </AgentsPaneShell>
    );
  }

  return (
    <AgentsPaneShell title="Training">
      <p className="text-[10px] text-zinc-500">
        {examples.length} example{examples.length === 1 ? '' : 's'} — injected into chat system
        prompt as few-shot turns.
      </p>

      <ul className="max-h-36 space-y-2 overflow-auto">
        {examples.map((ex, i) => (
          <li key={i} className="rounded border border-zinc-800 p-2 text-[10px]">
            <div className="text-zinc-500">User</div>
            <div className="text-zinc-300">{ex.user.slice(0, 200)}</div>
            <div className="mt-1 text-zinc-500">Assistant</div>
            <div className="text-zinc-300">{ex.assistant.slice(0, 200)}</div>
            <button
              type="button"
              className="mt-1 text-red-400/90 hover:underline"
              onClick={() => void removeTrainingExample(i)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="space-y-1 border-t border-zinc-800 pt-2">
        <textarea
          placeholder="User message"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="min-h-[40px] w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-200"
        />
        <textarea
          placeholder="Assistant reply"
          value={assistant}
          onChange={(e) => setAssistant(e.target.value)}
          className="min-h-[40px] w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-200"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleAdd()}
            className="rounded bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-900 disabled:opacity-50"
          >
            Add example
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded border border-zinc-600 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-800"
          >
            Export JSON
          </button>
        </div>
      </div>

      <p className="text-[10px] text-zinc-600">
        Tip: use the thumbs-up on assistant messages in Chat to save a turn here.
      </p>
    </AgentsPaneShell>
  );
}