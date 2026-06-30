"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { Download, Play, Plus, RefreshCw, Save, Workflow } from 'lucide-react';
import { WorkflowCanvas } from '../workflow/WorkflowCanvas';
import { NodePalette } from '../workflow/NodePalette';
import { NodeInspector } from '../workflow/NodeInspector';
import { RunnerPanel } from './RunnerPanel';
import {
  AGENT_NAVIGATE_EVENT,
  consumePendingWorkflowId,
  type AgentNavigateDetail,
} from '@/lib/agent-navigation';
import type { WorkflowNodeData, WorkflowDefinition, WorkflowKind } from '../../lib/workflow/types';

type WorkflowSummary = {
  id: string;
  name: string;
  description: string;
  kind: string;
  currentVersion: number;
  updatedAt: string;
};

function emptyDefinition(name: string): Omit<WorkflowDefinition, 'id'> {
  const now = new Date().toISOString();
  return {
    name,
    description: '',
    kind: 'langgraph',
    version: 1,
    nodes: [],
    edges: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      tags: [],
      executionMode: 'sequential',
      errorPolicy: 'stop',
      maxRetries: 0,
      timeoutMs: 60000,
      envVars: [],
      triggers: [],
    },
  };
}

export function WorkflowPanel() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Workflow');
  const [version, setVersion] = useState(1);
  const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [kind, setKind] = useState<WorkflowKind>('langgraph');
  const [activeTab, setActiveTab] = useState<'build' | 'run'>('build');
  const kindRef = useRef(kind);
  kindRef.current = kind;

  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const refreshWorkflows = useCallback(async () => {
    const res = await fetch('/api/workflow');
    if (!res.ok) throw new Error('Failed to fetch workflows');
    const data = (await res.json()) as WorkflowSummary[];
    setWorkflows(data);
    return data;
  }, []);

  const loadWorkflow = useCallback(async (id: string) => {
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch(`/api/workflow/${id}`);
      if (!res.ok) throw new Error('Failed to load workflow');
      const data = await res.json();
      const def = data.definition as WorkflowDefinition;
      setWorkflowId(data.workflow.id);
      setWorkflowName(def?.name ?? data.workflow.name);
      setVersion(def?.version ?? data.workflow.currentVersion ?? 1);
      setNodes((def?.nodes ?? []) as Node<WorkflowNodeData>[]);
      setEdges((def?.edges ?? []) as Edge[]);
      setSelectedNodeId(null);
    } catch {
      setStatus('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkflow = useCallback(async () => {
    setLoading(true);
    try {
      const name = `Workflow ${workflows.length + 1}`;
      const seed = emptyDefinition(name);
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          kind: kindRef.current,
          nodes: seed.nodes,
          edges: seed.edges,
        }),
      });
      if (!res.ok) throw new Error('Failed to create workflow');
      const created = await res.json();
      await refreshWorkflows();
      await loadWorkflow(created.id);
    } catch {
      setLoading(false);
      setStatus('Failed to create workflow');
    }
  }, [workflows.length, refreshWorkflows, loadWorkflow]);

  useEffect(() => {
    const pending = consumePendingWorkflowId();
    if (pending) void loadWorkflow(pending);

    const onNav = (ev: Event) => {
      const detail = (ev as CustomEvent<AgentNavigateDetail>).detail;
      if (detail?.workflowId) void loadWorkflow(detail.workflowId);
    };
    window.addEventListener(AGENT_NAVIGATE_EVENT, onNav);
    return () => window.removeEventListener(AGENT_NAVIGATE_EVENT, onNav);
  }, [loadWorkflow]);

  const saveWorkflow = useCallback(async () => {
    if (!workflowId) return;
    setSaving(true);
    setStatus('');
    try {
      const res = await fetch(`/api/workflow/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowName,
          nodes,
          edges,
        }),
      });
      if (!res.ok) throw new Error('Failed to save workflow');
      const updated = await res.json();
      setVersion(updated.currentVersion);
      await refreshWorkflows();
      setStatus('Saved');
    } catch {
      setStatus('Save failed');
    } finally {
      setSaving(false);
    }
  }, [workflowId, workflowName, nodes, edges, refreshWorkflows]);

  const exportWorkflow = useCallback(async () => {
    if (!workflowId) return;
    setExporting(true);
    setStatus('');
    try {
      const res = await fetch(`/api/workflow/${workflowId}/export`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to export workflow');
      const payload = await res.json();
      const blob = new Blob([JSON.stringify(payload.artifacts, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflowName.replace(/\s+/g, '_').toLowerCase()}-v${version}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Exported');
    } catch {
      setStatus('Export failed');
    } finally {
      setExporting(false);
    }
  }, [workflowId, workflowName, version]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await refreshWorkflows();
        if (!mounted) return;
        if (list.length === 0) {
          await createWorkflow();
          return;
        }
        await loadWorkflow(list[0].id);
      } catch {
        if (mounted) {
          setLoading(false);
          setStatus('Failed to initialize workflows');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshWorkflows, createWorkflow, loadWorkflow]);

  const handleCanvasChange = useCallback((nextNodes: Node<WorkflowNodeData>[], nextEdges: Edge[]) => {
    setNodes(nextNodes);
    setEdges(nextEdges);
  }, []);

  const handleNodeSelect = useCallback((node: Node<WorkflowNodeData> | null) => {
    setSelectedNodeId(node?.id ?? null);
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, properties: Record<string, unknown>, label?: string) => {
    setNodes(prev =>
      prev.map(n =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                properties,
                ...(label !== undefined ? { label } : {}),
              },
            }
          : n,
      ),
    );
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-950">
      <div className="h-11 border-b border-white/10 px-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md border border-white/10 bg-white/5 flex items-center justify-center">
          <Workflow size={13} className="text-zinc-300" />
        </div>
        <input
          value={workflowName}
          onChange={e => setWorkflowName(e.target.value)}
          className="bg-transparent text-sm text-zinc-100 border-b border-transparent focus:border-white/20 outline-none px-1 py-0.5 max-w-56"
        />
        <span className="text-[10px] text-zinc-500">v{version}</span>
        <select
          value={workflowId ?? ''}
          onChange={e => loadWorkflow(e.target.value)}
          className="ml-2 bg-white/5 border border-white/10 text-xs text-zinc-300 rounded px-2 py-1"
          disabled={loading}
        >
          {workflows.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select
          value={kind}
          onChange={e => setKind(e.target.value as WorkflowKind)}
          className="ml-1 bg-white/5 border border-white/10 text-xs text-zinc-300 rounded px-2 py-1"
          title="Kind for new workflows"
        >
          <option value="langgraph">langgraph</option>
          <option value="standard">standard</option>
        </select>
        <div className="ml-2 flex items-center rounded-md border border-white/10 bg-white/5 p-0.5">
          <button
            onClick={() => setActiveTab('build')}
            className={`text-[11px] px-2 py-0.5 rounded ${activeTab === 'build' ? 'bg-white/10 text-zinc-100' : 'text-zinc-400'}`}
          >
            Build
          </button>
          <button
            onClick={() => setActiveTab('run')}
            disabled={!workflowId}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded ${activeTab === 'run' ? 'bg-white/10 text-zinc-100' : 'text-zinc-400'}`}
          >
            <Play size={10} /> Run
          </button>
        </div>
        <div className="flex-1" />
        {status && <span className="text-[10px] text-zinc-500">{status}</span>}
        <button onClick={refreshWorkflows} className="btn btn-ghost !p-1.5" title="Refresh">
          <RefreshCw size={12} />
        </button>
        <button onClick={createWorkflow} className="btn btn-ghost !p-1.5" title="New Workflow">
          <Plus size={12} />
        </button>
        <button onClick={saveWorkflow} disabled={!workflowId || saving} className="btn btn-ghost !p-1.5" title="Save">
          <Save size={12} className={saving ? 'animate-pulse' : ''} />
        </button>
        <button onClick={exportWorkflow} disabled={!workflowId || exporting} className="btn btn-ghost !p-1.5" title="Export">
          <Download size={12} className={exporting ? 'animate-pulse' : ''} />
        </button>
      </div>

      {activeTab === 'run' && workflowId ? (
        <div className="flex-1 min-h-0">
          <RunnerPanel workflowId={workflowId} workflowName={workflowName} lockWorkflow />
        </div>
      ) : (
      <div className="flex-1 min-h-0 flex">
        <div className="w-64 min-w-64">
          <NodePalette />
        </div>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">Loading workflow...</div>
          ) : (
            <WorkflowCanvas
              key={workflowId ?? 'loading'}
              nodes={nodes}
              edges={edges}
              onChange={handleCanvasChange}
              onNodeSelect={handleNodeSelect}
              selectedNodeId={selectedNodeId}
            />
          )}
        </div>
        {selectedNode ? (
          <div className="w-80 min-w-80">
            <NodeInspector
              node={selectedNode}
              onUpdate={handleNodeUpdate}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        ) : (
          <div className="w-80 min-w-80 border-l border-white/5 bg-zinc-950/60 flex items-center justify-center text-xs text-zinc-600">
            Select a node to inspect properties
          </div>
        )}
      </div>
      )}
    </div>
  );
}

