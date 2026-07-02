'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Node, Edge } from '@xyflow/react';

import { usePaneScopeOptional } from '@/components/pane/PaneScopeContext';
import {
  consumePendingWorkflowId,
  WORKFLOW_DISPOSE_SCOPE_EVENT,
  WORKFLOW_LOAD_SCOPE_EVENT,
  WORKFLOW_SCOPE_PERSIST_EVENT,
  dispatchWorkflowScopePersist,
} from '@/lib/agent-navigation';
import { getPersistedWorkflowId } from '@/lib/workflow-scope-persist';
import type { WorkflowNodeData, WorkflowDefinition, WorkflowKind } from '@/lib/workflow/types';

export type WorkflowSummary = {
  id: string;
  name: string;
  description: string;
  kind: string;
  currentVersion: number;
  updatedAt: string;
};

export const LEGACY_WORKFLOW_SCOPE = 'legacy-workflow';

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

export type WorkflowScopeState = {
  workflowId: string | null;
  workflowName: string;
  version: number;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  loading: boolean;
  saving: boolean;
  exporting: boolean;
  duplicating: boolean;
  status: string;
  kind: WorkflowKind;
  activeTab: 'build' | 'run';
  initialized: boolean;
};

function createEmptyScopeState(): WorkflowScopeState {
  return {
    workflowId: null,
    workflowName: 'Workflow',
    version: 1,
    nodes: [],
    edges: [],
    selectedNodeId: null,
    loading: true,
    saving: false,
    exporting: false,
    duplicating: false,
    status: '',
    kind: 'langgraph',
    activeTab: 'build',
    initialized: false,
  };
}

export interface WorkflowContextValue {
  scopeId: string;
  workflows: WorkflowSummary[];
  workflowId: string | null;
  workflowName: string;
  setWorkflowName: (name: string) => void;
  version: number;
  kind: WorkflowKind;
  setKind: (kind: WorkflowKind) => void;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedNode: Node<WorkflowNodeData> | null;
  loading: boolean;
  saving: boolean;
  exporting: boolean;
  duplicating: boolean;
  status: string;
  activeTab: 'build' | 'run';
  setActiveTab: (tab: 'build' | 'run') => void;
  standardIncompatibleNodes: Array<{ id: string; label: string }>;
  hasStandardViolation: boolean;
  refreshWorkflows: () => Promise<WorkflowSummary[]>;
  loadWorkflow: (id: string) => Promise<void>;
  createWorkflow: () => Promise<void>;
  saveWorkflow: () => Promise<void>;
  duplicateWorkflow: () => Promise<void>;
  exportWorkflow: () => Promise<void>;
  handleCanvasChange: (nextNodes: Node<WorkflowNodeData>[], nextEdges: Edge[]) => void;
  handleNodeSelect: (node: Node<WorkflowNodeData> | null) => void;
  handleNodeUpdate: (nodeId: string, properties: Record<string, unknown>, label?: string) => void;
}

interface WorkflowRegistryContextValue {
  workflows: WorkflowSummary[];
  scopeStates: Record<string, WorkflowScopeState>;
  refreshWorkflows: () => Promise<WorkflowSummary[]>;
  getScopeState: (scopeId: string) => WorkflowScopeState;
  patchScope: (scopeId: string, patch: Partial<WorkflowScopeState>) => void;
  updateScope: (scopeId: string, updater: (prev: WorkflowScopeState) => WorkflowScopeState) => void;
  disposeScope: (scopeId: string) => void;
  ensureScopeInitialized: (scopeId: string) => void;
  registerFocusScope: (scopeId: string) => void;
  loadWorkflowForScope: (scopeId: string, id: string) => Promise<void>;
  createWorkflowForScope: (scopeId: string) => Promise<void>;
  saveWorkflowForScope: (scopeId: string) => Promise<void>;
  duplicateWorkflowForScope: (scopeId: string) => Promise<void>;
  exportWorkflowForScope: (scopeId: string) => Promise<void>;
}

const WorkflowRegistryContext = createContext<WorkflowRegistryContextValue | null>(null);

export function useWorkflowRegistry(): WorkflowRegistryContextValue {
  const ctx = useContext(WorkflowRegistryContext);
  if (!ctx) throw new Error('useWorkflow must be used within WorkflowProvider');
  return ctx;
}

