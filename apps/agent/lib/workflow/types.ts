// Canonical workflow domain model.
// All persistence, UI, and export targets derive from these types.

// ─── Node Types ────────────────────────────────────────────────────────────────

export type HandleDirection = 'input' | 'output';
export type HandleDataType = 'any' | 'string' | 'number' | 'boolean' | 'object' | 'array' | 'chat' | 'tool';

export interface HandleDef {
  id: string;
  direction: HandleDirection;
  dataType: HandleDataType;
  label?: string;
  required?: boolean;
  maxConnections?: number;
}

export type NodeCategory =
  | 'trigger'
  | 'llm'
  | 'tool'
  | 'transform'
  | 'logic'
  | 'memory'
  | 'video'
  | 'output'
  | 'langgraph';

export interface NodePropertyField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'code' | 'json';
  description?: string;
  default?: unknown;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  group?: string;
}

export interface NodeTypeDefinition {
  type: string;
  label: string;
  category: NodeCategory;
  description: string;
  color: string;
  icon: string;
  handles: HandleDef[];
  properties: NodePropertyField[];
  // LangGraph runtime hints
  langGraphKind?: 'node' | 'conditional' | 'tool' | 'interrupt' | 'subgraph';
}

// ─── Graph Elements ─────────────────────────────────────────────────────────────

export interface WorkflowNodeData extends Record<string, unknown> {
  typeId: string;
  label: string;
  properties: Record<string, unknown>;
  // Denormalized from NodeTypeDefinition for rendering without catalog lookup
  handles: HandleDef[];
  category: NodeCategory;
  color: string;
  icon: string;
  // Validation state (populated by compiler, not user-authored)
  validationErrors?: string[];
}

export interface WorkflowNode {
  id: string;
  type: 'workflowNode';
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  label?: string;
  condition?: string;
  dataType?: HandleDataType;
}

// ─── Workflow Definition ─────────────────────────────────────────────────────────

export type WorkflowKind = 'standard' | 'langgraph';
export type ExecutionMode = 'sequential' | 'parallel' | 'conditional';
export type ErrorPolicy = 'stop' | 'continue' | 'retry';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  kind: WorkflowKind;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    tags: string[];
    executionMode: ExecutionMode;
    errorPolicy: ErrorPolicy;
    maxRetries: number;
    timeoutMs: number;
    envVars: Array<{ key: string; description: string; required: boolean }>;
    triggers: Array<{ kind: 'manual' | 'webhook' | 'schedule' | 'event'; config: Record<string, unknown> }>;
  };
}

// ─── LangGraph IR ───────────────────────────────────────────────────────────────

export interface LangGraphStateField {
  key: string;
  type: string;
  reducer?: 'append' | 'replace' | 'custom';
  description?: string;
}

export interface LangGraphNodeIR {
  id: string;
  kind: 'node' | 'conditional' | 'tool' | 'interrupt' | 'subgraph';
  /** Original catalog type id (e.g. 'tool.browser'); lets the runtime dispatch the right executor. */
  nodeType?: string;
  label: string;
  stateInputKeys: string[];
  stateOutputKeys: string[];
  toolRef?: string;
  model?: string;
  systemPrompt?: string;
  properties: Record<string, unknown>;
}

export interface LangGraphEdgeIR {
  from: string;
  to: string;
  condition?: string;
}

export interface LangGraphIR {
  workflowId: string;
  workflowName: string;
  stateSchema: LangGraphStateField[];
  entryPoint: string;
  nodes: LangGraphNodeIR[];
  edges: LangGraphEdgeIR[];
  interruptBefore?: string[];
  interruptAfter?: string[];
}

// ─── Export Artifacts ────────────────────────────────────────────────────────────

export interface WorkflowExportArtifacts {
  workflowId: string;
  version: number;
  exportedAt: string;
  productionJson: WorkflowDefinition;
  langGraphIr: LangGraphIR;
  typescriptScaffold: string;
}

// ─── API Shapes ──────────────────────────────────────────────────────────────────

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  kind: WorkflowKind;
  currentVersion: number;
  updatedAt: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  kind: WorkflowKind;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  metadata?: Partial<WorkflowDefinition['metadata']>;
}
