import { HumanMessage } from '@langchain/core/messages';

import { compileToLangGraphIR } from './compiler';
import { CATALOG_BY_TYPE } from './node-catalog';
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
import { invokeChatLlm } from './llm-invoke';
import { serializeState, type GraphState, type SerializedState } from './runtime';
import type { LangGraphNodeIR, WorkflowDefinition } from './types';

export type StandardRunEvent = { node: string; update: SerializedState };

export type StandardRunResult = {
  events: StandardRunEvent[];
  state: SerializedState;
};

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
  if (typeId === 'trigger.memory_ingest') return buildMemoryIngestTriggerNode(nodeIr);
  if (typeId === 'trigger.manual') {
    return async (state: GraphState): Promise<Partial<GraphState>> => ({
      input: state.input,
      output: state.input,
    });
  }
  if (typeId === 'memory.shard') return buildMemoryShardNode(nodeIr);
  if (typeId === 'memory.tag') return buildMemoryTagNode(nodeIr);
  if (typeId === 'memory.embed') return buildMemoryEmbedNode(nodeIr);
  if (typeId === 'memory.chroma_upsert') return buildMemoryChromaUpsertNode(nodeIr);
  if (typeId === 'memory.chroma_recall' || typeId === 'memory.recall_context') {
    return buildMemoryRecallContextNode(nodeIr);
  }
  if (typeId === 'transform.memory_inject') return buildMemoryInjectNode(nodeIr);
  if (typeId === 'llm.chat') {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
      const { text, tokens } = await invokeChatLlm({
        model: String(nodeIr.properties.model ?? nodeIr.model ?? 'grok-3-mini'),
        systemPrompt: String(nodeIr.properties.systemPrompt ?? nodeIr.systemPrompt ?? ''),
        memoryContext: state.memoryContext,
        input: state.input,
        messages: state.messages ?? [],
        temperature:
          typeof nodeIr.properties.temperature === 'number'
            ? (nodeIr.properties.temperature as number)
            : 0.7,
      });
      return { output: text, tokens, memoryContext: state.memoryContext };
    };
  }
  if (typeId === 'tool.http') {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
      const url = String(nodeIr.properties.url ?? '');
      if (!url) return { output: 'HTTP skipped: no URL' };
      const res = await fetch(url);
      const text = await res.text();
      return { output: text.slice(0, 2000) };
    };
  }
  if (typeId.startsWith('output.')) {
    return async (state: GraphState): Promise<Partial<GraphState>> => state;
  }
  return async (): Promise<Partial<GraphState>> => ({});
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

  let state: GraphState = {
    messages: input ? [new HumanMessage(input)] : [],
    input,
    output: '',
    memory: {},
    routeTo: undefined,
    tokens: 0,
    memoryContext: '',
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