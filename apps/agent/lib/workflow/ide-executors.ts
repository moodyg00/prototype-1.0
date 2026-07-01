import { AIMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages';
import type { DesignContext, ToolEvent, ThoughtStep, AgentTodoItem } from '@prototype/ide-tools';
import { IDE_TOOL_NAMES, type IdeToolName } from '@prototype/ide-tools/langchain';

import type { GraphState } from './runtime';
import type { LangGraphNodeIR } from './types';

/**
 * Per-run IDE state threaded through the graph. Seeded by the `trigger.ide_chat`
 * node and updated by the agent node as tools run, so the run adapter can report
 * what changed back to the public-dev IDE.
 */
export interface IdeRunState {
  slug?: string;
  runId?: string;
  modelId?: string;
  filesChanged?: boolean;
  requestDeploy?: boolean;
  deployReason?: string;
  events?: ToolEvent[];
  thoughts?: ThoughtStep[];
  checkpointedPaths?: string[];
  todos?: AgentTodoItem[];
  designContext?: DesignContext;
}

type IncomingMessage = { role?: string; content?: unknown };

interface IdeChatPayload {
  slug: string;
  messages: IncomingMessage[];
  designContext?: DesignContext;
  runId?: string;
  threadId?: string;
  modelId?: string;
  todos?: AgentTodoItem[];
}

function parseIdeChatPayload(state: GraphState, props: Record<string, unknown>): IdeChatPayload {
  const raw =
    (typeof state.input === 'string' && state.input.trim()) ||
    (typeof props.payload === 'string' ? (props.payload as string) : '') ||
    '{}';
  let parsed: Partial<IdeChatPayload> = {};
  try {
    parsed = JSON.parse(raw) as Partial<IdeChatPayload>;
  } catch {
    // A bare string input is treated as a single user message with no project.
    return { slug: '', messages: [{ role: 'user', content: raw }] };
  }
  return {
    slug: typeof parsed.slug === 'string' ? parsed.slug : '',
    messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    designContext: parsed.designContext,
    runId: typeof parsed.runId === 'string' ? parsed.runId : undefined,
    threadId: typeof parsed.threadId === 'string' ? parsed.threadId : undefined,
    modelId: typeof parsed.modelId === 'string' ? parsed.modelId : undefined,
    todos: Array.isArray(parsed.todos) ? parsed.todos : undefined,
  };
}

function toBaseMessages(messages: IncomingMessage[]): BaseMessage[] {
  return messages
    .filter((m) => typeof m.content === 'string' && m.content.trim())
    .map((m) => {
      const content = m.content as string;
      return m.role === 'assistant' ? new AIMessage(content) : new HumanMessage(content);
    });
}

/**
 * Entry node for IDE agent runs. Parses the structured chat payload into graph
 * state: project slug + design context into `state.ide`, and the chat history
 * into `state.messages`.
 */
export function buildIdeChatTriggerNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const payload = parseIdeChatPayload(state, node.properties);
    const messages = toBaseMessages(payload.messages);
    const lastUser = [...payload.messages]
      .reverse()
      .find((m) => m.role === 'user' && typeof m.content === 'string');

    return {
      ide: {
        slug: payload.slug,
        runId: payload.runId,
        modelId: payload.modelId,
        filesChanged: false,
        requestDeploy: false,
        events: [],
        thoughts: [],
        checkpointedPaths: [],
        todos: Array.isArray(payload.todos) ? [...payload.todos] : [],
        designContext: payload.designContext,
      },
      ideMessages: messages,
      input: typeof lastUser?.content === 'string' ? lastUser.content : state.input ?? '',
    };
  };
}

/** Map a `tool.ide.*` catalog type to its short IDE tool name, or null. */
export function ideToolNameFromType(typeId: string | undefined): IdeToolName | null {
  if (!typeId || !typeId.startsWith('tool.ide.')) return null;
  const short = typeId.slice('tool.ide.'.length) as IdeToolName;
  return IDE_TOOL_NAMES.includes(short) ? short : null;
}
