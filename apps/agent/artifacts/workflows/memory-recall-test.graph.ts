import { StateGraph, START, END, Annotation, interrupt } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Auto-generated from workflow: Memory Recall (test)
// Workflow ID: cmr0xcvs300043kacg0servhc
// Generated: 2026-06-30T17:32:42.677Z


const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: (a: any, b: any) => [...(a || []), ...(Array.isArray(b) ? b : [b])] }),
  input: Annotation<string>(null),
  output: Annotation<string>(null),
  memory: Annotation<Record<string, unknown>>(null),
  memoryContext: Annotation<string>(null),
});



async function trigger(state: typeof StateAnnotation.State) {
  // TODO: implement node "Query Input"
  return {};
}

async function recall(state: typeof StateAnnotation.State) {
  // TODO: implement node "Chroma Recall"
  return {};
}

async function out(state: typeof StateAnnotation.State) {
  // TODO: implement node "Hits"
  return {};
}
const builder = new StateGraph(StateAnnotation);

builder.addNode('trigger', trigger);
builder.addNode('recall', recall);
builder.addNode('out', out);

// Entry point
builder.addEdge(START, 'trigger');
builder.addEdge('trigger', 'recall');
builder.addEdge('recall', 'out');

// Export
export const graph = builder.compile({
});
export type WorkflowState = typeof StateAnnotation.State;