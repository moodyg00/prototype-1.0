import { AIMessage, HumanMessage } from '@langchain/core/messages';
import type { IdeAgentChatResponse } from '@prototype/ide-tools/agent-bridge';
import { DEFAULT_IDE_MODEL_ID, resolveIdeModel } from '@prototype/ide-tools/ide-models';


import { invokeIdeChat } from '@/lib/integrations/ide-llm';
import { getMemoryBinding } from '@/lib/memory/bindings';
import { prisma } from '@/lib/prisma';
import { runStandardWorkflow } from '@/lib/workflow/standard-runtime';
import type { WorkflowDefinition } from '@/lib/workflow/types';

import {
  serializeAgentChatWorkflowInput,
  type AgentChatMessage,
  type AgentChatWorkflowInput,
} from './agent-chat-types';
import { buildAgentSystemPrompt } from './persona';
import { getWorkspaceAgent } from './registry-store';
import type { WorkspaceAgent } from './types';

async function recallContext(agentId: string, query: string): Promise<string> {
  try {
    const { recallMemory } = await import('@prototype/memory');
    const binding = await getMemoryBinding(agentId);
    const hits = await recallMemory({ agentId, query, topK: 6, binding });
    if (!hits.length) return '';
    return hits.map((h, i) => `[${i + 1}] (${h.score.toFixed(2)}) ${h.text}`).join('\n');
  } catch {
    return '';
  }
}

async function resolveAgentChatWorkflowId(agent: WorkspaceAgent): Promise<string | null> {
  if (agent.workflowId?.trim()) return agent.workflowId.trim();
  const fromEnv = process.env.AGENT_CHAT_WORKFLOW_ID?.trim();
  if (fromEnv) return fromEnv;
  try {
    if (!prisma) return null;
    const wf = await prisma.workflow.findFirst({
      where: { name: 'Agent Chat Visual' },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    return wf?.id ?? null;
  } catch {
    return null;
  }
}

async function runViaWorkflow(args: {
  workflowId: string;
  agent: WorkspaceAgent;
  messages: AgentChatMessage[];
  modelId?: string;
  memoryContext: string;
}): Promise<{ text: string; tokens: number; runId: string | null; threadId?: string }> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: args.workflowId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });
  if (!workflow?.versions[0]?.definition) {
    throw new Error('Agent chat workflow has no definition');
  }
  const def = workflow.versions[0].definition as WorkflowDefinition;
  if (def.kind !== 'standard') {
    throw new Error('Agent chat workflow must be kind: standard (seed Agent Chat Visual)');
  }

  const systemPrompt = buildAgentSystemPrompt(args.agent, args.memoryContext);
  const payload: AgentChatWorkflowInput = {
    kind: 'agent_chat',
    messages: args.messages,
    systemPrompt,
    modelId: args.modelId ?? args.agent.defaultModelId,
    memoryContext: args.memoryContext,
  };

  const result = await runStandardWorkflow(def, serializeAgentChatWorkflowInput(payload));
  const text = result.state.output?.trim() || '(no response)';
  return {
    text,
    tokens: result.state.tokens ?? 0,
    runId: null,
    threadId: undefined,
  };
}

async function runViaDirectLlm(args: {
  agent: WorkspaceAgent;
  messages: AgentChatMessage[];
  modelId?: string;
  memoryContext: string;
}): Promise<{ text: string; tokens: number }> {
  const modelId = args.modelId ?? args.agent.defaultModelId ?? DEFAULT_IDE_MODEL_ID;
  const systemPrompt = buildAgentSystemPrompt(args.agent, args.memoryContext);
  const chatMessages = args.messages
    .filter((m) => m.role !== 'system' && m.content.trim())
    .map((m) =>
      m.role === 'assistant'
        ? ({ role: 'assistant' as const, content: m.content })
        : ({ role: 'user' as const, content: m.content }),
    );

  const result = await invokeIdeChat({
    modelId,
    systemPrompt,
    messages: chatMessages,
    reasoningEffort: 'low',
  });

  return { text: result.content, tokens: result.totalTokens ?? 0 };
}

