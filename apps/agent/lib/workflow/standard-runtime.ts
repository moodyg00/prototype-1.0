import { HumanMessage } from '@langchain/core/messages';

import { graphStateFromAgentChatInput } from '@/lib/agents/agent-chat';

import { compileToLangGraphIR } from './compiler';
import { CATALOG_BY_TYPE } from './node-catalog';
import { nodeExecutor, serializeState, type GraphState, type SerializedState } from './runtime';
import type { LangGraphNodeIR, WorkflowDefinition } from './types';

export type StandardRunEvent = { node: string; update: SerializedState };

export type StandardRunResult = {
  events: StandardRunEvent[];
  state: SerializedState;
};

/**
 * "Standard" is deliberately a thin, straight-line SUBSET of the LangGraph engine,
 * not a second interpreter: node execution is delegated entirely to `nodeExecutor`
 * from runtime.ts (the same function `buildGraph` uses), so llm.chat, tool.http,
 * memory.x, video.x, and tool.browser nodes behave identically regardless of kind.
 * The only things this module still owns are (a) the single-outgoing-edge walk
 * order and (b) the trigger.manual seed step, since a "standard" workflow has no
 * StateGraph to seed the entry node for it.
 */
function orderedNodeIds(def: WorkflowDefinition): string[] {
  const trigger = def.nodes.find((n) => CATALOG_BY_TYPE[n.data.typeId]?.category === 'trigger');
  if (!trigger) return def.nodes.map((n) => n.id);

  const order: string[] = [trigger.id];
  let current = trigger.id;
  const visited = new Set(order);

  while (true) {
    const edge = def.edges.find((e) => e.source === current);
    if (!edge || visited.has(edge.target)) break;
    order.push(edge.target);
    visited.add(edge.target);
    current = edge.target;
  }
  return order;
}

function executorForTypeId(typeId: string, nodeIr: LangGraphNodeIR) {
  if (typeId === 'trigger.manual') {
    return async (state: GraphState): Promise<Partial<GraphState>> => ({
      input: state.input,
      output: state.input,
    });
  }
  return nodeExecutor(nodeIr);
}

export function validateStandardWorkflow(def: WorkflowDefinition): string | null {
  const hasConditional = def.nodes.some((n) => n.data.typeId === 'logic.condition');
  const hasInterrupt = def.nodes.some((n) => n.data.typeId === 'langgraph.interrupt');
  if (hasConditional || hasInterrupt) {
    return 'Standard workflows cannot contain condition or interrupt nodes. Use kind: langgraph.';
  }
  return null;
}

export async function runStandardWorkflow(
  def: WorkflowDefinition,
  input: string,
): Promise<StandardRunResult> {
  const ir = compileToLangGraphIR(def);
  const nodeById = Object.fromEntries(def.nodes.map((n) => [n.id, n]));
  const irById = Object.fromEntries(ir.nodes.map((n) => [n.id, n]));

  const agentChatSeed = graphStateFromAgentChatInput(input);

  let state: GraphState = {
    messages: agentChatSeed?.messages ?? (input ? [new HumanMessage(input)] : []),
    input: agentChatSeed?.lastUserInput ?? input,
    output: '',
    memory: agentChatSeed?.memory ?? {},
    routeTo: undefined,
    tokens: 0,
    memoryContext: agentChatSeed?.memoryContext ?? '',
    ide: {},
    ideMessages: [],
  };

  const events: StandardRunEvent[] = [];

  for (const nodeId of orderedNodeIds(def)) {
    const wfNode = nodeById[nodeId];
    const nodeIr = irById[nodeId];
    if (!wfNode || !nodeIr) continue;

    const exec = executorForTypeId(wfNode.data.typeId, nodeIr);
    const patch = await exec(state);
    state = { ...state, ...patch, memory: { ...(state.memory ?? {}), ...(patch.memory ?? {}) } };
    events.push({ node: nodeId, update: serializeState(state) });
  }

  return { events, state: serializeState(state) };
}