export type AgentNavigateDetail = {
  toolId: 'workflow' | 'memory' | 'runs';
  workflowId?: string;
  agentId?: string;
  runId?: string;
  memoryTab?: 'overview' | 'corpus' | 'ingest' | 'bindings' | 'recall' | 'jobs';
};

const PENDING_MEMORY_AGENT = 'agent:pendingMemoryAgentId';
const PENDING_MEMORY_TAB = 'agent:pendingMemoryTab';
const PENDING_RUN_ID = 'agent:pendingRunId';

export const AGENT_NAVIGATE_EVENT = 'agent:navigate';

export function dispatchAgentNavigate(detail: AgentNavigateDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AGENT_NAVIGATE_EVENT, { detail }));
}

export function setPendingWorkflowId(workflowId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('agent:pendingWorkflowId', workflowId);
}

export function consumePendingWorkflowId(): string | null {
  if (typeof window === 'undefined') return null;
  const id = sessionStorage.getItem('agent:pendingWorkflowId');
  if (id) sessionStorage.removeItem('agent:pendingWorkflowId');
  return id;
}

export function setPendingMemoryFocus(agentId: string, tab?: AgentNavigateDetail['memoryTab']): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_MEMORY_AGENT, agentId);
  if (tab) sessionStorage.setItem(PENDING_MEMORY_TAB, tab);
}

export function consumePendingMemoryFocus(): {
  agentId: string | null;
  tab: AgentNavigateDetail['memoryTab'] | null;
} {
  if (typeof window === 'undefined') return { agentId: null, tab: null };
  const agentId = sessionStorage.getItem(PENDING_MEMORY_AGENT);
  const tab = sessionStorage.getItem(PENDING_MEMORY_TAB) as AgentNavigateDetail['memoryTab'] | null;
  sessionStorage.removeItem(PENDING_MEMORY_AGENT);
  sessionStorage.removeItem(PENDING_MEMORY_TAB);
  return { agentId, tab };
}

export function setPendingRunId(runId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_RUN_ID, runId);
}

export function consumePendingRunId(): string | null {
  if (typeof window === 'undefined') return null;
  const id = sessionStorage.getItem(PENDING_RUN_ID);
  if (id) sessionStorage.removeItem(PENDING_RUN_ID);
  return id;
}