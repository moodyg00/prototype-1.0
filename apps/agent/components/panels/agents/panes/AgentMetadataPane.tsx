'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import { useAgents } from '../AgentsProvider';
import { AgentsPaneShell } from '../agents-pane-utils';

export function AgentMetadataPane({ context: _context }: { context: PaneRenderContext }) {
  const {
    agents,
    selectedAgentId,
    selectedAgent,
    setSelectedAgentId,
    createAgent,
    updateAgent,
    refresh,
    loading,
    workflows,
    models,
  } = useAgents();
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'paused'>('active');
  const [defaultModelId, setDefaultModelId] = useState('');
  const [workflowId, setWorkflowId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedAgent) return;
    setName(selectedAgent.name);
    setDescription(selectedAgent.description ?? '');
    setStatus(selectedAgent.status);
    setDefaultModelId(selectedAgent.defaultModelId ?? '');
    setWorkflowId(selectedAgent.workflowId ?? '');
  }, [selectedAgent?.id, selectedAgent?.updatedAt]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const id = newId.trim();
    const displayName = newName.trim() || id;
    if (!id) {
      toast.error('Agent id (slug) is required');
      return;
    }
    try {
      await createAgent({ id, name: displayName });
      setNewId('');
      setNewName('');
      toast.success(`Created agent "${displayName}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function handleSaveMetadata() {
    if (!selectedAgent) return;
    setSaving(true);
    try {
      await updateAgent({
        name,
        description: description.trim() || undefined,
        status,
        defaultModelId: defaultModelId || undefined,
        workflowId: workflowId || undefined,
      });
      toast.success('Agent saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AgentsPaneShell title="Agent">
      <label className="flex flex-col gap-1 text-[11px]">
        <span className="text-zinc-500">Active agent</span>
        <select
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          disabled={loading || agents.length === 0}
        >
          {agents.length === 0 ? <option value="">No agents yet</option> : null}
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.id})
            </option>
          ))}
        </select>
      </label>

      {selectedAgent ? (
        <div className="space-y-2 border-t border-zinc-800 pt-2">
          <p className="text-[10px] text-zinc-500">
            Slug: <span className="font-mono text-zinc-400">{selectedAgent.id}</span>
          </p>
          <label className="flex flex-col gap-1 text-[11px]">
            <span className="text-zinc-500">Display name</span>
            <input
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            <span className="text-zinc-500">Description</span>
            <textarea
              className="min-h-[48px] rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[10px] text-zinc-200"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            <span className="text-zinc-500">Status</span>
            <select
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'paused')}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            <span className="text-zinc-500">Default model</span>
            <select
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[10px] text-zinc-200"
              value={defaultModelId}
              onChange={(e) => setDefaultModelId(e.target.value)}
            >
              <option value="">(chat picker default)</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            <span className="text-zinc-500">Chat workflow</span>
            <select
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[10px] text-zinc-200"
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
            >
              <option value="">Auto (Agent Chat Visual / direct LLM)</option>
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveMetadata()}
            className="rounded bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-900 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save metadata'}
          </button>
        </div>
      ) : null}

      <form onSubmit={handleCreate} className="mt-2 space-y-2 border-t border-zinc-800 pt-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">New agent</p>
        <input
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-200"
          placeholder="slug (e.g. research-bot)"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
        />
        <input
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-200"
          placeholder="Display name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-900 hover:bg-white"
        >
          Create
        </button>
      </form>

      <button
        type="button"
        className="text-left text-[10px] text-zinc-500 underline-offset-2 hover:text-zinc-400 hover:underline"
        onClick={() => void refresh()}
      >
        Refresh registry
      </button>
    </AgentsPaneShell>
  );
}