import { StateGraph, START, END, Annotation, interrupt } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Auto-generated from workflow: Simple HTTP Tool Visual
// Workflow ID: cmqz8nr200004pcaclyg5esdn
// Generated: 2026-06-29T13:13:32.320Z


const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: (a: any, b: any) => [...(a || []), ...(Array.isArray(b) ? b : [b])] }),
  input: Annotation<string>(null),
  output: Annotation<string>(null),
});


// Tool: HTTP GET
async function http_tool(input: unknown) {
  // TODO: implement tool logic for "HTTP GET"
  throw new Error('Tool "HTTP GET" not implemented');
}
const http = tool(http_tool, {
  name: 'http',
  description: 'HTTP GET',
  schema: z.object({ input: z.unknown() }),
});

async function trigger(state: typeof StateAnnotation.State) {
  // TODO: implement node "Manual Trigger"
  return {};
}

async function out(state: typeof StateAnnotation.State) {
  // TODO: implement node "Result"
  return {};
}
const builder = new StateGraph(StateAnnotation);

builder.addNode('trigger', trigger);
builder.addNode('out', out);
builder.addNode('tools', new ToolNode([http]));

// Entry point
builder.addEdge(START, 'trigger');
builder.addEdge('trigger', 'http');
builder.addEdge('http', 'out');

// Export
export const graph = builder.compile({
});
export type WorkflowState = typeof StateAnnotation.State;