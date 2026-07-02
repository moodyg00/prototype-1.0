'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import { getTool, TOOLBAR_TOOL_IDS, type ToolId } from '@/lib/tools';
import { isAgentToolEnabled } from '@/lib/agents/tool-policy';
import { useAgents } from '../AgentsProvider';
import { AgentsPaneShell } from '../agents-pane-utils';

const SELECTABLE_TOOLS = TOOLBAR_TOOL_IDS.filter((id) => id !== 'agents');

export function AgentToolsPane({ context: _context }: { context: PaneRenderContext }) {
  const { selectedAgent, updateAgent } = useAgents();
  const [draft, setDraft] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);

  const unrestricted = (selectedAgent?.tools.enabledToolIds?.length ?? 0) === 0;

  useEffect(() => {
    setDraft(null);
  }, [selectedAgent?.id, selectedAgent?.updatedAt]);

  const effectiveEnabled = useMemo(() => {
    if (!selectedAgent) return new Set<string>();
    if (draft) return new Set(draft);
    if (unrestricted) return new Set(SELECTABLE_TOOLS);
    return new Set(selectedAgent.tools.enabledToolIds);
  }, [selectedAgent, draft, unrestricted]);

  function toggle(toolId: ToolId, on: boolean) {
    if (!selectedAgent) return;
    let next: string[];
    if (draft) {
      next = [...draft];
    } else if (unrestricted) {
      next = [...SELECTABLE_TOOLS];
    } else {
      next = [...selectedAgent.tools.enabledToolIds];
    }
    if (on && !next.includes(toolId)) next.push(toolId);
    if (!on) next = next.filter((id) => id !== toolId);
    setDraft(next);
  }

  async function save() {
    if (!selectedAgent) return;
    setSaving(true);
    try {
      const enabledToolIds =
        draft !== null ? draft : unrestricted ? [] : [...selectedAgent.tools.enabledToolIds];
      await updateAgent({
        tools: { enabledToolIds },
      });
      setDraft(null);
      toast.success('Tool policy saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function allowAll() {
    setDraft([]);
  }

  if (!selectedAgent) {
    return (
      <AgentsPaneShell title="Agent tools">
        <p className="text-[11px] text-zinc-500">Select an agent first.</p>
      </AgentsPaneShell>
    );
  }

  return (
    <AgentsPaneShell title="Agent tools">
      <p className="text-[10px] text-zinc-500">
        {unrestricted && !draft
          ? 'All toolbar tools allowed (no restriction in system prompt).'
          : 'Only checked tools are injected into the chat system prompt.'}
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {SELECTABLE_TOOLS.map((toolId) => {
          const tool = getTool(toolId);
          const checked = effectiveEnabled.has(toolId);
          return (
            <label
              key={toolId}
              className="flex cursor-pointer items-center gap-2 rounded border border-zinc-800 px-2 py-1 text-[10px] text-zinc-300"
            >
              <input
                type="checkbox"
                className="accent-violet-500"
                checked={checked}
                onChange={(e) => toggle(toolId, e.target.checked)}
              />
              {tool.label}
            </label>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded bg-zinc-100 px-3 py-1 text-[10px] font-medium text-zinc-900 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save tools'}
        </button>
        <button
          type="button"
          onClick={allowAll}
          className="rounded border border-zinc-600 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-800"
        >
          Allow all
        </button>
      </div>
      <p className="text-[10px] text-zinc-600">
        Runtime: workflow tools are advisory via prompt until per-workflow enforcement lands.
        Current:{' '}
        {SELECTABLE_TOOLS.filter((id) => isAgentToolEnabled(selectedAgent, id))
          .map((id) => getTool(id).label)
          .join(', ') || 'all'}
      </p>
    </AgentsPaneShell>
  );
}