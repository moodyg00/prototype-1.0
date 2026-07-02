'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import { useAgents } from '../AgentsProvider';
import { AgentsPaneShell } from '../agents-pane-utils';

export function AgentPersonaPane({ context: _context }: { context: PaneRenderContext }) {
  const { selectedAgent, updateAgent } = useAgents();
  const [systemPrompt, setSystemPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [constraintsText, setConstraintsText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSystemPrompt(selectedAgent?.persona.systemPrompt ?? '');
    setStyle(selectedAgent?.persona.style ?? '');
    setConstraintsText((selectedAgent?.persona.constraints ?? []).join('\n'));
  }, [selectedAgent?.id, selectedAgent?.updatedAt]);

  async function handleSave() {
    if (!selectedAgent) return;
    setSaving(true);
    try {
      const constraints = constraintsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      await updateAgent({
        persona: {
          systemPrompt,
          style: style.trim() || undefined,
          constraints: constraints.length ? constraints : undefined,
        },
      });
      toast.success('Persona saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!selectedAgent) {
    return (
      <AgentsPaneShell title="Persona">
        <p className="text-[11px] text-zinc-500">Select an agent to edit persona.</p>
      </AgentsPaneShell>
    );
  }

  return (
    <AgentsPaneShell title="Persona">
      <label className="flex flex-col gap-1 text-[11px]">
        <span className="text-zinc-500">System prompt</span>
        <textarea
          className="min-h-[120px] resize-y rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-[10px] text-zinc-200"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-[11px]">
        <span className="text-zinc-500">Style (optional)</span>
        <input
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="e.g. concise, technical, friendly"
        />
      </label>
      <label className="flex flex-col gap-1 text-[11px]">
        <span className="text-zinc-500">Constraints (one per line)</span>
        <textarea
          className="min-h-[64px] resize-y rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[10px] text-zinc-200"
          value={constraintsText}
          onChange={(e) => setConstraintsText(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="w-fit rounded bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-900 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save persona'}
      </button>
    </AgentsPaneShell>
  );
}