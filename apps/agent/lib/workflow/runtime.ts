// Server-side LangGraph runtime.
// Builds a runnable StateGraph from a compiled LangGraphIR and executes it.
// Keys are read from the server environment only — never the client.

import { StateGraph, START, END, Annotation, MemorySaver } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import type { LangGraphIR, LangGraphNodeIR } from './types';
import {
  buildMemoryChromaRecallNode,
  buildMemoryChromaUpsertNode,
  buildMemoryEmbedNode,
  buildMemoryInjectNode,
  buildMemoryIngestTriggerNode,
  buildMemoryRecallContextNode,
  buildMemoryShardNode,
  buildMemoryTagNode,
} from './memory-executors';
import { buildIdeChatTriggerNode, type IdeRunState } from './ide-executors';
import { buildLlmAgentNode } from './ide-agent-node';

// ─── State ──────────────────────────────────────────────────────────────────

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (a, b) => [...(a ?? []), ...(Array.isArray(b) ? b : [b])],
    default: () => [],
  }),
  input: Annotation<string>({ reducer: (_a, b) => b, default: () => '' }),
  output: Annotation<string>({ reducer: (_a, b) => b, default: () => '' }),
  memory: Annotation<Record<string, unknown>>({ reducer: (_a, b) => b, default: () => ({}) }),
  routeTo: Annotation<string | undefined>({ reducer: (_a, b) => b, default: () => undefined }),
  // Cumulative token usage across all model nodes in a run (summed). Powers native
  // run observability without any external tracing service.
  tokens: Annotation<number>({ reducer: (a, b) => (a ?? 0) + (b ?? 0), default: () => 0 }),
  memoryContext: Annotation<string>({ reducer: (_a, b) => b, default: () => '' }),
  // IDE agent run context (project slug, side effects, design selection). Seeded
  // by the trigger.ide_chat node and updated by the IDE agent node as tools run.
  ide: Annotation<IdeRunState>({
    reducer: (a, b) => ({ ...(a ?? {}), ...(b ?? {}) }),
    default: () => ({}),
  }),
  // Parsed IDE chat history (replace, not append). Kept separate from `messages`
  // so the raw JSON payload the run route seeds into `messages` never leaks into
  // the agent's conversation.
  ideMessages: Annotation<BaseMessage[]>({
    reducer: (_a, b) => b ?? [],
    default: () => [],
  }),
});

export type GraphState = typeof StateAnnotation.State;

// ─── Serialization helpers ─────────────────────────────────────────────────

export interface SerializedMessage {
  role: 'system' | 'human' | 'ai' | 'tool' | string;
  content: string;
}

export function serializeMessage(msg: BaseMessage): SerializedMessage {
  const role = typeof msg._getType === 'function' ? msg._getType() : 'ai';
  const content =
    typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
  return { role, content };
}

export interface SerializedState {
  input: string;
  output: string;
  messages: SerializedMessage[];
  memory: Record<string, unknown>;
  routeTo?: string;
  tokens: number;
  ide?: IdeRunState;
}

export function serializeState(state: Partial<GraphState>): SerializedState {
  return {
    input: state.input ?? '',
    output: state.output ?? '',
    messages: (state.messages ?? []).map(serializeMessage),
    memory: state.memory ?? {},
    routeTo: state.routeTo,
    tokens: state.tokens ?? 0,
    ...(state.ide ? { ide: state.ide } : {}),
  };
}

// ─── Node executors ─────────────────────────────────────────────────────────

const XAI_BASE_URL = 'https://api.x.ai/v1';

function requiresModel(ir: LangGraphIR): boolean {
  return ir.nodes.some(n => Boolean(n.model));
}

/** True when the IR needs an LLM credential to execute. */
export function missingLlmKey(ir: LangGraphIR): boolean {
  return requiresModel(ir) && !process.env.XAI_API_KEY;
}

function buildLlmNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const model = new ChatOpenAI({
      model: node.model || 'grok-3-mini',
      temperature:
        typeof node.properties.temperature === 'number'
          ? (node.properties.temperature as number)
          : 0.7,
      apiKey: process.env.XAI_API_KEY,
      configuration: { baseURL: XAI_BASE_URL },
    });

    const history = state.messages ?? [];
    const prompt: BaseMessage[] = [
      new SystemMessage(node.systemPrompt || 'You are a helpful assistant.'),
      ...history,
    ];
    if (history.length === 0 && state.input) {
      prompt.push(new HumanMessage(state.input));
    }

    const response = await model.invoke(prompt);
    const text =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);
    // Best-effort token capture for native observability. LangChain attaches
    // usage_metadata on the AIMessage when the provider reports it.
    const usage = (response as unknown as {
      usage_metadata?: { total_tokens?: number };
      response_metadata?: { tokenUsage?: { totalTokens?: number }; usage?: { total_tokens?: number } };
    });
    const tokens =
      usage.usage_metadata?.total_tokens ??
      usage.response_metadata?.tokenUsage?.totalTokens ??
      usage.response_metadata?.usage?.total_tokens ??
      0;
    return { messages: [response], output: text, tokens };
  };
}

function buildHttpToolNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const method = String(node.properties.method ?? 'GET').toUpperCase();
    const url = String(node.properties.url ?? '');
    if (!url) {
      return { output: `Tool "${node.label}" skipped: no URL configured.` };
    }

    let headers: Record<string, string> = {};
    try {
      const raw = node.properties.headers;
      if (typeof raw === 'string' && raw.trim()) headers = JSON.parse(raw);
      else if (raw && typeof raw === 'object') headers = raw as Record<string, string>;
    } catch {
      // ignore malformed header JSON
    }

    let body: string | undefined;
    const rawBody = node.properties.body;
    if (method !== 'GET' && method !== 'HEAD' && rawBody != null && rawBody !== 'null') {
      body = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    }

    const res = await fetch(url, { method, headers, body });
    const text = await res.text();
    const summary = `[${res.status}] ${text}`.slice(0, 4000);
    return {
      messages: [new AIMessage(`HTTP ${method} ${url} → ${res.status}`)],
      output: summary,
      memory: { ...(state.memory ?? {}), [node.id]: { status: res.status, body: text } },
    };
  };
}

function buildPassthroughNode() {
  return async (): Promise<Partial<GraphState>> => ({});
}

// Condition node. Evaluates the authored boolean expression over the current run state
// and sets `routeTo` to the matching branch ('true' | 'false'), which the conditional
// edges built in buildGraph use to pick the next node. The expression is authored in the
// editor and evaluated server-side only (never sent to the client).
function buildConditionNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const expr = String(node.properties.expression ?? 'false');
    let result = false;
    try {
      const fn = new Function('input', 'output', 'memory', 'state', `return (${expr});`);
      result = Boolean(fn(state.input, state.output, state.memory ?? {}, state));
    } catch {
      result = false;
    }
    return { routeTo: result ? 'true' : 'false' };
  };
}

// Browser agent tool node. Reuses the existing BrowserOperator singleton exactly
// (Playwright + xAI vision reasoner loop: navigation, login, extraction, bounded
// loop, secure credential injection). The whole agent loop is encapsulated as a
// single graph tool node so its behavior is faithful to the standalone operator.
// BrowserOperator is imported dynamically so its server-only / Playwright deps are
// only loaded when a workflow actually contains a browser node.
function buildBrowserToolNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const task =
      (typeof node.properties.task === 'string' && node.properties.task.trim()) ||
      state.input ||
      '';
    if (!task) {
      return { output: `Browser agent "${node.label}" skipped: no task provided.` };
    }

    const { getBrowserOperator } = await import('../operators/BrowserOperator');
    const model =
      typeof node.properties.model === 'string' && node.properties.model
        ? (node.properties.model as string)
        : undefined;
    const maxSteps =
      typeof node.properties.maxSteps === 'number' ? (node.properties.maxSteps as number) : undefined;

    const op = getBrowserOperator(model ? { model } : undefined);
    await op.runTask(task, maxSteps ? { maxSteps } : undefined);

    const answer = op.getFinalAnswer() || 'Browser agent finished without a final answer.';
    return {
      messages: [new AIMessage(answer)],
      output: answer,
      memory: { ...(state.memory ?? {}), [node.id]: { task, finalAnswer: answer } },
    };
  };
}

function nodeExecutor(node: LangGraphNodeIR) {
  if (node.nodeType === 'tool.browser') return buildBrowserToolNode(node);
  if (node.nodeType === 'logic.condition') return buildConditionNode(node);
  if (node.nodeType === 'trigger.memory_ingest') return buildMemoryIngestTriggerNode(node);
  if (node.nodeType === 'memory.shard') return buildMemoryShardNode(node);
  if (node.nodeType === 'memory.tag') return buildMemoryTagNode(node);
  if (node.nodeType === 'memory.embed') return buildMemoryEmbedNode(node);
  if (node.nodeType === 'memory.chroma_upsert') return buildMemoryChromaUpsertNode(node);
  if (node.nodeType === 'memory.chroma_recall') return buildMemoryChromaRecallNode(node);
  if (node.nodeType === 'memory.recall_context') return buildMemoryRecallContextNode(node);
  if (node.nodeType === 'transform.memory_inject') return buildMemoryInjectNode(node);
  if (node.nodeType === 'trigger.ide_chat') return buildIdeChatTriggerNode(node);
  if (node.model) return buildLlmNode(node);
  if (node.kind === 'tool' && (node.nodeType === 'tool.http' || node.properties.url !== undefined)) {
    return buildHttpToolNode(node);
  }
  return buildPassthroughNode();
}

