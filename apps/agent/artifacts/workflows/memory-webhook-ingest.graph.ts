import { StateGraph, START, END, Annotation, interrupt } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Auto-generated from workflow: Memory Webhook ingest
// Workflow ID: cmr0xcz86000k3kacg0ijio2o
// Generated: 2026-06-30T17:32:46.530Z


const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: (a: any, b: any) => [...(a || []), ...(Array.isArray(b) ? b : [b])] }),
  input: Annotation<string>(null),
  output: Annotation<string>(null),
  memory: Annotation<Record<string, unknown>>(null),
});



async function trigger(state: typeof StateAnnotation.State) {
  // TODO: implement node "Ingest Payload"
  return {};
}

async function shard(state: typeof StateAnnotation.State) {
  // TODO: implement node "Shard"
  return {};
}

async function tag(state: typeof StateAnnotation.State) {
  // TODO: implement node "Tag"
  return {};
}

async function embed(state: typeof StateAnnotation.State) {
  // TODO: implement node "Embed"
  return {};
}

async function upsert(state: typeof StateAnnotation.State) {
  // TODO: implement node "Chroma Upsert"
  return {};
}

async function out(state: typeof StateAnnotation.State) {
  // TODO: implement node "Done"
  return {};
}
const builder = new StateGraph(StateAnnotation);

builder.addNode('trigger', trigger);
builder.addNode('shard', shard);
builder.addNode('tag', tag);
builder.addNode('embed', embed);
builder.addNode('upsert', upsert);
builder.addNode('out', out);

// Entry point
builder.addEdge(START, 'trigger');
builder.addEdge('trigger', 'shard');
builder.addEdge('shard', 'tag');
builder.addEdge('tag', 'embed');
builder.addEdge('embed', 'upsert');
builder.addEdge('upsert', 'out');

// Export
export const graph = builder.compile({
});
export type WorkflowState = typeof StateAnnotation.State;