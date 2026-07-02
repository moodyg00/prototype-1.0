'use client';

import { Copy, Download, Plus, RefreshCw, Save, Workflow } from 'lucide-react';

import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { NodePalette } from '@/components/workflow/NodePalette';
import { NodeInspector } from '@/components/workflow/NodeInspector';
import type { PaneRenderContext } from '@/lib/pane-types';
import type { WorkflowKind } from '@/lib/workflow/types';
import { RunnerPanel } from '../../RunnerPanel';
import { useWorkflow } from '../WorkflowProvider';

export function WorkflowPalettePane({ context: _context }: { context: PaneRenderContext }) {
  return (
    <div className="h-full min-h-0 overflow-auto">
      <NodePalette />
    </div>
  );
}

export function WorkflowCanvasPane({ context: _context }: { context: PaneRenderContext }) {
  const {
    scopeId,
    workflowId,
    workflowName,
    setWorkflowName,
    version,
    workflows,
    kind,
    setKind,
    loading,
    saving,
    exporting,
    duplicating,
    status,
    nodes,
    edges,
    selectedNodeId,
    hasStandardViolation,
    standardIncompatibleNodes,
    refreshWorkflows,
    loadWorkflow,
    createWorkflow,
    saveWorkflow,
    duplicateWorkflow,
    exportWorkflow,
    handleCanvasChange,
    handleNodeSelect,
  } = useWorkflow();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-950">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 px-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5">
          <Workflow size={13} className="text-zinc-300" />
        </div>
        <input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="max-w-56 border-b border-transparent bg-transparent px-1 py-0.5 text-sm text-zinc-100 outline-none focus:border-white/20"
        />
        <span className="text-[10px] text-zinc-500">v{version}</span>
        <select
          value={workflowId ?? ''}
          onChange={(e) => void loadWorkflow(e.target.value)}
          className="ml-2 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300 outline-none transition-colors focus:border-white/25"
          disabled={loading}
        >
          {workflows.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void duplicateWorkflow()}
          disabled={!workflowId || duplicating}
          className="btn btn-ghost !p-1.5"
          title="Duplicate this workflow"
        >
          <Copy size={12} className={duplicating ? 'animate-pulse' : ''} />
        </button>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as WorkflowKind)}
          disabled={Boolean(workflowId)}
          className="ml-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300 outline-none transition-colors focus:border-white/25 disabled:opacity-60"
          title={workflowId ? 'Kind is fixed once a workflow is created' : 'Kind for the new workflow'}
        >
          <option value="langgraph">langgraph</option>
          <option value="standard">standard</option>
        </select>
        <div className="flex-1" />
        {status && <span className="text-[10px] text-zinc-500">{status}</span>}
        <button type="button" onClick={() => void refreshWorkflows()} className="btn btn-ghost !p-1.5" title="Refresh">
          <RefreshCw size={12} />
        </button>
        <button type="button" onClick={() => void createWorkflow()} className="btn btn-ghost !p-1.5" title="New Workflow">
          <Plus size={12} />
        </button>
        <button
          type="button"
          onClick={() => void saveWorkflow()}
          disabled={!workflowId || saving || hasStandardViolation}
          className="btn btn-ghost !p-1.5"
          title={hasStandardViolation ? 'Resolve standard-kind violations before saving' : 'Save'}
        >
          <Save size={12} className={saving ? 'animate-pulse' : ''} />
        </button>
        <button
          type="button"
          onClick={() => void exportWorkflow()}
          disabled={!workflowId || exporting}
          className="btn btn-ghost !p-1.5"
          title="Export"
        >
          <Download size={12} className={exporting ? 'animate-pulse' : ''} />
        </button>
      </div>

      {hasStandardViolation && (
        <div className="flex-shrink-0 border-b border-amber-800/40 bg-amber-950/50 px-3 py-1.5 text-[11px] text-amber-300">
          This is a <span className="font-mono">standard</span> workflow, but it contains{' '}
          {standardIncompatibleNodes.map((n) => n.label).join(', ')} — condition/interrupt nodes only run on{' '}
          <span className="font-mono">langgraph</span> workflows.
        </div>
      )}

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">Loading workflow...</div>
        ) : (
          <WorkflowCanvas
            key={`${workflowId ?? 'loading'}-${scopeId}`}
            nodes={nodes}
            edges={edges}
            onChange={handleCanvasChange}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNodeId}
          />
        )}
      </div>
    </div>
  );
}

/** @deprecated alias for catalog id `workflow.canvas` */
export const WorkflowBuilderPane = WorkflowCanvasPane;

export function WorkflowInspectorPane({ context: _context }: { context: PaneRenderContext }) {
  const { selectedNode, handleNodeUpdate, handleNodeSelect } = useWorkflow();

  if (!selectedNode) {
    return (
      <div className="flex h-full items-center justify-center border-l border-white/5 bg-zinc-950/60 p-4 text-center text-xs text-zinc-600">
        Select a node on the workflow canvas to inspect properties.
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <NodeInspector
        node={selectedNode}
        onUpdate={handleNodeUpdate}
        onClose={() => handleNodeSelect(null)}
      />
    </div>
  );
}

export function WorkflowRunnerPane({ context: _context }: { context: PaneRenderContext }) {
  const { workflowId, workflowName } = useWorkflow();

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <RunnerPanel workflowId={workflowId ?? undefined} workflowName={workflowName} lockWorkflow={Boolean(workflowId)} />
    </div>
  );
}
