import type { ToolId } from './tools';

export type AgentNavigateDetail = {
  toolId: ToolId;
  /** Open a specific pane in the first (or target) panel slot. */
  paneId?: string;
  /** Open a studio preset as a floating window. */
  studioId?: string;
  /** Target panel container id when adding a pane. */
  containerId?: string;
  workflowId?: string;
  agentId?: string;
  runId?: string;
  memoryTab?: 'overview' | 'corpus' | 'ingest' | 'bindings' | 'recall' | 'jobs';
  mediaId?: string;
  /** Target pane inside the Agents studio (e.g. agents.training). */
  agentsPane?: string;
};

export const AGENTS_CONSOLE_STUDIO_ID = 'agents.console';

export const AGENT_MEDIA_REFERENCE_EVENT = 'agent:media-reference';

export type AgentMediaReferenceDetail = {
  mediaId: string;
  url: string;
  agentId?: string;
  kind?: 'image' | 'video';
};

export function dispatchAgentMediaReference(detail: AgentMediaReferenceDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AGENT_MEDIA_REFERENCE_EVENT, { detail }));
}

const PENDING_MEDIA_AGENT = 'agent:pendingMediaAgentId';
const PENDING_MEDIA_ID = 'agent:pendingMediaId';

export function setPendingMediaFocus(agentId: string, mediaId?: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_MEDIA_AGENT, agentId);
  if (mediaId) sessionStorage.setItem(PENDING_MEDIA_ID, mediaId);
}

export function consumePendingMediaFocus(): { agentId: string | null; mediaId: string | null } {
  if (typeof window === 'undefined') return { agentId: null, mediaId: null };
  const agentId = sessionStorage.getItem(PENDING_MEDIA_AGENT);
  const mediaId = sessionStorage.getItem(PENDING_MEDIA_ID);
  sessionStorage.removeItem(PENDING_MEDIA_AGENT);
  sessionStorage.removeItem(PENDING_MEDIA_ID);
  return { agentId, mediaId };
}

const PENDING_MEMORY_AGENT = 'agent:pendingMemoryAgentId';
const PENDING_MEMORY_TAB = 'agent:pendingMemoryTab';
const PENDING_RUN_ID = 'agent:pendingRunId';

export const AGENT_NAVIGATE_EVENT = 'agent:navigate';

export const WORKFLOW_DISPOSE_SCOPE_EVENT = 'workflow:dispose-scope';
export const WORKFLOW_SCOPE_PERSIST_EVENT = 'workflow:scope-persist';
export const WORKFLOW_LOAD_SCOPE_EVENT = 'workflow:load-scope';

export function dispatchWorkflowLoadScope(scopeId: string, workflowId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WORKFLOW_LOAD_SCOPE_EVENT, { detail: { scopeId, workflowId } }));
}

export function dispatchWorkflowDisposeScope(scopeId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WORKFLOW_DISPOSE_SCOPE_EVENT, { detail: { scopeId } }));
}

export function dispatchWorkflowScopePersist(scopeId: string, workflowId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WORKFLOW_SCOPE_PERSIST_EVENT, { detail: { scopeId, workflowId } }));
}

export function dispatchAgentNavigate(detail: AgentNavigateDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AGENT_NAVIGATE_EVENT, { detail }));
}

/** Deep-link: open a Feature pane in a panel slot (or floating via workspace handler). */
export function openPane(
  toolId: ToolId,
  paneId: string,
  options?: { containerId?: string; agentId?: string; mediaId?: string },
): void {
  dispatchAgentNavigate({ toolId, paneId, ...options });
}

/** Deep-link: open a Feature studio preset as a floating window. */
export function openStudio(toolId: ToolId, studioId: string): void {
  dispatchAgentNavigate({ toolId, studioId });
}

/** Open Agents console studio for a registry slug. */
export function openAgentsStudio(
  agentId: string,
  options?: { paneId?: string; studioId?: string },
): void {
  setPendingAgentsFocus(agentId, options?.paneId);
  dispatchAgentNavigate({
    toolId: 'agents',
    agentId,
    studioId: options?.studioId ?? AGENTS_CONSOLE_STUDIO_ID,
    paneId: options?.paneId,
  });
}

const PENDING_AGENTS_AGENT = 'agent:pendingAgentsAgentId';
const PENDING_AGENTS_PANE = 'agent:pendingAgentsPaneId';

export function setPendingAgentsFocus(agentId: string, paneId?: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_AGENTS_AGENT, agentId);
  if (paneId) sessionStorage.setItem(PENDING_AGENTS_PANE, paneId);
}

export function consumePendingAgentsFocus(): { agentId: string | null; paneId: string | null } {
  if (typeof window === 'undefined') return { agentId: null, paneId: null };
  const agentId = sessionStorage.getItem(PENDING_AGENTS_AGENT);
  const paneId = sessionStorage.getItem(PENDING_AGENTS_PANE);
  sessionStorage.removeItem(PENDING_AGENTS_AGENT);
  sessionStorage.removeItem(PENDING_AGENTS_PANE);
  return { agentId, paneId };
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