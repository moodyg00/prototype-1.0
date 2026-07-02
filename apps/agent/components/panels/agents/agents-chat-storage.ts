import type { AgentChatMessage } from '@/lib/agents/agent-chat-types';

const PREFIX = 'agent-studio-chat:';

export function loadChatMessages(agentId: string): AgentChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${agentId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AgentChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChatMessages(agentId: string, messages: AgentChatMessage[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${PREFIX}${agentId}`, JSON.stringify(messages));
}

export function clearChatMessages(agentId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`${PREFIX}${agentId}`);
}