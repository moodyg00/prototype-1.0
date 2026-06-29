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
}

export function serializeState(state: Partial<GraphState>): SerializedState {
  return {
    input: state.input ?? '',
    output: state.output ?? '',
    messages: (state.messages ?? []).map(serializeMessage),
    memory: state.memory ?? {},
    routeTo: state.routeTo,
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
    return { messages: [response], output: text };
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

function nodeExecutor(node: LangGraphNodeIR) {
  if (node.model) return buildLlmNode(node);
  if (node.kind === 'tool' && node.properties.url !== undefined) return buildHttpToolNode(node);
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

  for (const node of ir.nodes) {
    builder.addNode(node.id, nodeExecutor(node));
  }

  builder.addEdge(START, ir.entryPoint);

  // Group outgoing edges by source for conditional handling.
  const outgoing = new Map<string, typeof ir.edges>();
  for (const edge of ir.edges) {
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