export function useWorkflow(): WorkflowContextValue {
  const paneScope = usePaneScopeOptional();
  const scopeId = paneScope?.scopeId ?? LEGACY_WORKFLOW_SCOPE;
  const registry = useWorkflowRegistry();

  useEffect(() => {
    registry.ensureScopeInitialized(scopeId);
    registry.registerFocusScope(scopeId);
  }, [registry, scopeId]);

  const state = registry.scopeStates[scopeId] ?? createEmptyScopeState();

  const setWorkflowName = useCallback(
    (name: string) => registry.patchScope(scopeId, { workflowName: name }),
    [registry, scopeId],
  );
  const setKind = useCallback(
    (kind: WorkflowKind) => registry.patchScope(scopeId, { kind }),
    [registry, scopeId],
  );
  const setActiveTab = useCallback(
    (tab: 'build' | 'run') => registry.patchScope(scopeId, { activeTab: tab }),
    [registry, scopeId],
  );

  const selectedNode = useMemo(
    () => state.nodes.find((n) => n.id === state.selectedNodeId) ?? null,
    [state.nodes, state.selectedNodeId],
  );

  const standardIncompatibleNodes = useMemo(() => {
    if (state.kind !== 'standard') return [] as Array<{ id: string; label: string }>;
    return state.nodes
      .filter((n) => n.data.typeId === 'logic.condition' || n.data.typeId === 'langgraph.interrupt')
      .map((n) => ({ id: n.id, label: n.data.label || n.data.typeId }));
  }, [state.kind, state.nodes]);

  const handleCanvasChange = useCallback(
    (nextNodes: Node<WorkflowNodeData>[], nextEdges: Edge[]) => {
      registry.patchScope(scopeId, { nodes: nextNodes, edges: nextEdges });
    },
    [registry, scopeId],
  );

  const handleNodeSelect = useCallback(
    (node: Node<WorkflowNodeData> | null) => {
      registry.patchScope(scopeId, { selectedNodeId: node?.id ?? null });
    },
    [registry, scopeId],
  );

  const handleNodeUpdate = useCallback(
    (nodeId: string, properties: Record<string, unknown>, label?: string) => {
      registry.updateScope(scopeId, (prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
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
      }));
    },
    [registry, scopeId],
  );

  return useMemo(
    (): WorkflowContextValue => ({
      scopeId,
      workflows: registry.workflows,
      workflowId: state.workflowId,
      workflowName: state.workflowName,
      setWorkflowName,
      version: state.version,
      kind: state.kind,
      setKind,
      nodes: state.nodes,
      edges: state.edges,
      selectedNodeId: state.selectedNodeId,
      selectedNode,
      loading: state.loading,
      saving: state.saving,
      exporting: state.exporting,
      duplicating: state.duplicating,
      status: state.status,
      activeTab: state.activeTab,
      setActiveTab,
      standardIncompatibleNodes,
      hasStandardViolation: standardIncompatibleNodes.length > 0,
      refreshWorkflows: registry.refreshWorkflows,
      loadWorkflow: (id) => registry.loadWorkflowForScope(scopeId, id),
      createWorkflow: () => registry.createWorkflowForScope(scopeId),
      saveWorkflow: () => registry.saveWorkflowForScope(scopeId),
      duplicateWorkflow: () => registry.duplicateWorkflowForScope(scopeId),
      exportWorkflow: () => registry.exportWorkflowForScope(scopeId),
      handleCanvasChange,
      handleNodeSelect,
      handleNodeUpdate,
    }),
    [
      scopeId,
      registry,
      state,
      setWorkflowName,
      setKind,
      setActiveTab,
      selectedNode,
      standardIncompatibleNodes,
      handleCanvasChange,
      handleNodeSelect,
      handleNodeUpdate,
    ],
  );
}

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [scopeStates, setScopeStates] = useState<Record<string, WorkflowScopeState>>({});
  const scopeStatesRef = useRef(scopeStates);
  const workflowsRef = useRef(workflows);
  const lastFocusedScopeRef = useRef(LEGACY_WORKFLOW_SCOPE);
  const initInFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    scopeStatesRef.current = scopeStates;
  }, [scopeStates]);
  useEffect(() => {
    workflowsRef.current = workflows;
  }, [workflows]);

  const getScopeState = useCallback((scopeId: string): WorkflowScopeState => {
    return scopeStatesRef.current[scopeId] ?? createEmptyScopeState();
  }, []);

  const patchScope = useCallback((scopeId: string, patch: Partial<WorkflowScopeState>) => {
    setScopeStates((prev) => ({
      ...prev,
      [scopeId]: { ...(prev[scopeId] ?? createEmptyScopeState()), ...patch },
    }));
  }, []);

  const updateScope = useCallback(
    (scopeId: string, updater: (prev: WorkflowScopeState) => WorkflowScopeState) => {
      setScopeStates((prev) => ({
        ...prev,
        [scopeId]: updater(prev[scopeId] ?? createEmptyScopeState()),
      }));
    },
    [],
  );

  const disposeScope = useCallback((scopeId: string) => {
    setScopeStates((prev) => {
      const next = { ...prev };
      delete next[scopeId];
      return next;
    });
    initInFlightRef.current.delete(scopeId);
  }, []);

  const refreshWorkflows = useCallback(async () => {
    const res = await fetch('/api/workflow');
    if (!res.ok) throw new Error('Failed to fetch workflows');
    const data = (await res.json()) as WorkflowSummary[];
    setWorkflows(data);
    return data;
  }, []);

  const loadWorkflowForScope = useCallback(
    async (scopeId: string, id: string) => {
      patchScope(scopeId, { loading: true, status: '' });
      try {
        const res = await fetch(`/api/workflow/${id}`);
        if (!res.ok) throw new Error('Failed to load workflow');
        const data = await res.json();
        const def = data.definition as WorkflowDefinition;
        patchScope(scopeId, {
          workflowId: data.workflow.id,
          workflowName: def?.name ?? data.workflow.name,
          version: def?.version ?? data.workflow.currentVersion ?? 1,
          nodes: (def?.nodes ?? []) as Node<WorkflowNodeData>[],
          edges: (def?.edges ?? []) as Edge[],
          selectedNodeId: null,
          kind: (def?.kind ?? data.workflow.kind ?? 'langgraph') as WorkflowKind,
          loading: false,
          initialized: true,
        });
        dispatchWorkflowScopePersist(scopeId, data.workflow.id);
      } catch {
        patchScope(scopeId, { loading: false, status: 'Failed to load workflow' });
      }
    },
    [patchScope],
  );

  const createWorkflowForScope = useCallback(
    async (scopeId: string) => {
      const state = scopeStatesRef.current[scopeId] ?? createEmptyScopeState();
      patchScope(scopeId, { loading: true });
      try {
        const name = `Workflow ${workflowsRef.current.length + 1}`;
        const seed = emptyDefinition(name);
        const res = await fetch('/api/workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            kind: state.kind,
            nodes: seed.nodes,
            edges: seed.edges,
          }),
        });
        if (!res.ok) throw new Error('Failed to create workflow');
        const created = await res.json();
        await refreshWorkflows();
        await loadWorkflowForScope(scopeId, created.id);
      } catch {
        patchScope(scopeId, { loading: false, status: 'Failed to create workflow' });
      }
    },
    [patchScope, refreshWorkflows, loadWorkflowForScope],
  );

  const ensureScopeInitialized = useCallback(
    (scopeId: string) => {
      const state = scopeStatesRef.current[scopeId];
      if (state?.initialized || initInFlightRef.current.has(scopeId)) return;
      initInFlightRef.current.add(scopeId);
      void (async () => {
        try {
          const list = workflowsRef.current.length ? workflowsRef.current : await refreshWorkflows();
          const persistedId = getPersistedWorkflowId(scopeId);
          if (persistedId) {
            await loadWorkflowForScope(scopeId, persistedId);
            return;
          }
          if (list.length === 0) {
            await createWorkflowForScope(scopeId);
          } else {
            await loadWorkflowForScope(scopeId, list[0].id);
          }
        } catch {
          patchScope(scopeId, { loading: false, status: 'Failed to initialize workflows', initialized: true });
        } finally {
          initInFlightRef.current.delete(scopeId);
        }
      })();
    },
    [refreshWorkflows, createWorkflowForScope, loadWorkflowForScope, patchScope],
  );

  const registerFocusScope = useCallback((scopeId: string) => {
    lastFocusedScopeRef.current = scopeId;
  }, []);

  const saveWorkflowForScope = useCallback(
    async (scopeId: string) => {
      const state = scopeStatesRef.current[scopeId] ?? createEmptyScopeState();
      if (!state.workflowId) return;
      if (state.kind === 'standard') {
        const violation = state.nodes.find(
          (n) => n.data.typeId === 'logic.condition' || n.data.typeId === 'langgraph.interrupt',
        );
        if (violation) {
          patchScope(scopeId, {
            status: `Cannot save: "${violation.data.label || violation.data.typeId}" needs kind: langgraph`,
          });
          return;
        }
      }
      patchScope(scopeId, { saving: true, status: '' });
      try {
        const res = await fetch(`/api/workflow/${state.workflowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: state.workflowName, nodes: state.nodes, edges: state.edges }),
        });
        if (!res.ok) throw new Error('Failed to save workflow');
        const updated = await res.json();
        await refreshWorkflows();
        patchScope(scopeId, { version: updated.currentVersion, saving: false, status: 'Saved' });
      } catch {
        patchScope(scopeId, { saving: false, status: 'Save failed' });
      }
    },
    [patchScope, refreshWorkflows],
  );

  const duplicateWorkflowForScope = useCallback(
    async (scopeId: string) => {
      const state = scopeStatesRef.current[scopeId] ?? createEmptyScopeState();
      if (!state.workflowId) return;
      patchScope(scopeId, { duplicating: true, status: '' });
      try {
        const res = await fetch(`/api/workflow/${state.workflowId}/duplicate`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to duplicate workflow');
        const created = await res.json();
        await refreshWorkflows();
        await loadWorkflowForScope(scopeId, created.id);
        patchScope(scopeId, { duplicating: false, status: 'Duplicated' });
      } catch {
        patchScope(scopeId, { duplicating: false, status: 'Duplicate failed' });
      }
    },
    [patchScope, refreshWorkflows, loadWorkflowForScope],
  );

  const exportWorkflowForScope = useCallback(
    async (scopeId: string) => {
      const state = scopeStatesRef.current[scopeId] ?? createEmptyScopeState();
      if (!state.workflowId) return;
      patchScope(scopeId, { exporting: true, status: '' });
      try {
        const res = await fetch(`/api/workflow/${state.workflowId}/export`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to export workflow');
        const payload = await res.json();
        const blob = new Blob([JSON.stringify(payload.artifacts, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.workflowName.replace(/\s+/g, '_').toLowerCase()}-v${state.version}.json`;
        a.click();
        URL.revokeObjectURL(url);
        patchScope(scopeId, { exporting: false, status: 'Exported' });
      } catch {
        patchScope(scopeId, { exporting: false, status: 'Export failed' });
      }
    },
    [patchScope],
  );

  useEffect(() => {
    void refreshWorkflows();
    const pending = consumePendingWorkflowId();
    if (pending) void loadWorkflowForScope(lastFocusedScopeRef.current, pending);

    const onLoadScope = (ev: Event) => {
      const { scopeId, workflowId } = (ev as CustomEvent<{ scopeId: string; workflowId: string }>).detail;
      if (scopeId && workflowId) void loadWorkflowForScope(scopeId, workflowId);
    };
    window.addEventListener(WORKFLOW_LOAD_SCOPE_EVENT, onLoadScope);
    return () => window.removeEventListener(WORKFLOW_LOAD_SCOPE_EVENT, onLoadScope);
  }, [refreshWorkflows, loadWorkflowForScope]);

  useEffect(() => {
    const onDispose = (ev: Event) => {
      const scopeId = (ev as CustomEvent<{ scopeId: string }>).detail.scopeId;
      disposeScope(scopeId);
    };
    window.addEventListener(WORKFLOW_DISPOSE_SCOPE_EVENT, onDispose);
    return () => window.removeEventListener(WORKFLOW_DISPOSE_SCOPE_EVENT, onDispose);
  }, [disposeScope]);

  const registryValue = useMemo(
    (): WorkflowRegistryContextValue => ({
      workflows,
      scopeStates,
      refreshWorkflows,
      getScopeState,
      patchScope,
      updateScope,
      disposeScope,
      ensureScopeInitialized,
      registerFocusScope,
      loadWorkflowForScope,
      createWorkflowForScope,
      saveWorkflowForScope,
      duplicateWorkflowForScope,
      exportWorkflowForScope,
    }),
    [
      workflows,
      scopeStates,
      refreshWorkflows,
      getScopeState,
      patchScope,
      updateScope,
      disposeScope,
      ensureScopeInitialized,
      registerFocusScope,
      loadWorkflowForScope,
      createWorkflowForScope,
      saveWorkflowForScope,
      duplicateWorkflowForScope,
      exportWorkflowForScope,
    ],
  );

  return <WorkflowRegistryContext.Provider value={registryValue}>{children}</WorkflowRegistryContext.Provider>;
}

/** Expose dispose for WorkspaceProvider studio close lifecycle. */
export function useWorkflowScopeDisposal() {
  return useWorkflowRegistry().disposeScope;
}