// ─── Conditional routing ────────────────────────────────────────────────────

function buildRouter(branchKeys: string[]) {
  return (state: GraphState): string => {
    if (state.routeTo && branchKeys.includes(state.routeTo)) return state.routeTo;
    return branchKeys[0] ?? 'default';
  };
}

// ─── Graph builder ──────────────────────────────────────────────────────────

const checkpointer = new MemorySaver();

export interface BuiltGraph {
  // CompiledStateGraph is heavily generic; the route only needs the runnable surface.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graph: any;
  interruptNodes: string[];
}

export function buildGraph(ir: LangGraphIR): BuiltGraph {
  // The graph is constructed from dynamic node ids, which defeats LangGraph's
  // literal-string node typing — use a loose builder reference for construction.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = new StateGraph(StateAnnotation);

  const conditionalSources = new Set(
    ir.nodes.filter(n => n.kind === 'conditional').map(n => n.id),
  );

  // IDE tool nodes are not standalone graph nodes — they are bound to the
  // llm.agent node they connect to (via its "tools" input). Collect them per
  // agent and exclude both the nodes and their edges from the graph proper.
  const ideToolNodeIds = new Set(
    ir.nodes.filter(n => n.nodeType?.startsWith('tool.ide.')).map(n => n.id),
  );
  const agentToolNodes = new Map<string, LangGraphNodeIR[]>();
  for (const edge of ir.edges) {
    if (ideToolNodeIds.has(edge.from)) {
      const toolNode = ir.nodes.find(n => n.id === edge.from);
      if (toolNode) {
        const list = agentToolNodes.get(edge.to) ?? [];
        list.push(toolNode);
        agentToolNodes.set(edge.to, list);
      }
    }
  }

  for (const node of ir.nodes) {
    if (ideToolNodeIds.has(node.id)) continue;
    if (node.nodeType === 'llm.agent') {
      builder.addNode(node.id, buildLlmAgentNode(node, agentToolNodes.get(node.id) ?? []));
    } else {
      builder.addNode(node.id, nodeExecutor(node));
    }
  }

  builder.addEdge(START, ir.entryPoint);

  // Group outgoing edges by source for conditional handling. Edges that touch a
  // bound IDE tool node are dropped (the binding is handled above).
  const outgoing = new Map<string, typeof ir.edges>();
  for (const edge of ir.edges) {
    if (ideToolNodeIds.has(edge.from) || ideToolNodeIds.has(edge.to)) continue;
    const group = outgoing.get(edge.from) ?? [];
    group.push(edge);
    outgoing.set(edge.from, group);
  }

  for (const [from, edges] of outgoing.entries()) {
    if (conditionalSources.has(from)) {
      const mapping: Record<string, string> = {};
      for (const edge of edges) {
        mapping[edge.condition ?? edge.to] = edge.to;
      }
      const branchKeys = Object.keys(mapping);
      mapping.default = END as unknown as string;
      builder.addConditionalEdges(from, buildRouter(branchKeys), mapping);
    } else {
      for (const edge of edges) {
        builder.addEdge(from, edge.to);
      }
    }
  }

  // Terminal nodes (no outgoing edge) connect to END so the graph can halt.
  for (const node of ir.nodes) {
    if (ideToolNodeIds.has(node.id)) continue;
    if (!outgoing.has(node.id)) {
      builder.addEdge(node.id, END);
    }
  }

  const interruptNodes = ir.interruptBefore ?? [];
  const graph = builder.compile({
    checkpointer,
    ...(interruptNodes.length ? { interruptBefore: interruptNodes } : {}),
  });

  return { graph, interruptNodes };
}

export function interruptPrompt(ir: LangGraphIR, nodeId: string): string {
  const node = ir.nodes.find(n => n.id === nodeId);
  const prompt = node?.properties?.prompt;
  return typeof prompt === 'string' ? prompt : 'Please review and approve.';
}