export async function runAgentChat(args: {
  agentId: string;
  messages: AgentChatMessage[];
  threadId?: string;
  modelId?: string;
  useMemory?: boolean;
  ingestChat?: boolean;
}): Promise<IdeAgentChatResponse> {
  const agent = await getWorkspaceAgent(args.agentId);
  if (!agent) {
    return {
      text: '',
      tools: [],
      filesChanged: false,
      requestDeploy: false,
      error: `Agent "${args.agentId}" not found. Create it in the Agent pane.`,
    };
  }

  const lastUser = [...args.messages].reverse().find((m) => m.role === 'user');
  const memoryContext =
    args.useMemory !== false && lastUser?.content.trim()
      ? await recallContext(args.agentId, lastUser.content.trim())
      : '';

  try {
    let response: IdeAgentChatResponse;
    const workflowId = await resolveAgentChatWorkflowId(agent);
    if (workflowId) {
      const wfResult = await runViaWorkflow({
        workflowId,
        agent,
        messages: args.messages,
        modelId: args.modelId,
        memoryContext,
      });
      response = {
        text: wfResult.text,
        tools: [],
        thoughts: [],
        filesChanged: false,
        requestDeploy: false,
        runId: wfResult.runId,
        threadId: wfResult.threadId ?? args.threadId,
        tokens: wfResult.tokens,
        modelId: args.modelId ?? agent.defaultModelId ?? DEFAULT_IDE_MODEL_ID,
      };
    } else {
      const direct = await runViaDirectLlm({
        agent,
        messages: args.messages,
        modelId: args.modelId,
        memoryContext,
      });
      response = {
        text: direct.text,
        tools: [],
        thoughts: [],
        filesChanged: false,
        requestDeploy: false,
        threadId: args.threadId,
        tokens: direct.tokens,
        modelId: args.modelId ?? agent.defaultModelId ?? DEFAULT_IDE_MODEL_ID,
      };
    }

    if (args.ingestChat !== false && response.text?.trim()) {
      void maybeIngestChatTurn({
        agentId: args.agentId,
        userText: lastUser?.content ?? '',
        assistantText: response.text,
      });
    }
    return response;
  } catch (err) {
    return {
      text: '',
      tools: [],
      filesChanged: false,
      requestDeploy: false,
      error: err instanceof Error ? err.message : 'Chat failed',
      threadId: args.threadId,
    };
  }
}

async function maybeIngestChatTurn(args: {
  agentId: string;
  userText: string;
  assistantText: string;
}): Promise<void> {
  if (process.env.AGENT_CHAT_INGEST === 'false') return;
  const user = args.userText.trim();
  const assistant = args.assistantText.trim();
  if (!user || !assistant) return;
  const text = [`User: ${user}`, `Assistant: ${assistant}`].join('\n\n');
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    `http://localhost:${process.env.PORT?.trim() || '3002'}`;
  try {
    await fetch(`${base}/api/memory/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        scopeKind: 'agent',
        scopeId: args.agentId,
        agentId: args.agentId,
        sourceKind: 'chat',
        useReviewWorkflow: false,
      }),
    });
  } catch {
    /* best-effort */
  }
}

/** Parse agent_chat JSON into partial graph state (used by standard-runtime). */
export function graphStateFromAgentChatInput(input: string): {
  messages: Array<HumanMessage | AIMessage>;
  lastUserInput: string;
  memoryContext: string;
  memory: Record<string, unknown>;
} | null {
  try {
    const parsed = JSON.parse(input) as AgentChatWorkflowInput;
    if (parsed.kind !== 'agent_chat' || !Array.isArray(parsed.messages)) return null;
    const messages = parsed.messages
      .filter((m) => m.content.trim() && m.role !== 'system')
      .map((m) =>
        m.role === 'assistant' ? new AIMessage(m.content) : new HumanMessage(m.content),
      );
    const lastUser = [...parsed.messages].reverse().find((m) => m.role === 'user');
    return {
      messages,
      lastUserInput: lastUser?.content?.trim() ?? '',
      memoryContext: parsed.memoryContext ?? '',
      memory: {
        agentChatSystemPrompt: parsed.systemPrompt,
        agentChatModel: parsed.modelId,
      },
    };
  } catch {
    return null;
  }
}

