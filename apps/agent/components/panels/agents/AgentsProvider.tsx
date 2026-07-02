'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_IDE_MODEL_ID, type IdeModelOption } from '@prototype/ide-tools/ide-models';
import type { IdeAgentChatResponse } from '@prototype/ide-tools/agent-bridge';

import {
  AGENT_NAVIGATE_EVENT,
  consumePendingAgentsFocus,
  consumePendingMemoryFocus,
  type AgentNavigateDetail,
} from '@/lib/agent-navigation';
import type { AgentChatMessage } from '@/lib/agents/agent-chat-types';
import type { AgentPhoneConfig } from '@/lib/agents/phone-types';
import type { WorkspaceAgent } from '@/lib/agents/types';
import { fetchJson } from '@/lib/memory/fetch-json';

import {
  clearChatMessages,
  loadChatMessages,
  saveChatMessages,
} from './agents-chat-storage';

type WorkflowOption = { id: string; name: string };

type AgentsContextValue = {
  agents: WorkspaceAgent[];
  selectedAgentId: string;
  selectedAgent: WorkspaceAgent | null;
  setSelectedAgentId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
  createAgent: (input: { id: string; name: string; description?: string }) => Promise<void>;
  updateAgent: (patch: Partial<WorkspaceAgent> & { persona?: WorkspaceAgent['persona'] }) => Promise<void>;
  workflows: WorkflowOption[];
  models: Array<IdeModelOption & { configured?: boolean }>;
  chatMessages: AgentChatMessage[];
  chatBusy: boolean;
  chatModelId: string;
  setChatModelId: (id: string) => void;
  clearChat: () => void;
  sendChat: (content: string) => Promise<IdeAgentChatResponse | null>;
  addTrainingExample: (example: { user: string; assistant: string }) => Promise<void>;
  removeTrainingExample: (index: number) => Promise<void>;
  addTrainingFromChatTurn: (messageIndex: number) => Promise<void>;
  exportTrainingJson: () => string;
  phoneConfig: AgentPhoneConfig | null;
  refreshPhoneConfig: () => Promise<void>;
};

const AgentsContext = createContext<AgentsContextValue | null>(null);

