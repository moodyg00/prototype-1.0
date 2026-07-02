import { MEMORY_WORKFLOW_NAME_PREFIXES } from '@/lib/memory/constants';

export interface RunSummaryRow {
  id: string;
  workflowId: string;
  workflowName: string;
  version: number;
  status: string;
  output: string;
  errorText: string | null;
  durationMs: number;
  nodeCount: number;
  eventCount: number;
  tokens: number;
  createdAt: string;
}

export interface RunsResponse {
  runs: RunSummaryRow[];
  summary: {
    count: number;
    totalTokens: number;
    errorCount: number;
    avgDurationMs: number | null;
  } | null;
  error?: string;
}

export interface SerializedMessage {
  role: string;
  content: string;
}

export interface SerializedState {
  input: string;
  output: string;
  messages: SerializedMessage[];
  memory: Record<string, unknown>;
  routeTo?: string;
  tokens: number;
}

export interface RunEvent {
  node: string;
  update: SerializedState;
}

export interface RunDetail extends RunSummaryRow {
  input: string;
  threadId: string | null;
  events: RunEvent[];
  state: SerializedState;
}

export type RunsCategoryFilter = 'all' | 'memory';
export type RunsStatusFilter = 'all' | 'completed' | 'error' | 'interrupted';

export const STATUS_COLORS: Record<string, string> = {
  completed: 'text-emerald-400',
  interrupted: 'text-sky-400',
  error: 'text-red-400',
};

export function fmtDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function isMemoryWorkflowName(workflowName: string): boolean {
  return MEMORY_WORKFLOW_NAME_PREFIXES.some((prefix) => workflowName.startsWith(prefix));
}