export function useAgents(): AgentsContextValue {
  const ctx = useContext(AgentsContext);
  if (!ctx) throw new Error('useAgents must be used within AgentsProvider');
  return ctx;
}

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<WorkspaceAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('default');
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [models, setModels] = useState<Array<IdeModelOption & { configured?: boolean }>>([]);
  const [chatMessages, setChatMessages] = useState<AgentChatMessage[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatModelId, setChatModelId] = useState(DEFAULT_IDE_MODEL_ID);
  const [phoneConfig, setPhoneConfig] = useState<AgentPhoneConfig | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const seeded = await fetchJson<{ agents: WorkspaceAgent[] }>('/api/agents?seed=1');
      setAgents(seeded.agents ?? []);
      if (seeded.agents?.length) {
        setSelectedAgentId((prev) =>
          seeded.agents!.some((a) => a.id === prev) ? prev : seeded.agents![0].id,
        );
      }
    } catch {
      const listed = await fetchJson<{ agents: WorkspaceAgent[] }>('/api/agents');
      setAgents(listed.agents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void fetchJson<{ models: Array<IdeModelOption & { configured?: boolean }> }>(
      '/api/ide-agent/models',
    ).then((r) => setModels(r.models ?? []));
    void fetchJson<WorkflowOption[]>('/api/workflow').then((list) => setWorkflows(list ?? []));
    const pendingMemory = consumePendingMemoryFocus();
    if (pendingMemory.agentId) setSelectedAgentId(pendingMemory.agentId);
    const pendingAgents = consumePendingAgentsFocus();
    if (pendingAgents.agentId) setSelectedAgentId(pendingAgents.agentId);
  }, [refresh]);

  useEffect(() => {
    const onNavigate = (event: Event) => {
      const detail = (event as CustomEvent<AgentNavigateDetail>).detail;
      if (detail.toolId !== 'agents' || !detail.agentId) return;
      setSelectedAgentId(detail.agentId);
    };
    window.addEventListener(AGENT_NAVIGATE_EVENT, onNavigate);
    return () => window.removeEventListener(AGENT_NAVIGATE_EVENT, onNavigate);
  }, []);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId],
  );

  useEffect(() => {
    if (!selectedAgentId) return;
    setChatMessages(loadChatMessages(selectedAgentId));
    const preferred = selectedAgent?.defaultModelId ?? DEFAULT_IDE_MODEL_ID;
    setChatModelId(preferred);
  }, [selectedAgentId, selectedAgent?.defaultModelId]);

  useEffect(() => {
    if (!selectedAgentId) return;
    saveChatMessages(selectedAgentId, chatMessages);
  }, [selectedAgentId, chatMessages]);

  const createAgent = useCallback(
    async (input: { id: string; name: string; description?: string }) => {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as { agent?: WorkspaceAgent; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Create failed');
      await refresh();
      if (data.agent) setSelectedAgentId(data.agent.id);
    },
    [refresh],
  );

  const updateAgent = useCallback(
    async (patch: Partial<WorkspaceAgent> & { persona?: WorkspaceAgent['persona'] }) => {
      if (!selectedAgentId) return;
      const body: Record<string, unknown> = {};
      if (patch.name !== undefined) body.name = patch.name;
      if (patch.description !== undefined) body.description = patch.description;
      if (patch.status !== undefined) body.status = patch.status;
      if (patch.defaultModelId !== undefined) body.defaultModelId = patch.defaultModelId;
      if (patch.workflowId !== undefined) body.workflowId = patch.workflowId;
      if (patch.persona !== undefined) body.persona = patch.persona;
      if (patch.tools !== undefined) body.tools = patch.tools;
      if (patch.training !== undefined) body.training = patch.training;

      const res = await fetch(`/api/agents/${encodeURIComponent(selectedAgentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { agent?: WorkspaceAgent; error?: string };
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Update failed');
      await refresh();
    },
    [selectedAgentId, refresh],
  );

  const clearChat = useCallback(() => {
    setChatMessages([]);
    if (selectedAgentId) clearChatMessages(selectedAgentId);
  }, [selectedAgentId]);

  const sendChat = useCallback(
    async (content: string): Promise<IdeAgentChatResponse | null> => {
      const text = content.trim();
      if (!text || !selectedAgentId) return null;
      const userMsg: AgentChatMessage = { role: 'user', content: text };
      let nextMessages: AgentChatMessage[] = [];
      setChatMessages((prev) => {
        nextMessages = [...prev, userMsg];
        return nextMessages;
      });
      setChatBusy(true);
      try {
        const res = await fetch(`/api/agents/${encodeURIComponent(selectedAgentId)}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages,
            modelId: chatModelId,
            useMemory: true,
            ingestChat: true,
          }),
        });
        const data = (await res.json()) as IdeAgentChatResponse & { error?: string };
        if (!res.ok && !data.text) {
          throw new Error(data.error ?? 'Chat request failed');
        }
        const assistantText = data.text || data.error || '(empty response)';
        setChatMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Chat failed';
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${message}` },
        ]);
        return null;
      } finally {
        setChatBusy(false);
      }
    },
    [selectedAgentId, chatModelId],
  );

  const addTrainingExample = useCallback(
    async (example: { user: string; assistant: string }) => {
      if (!selectedAgent) return;
      const examples = [...(selectedAgent.training.examples ?? []), example];
      await updateAgent({ training: { examples } });
    },
    [selectedAgent, updateAgent],
  );

  const removeTrainingExample = useCallback(
    async (index: number) => {
      if (!selectedAgent) return;
      const examples = [...(selectedAgent.training.examples ?? [])];
      examples.splice(index, 1);
      await updateAgent({ training: { examples } });
    },
    [selectedAgent, updateAgent],
  );

  const addTrainingFromChatTurn = useCallback(
    async (messageIndex: number) => {
      const msg = chatMessages[messageIndex];
      if (!msg || msg.role !== 'assistant') return;
      let userText = '';
      for (let i = messageIndex - 1; i >= 0; i -= 1) {
        if (chatMessages[i]?.role === 'user') {
          userText = chatMessages[i].content;
          break;
        }
      }
      if (!userText.trim()) return;
      await addTrainingExample({ user: userText.trim(), assistant: msg.content.trim() });
    },
    [chatMessages, addTrainingExample],
  );

  const exportTrainingJson = useCallback(() => {
    if (!selectedAgent) return '[]';
    return JSON.stringify(selectedAgent.training.examples ?? [], null, 2);
  }, [selectedAgent]);

  const refreshPhoneConfig = useCallback(async () => {
    if (!selectedAgentId) return;
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(selectedAgentId)}/phone`);
      if (res.ok) {
        const data = (await res.json()) as AgentPhoneConfig;
        setPhoneConfig(data);
      }
    } catch {
      // ignore
    }
  }, [selectedAgentId]);

  useEffect(() => {
    void refreshPhoneConfig();
  }, [refreshPhoneConfig]);

  const value = useMemo(
    () => ({
      agents,
      selectedAgentId,
      selectedAgent,
      setSelectedAgentId,
      loading,
      refresh,
      createAgent,
      updateAgent,
      workflows,
      models,
      chatMessages,
      chatBusy,
      chatModelId,
      setChatModelId,
      clearChat,
      sendChat,
      addTrainingExample,
      removeTrainingExample,
      addTrainingFromChatTurn,
      exportTrainingJson,
      phoneConfig,
      refreshPhoneConfig,
    }),
    [
      agents,
      selectedAgentId,
      selectedAgent,
      loading,
      refresh,
      createAgent,
      updateAgent,
      workflows,
      models,
      chatMessages,
      chatBusy,
      chatModelId,
      clearChat,
      sendChat,
      addTrainingExample,
      removeTrainingExample,
      addTrainingFromChatTurn,
      exportTrainingJson,
      phoneConfig,
      refreshPhoneConfig,
    ],
  );

  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>;
}