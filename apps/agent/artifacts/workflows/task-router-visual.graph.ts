import { StateGraph, START, END, Annotation, interrupt } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Auto-generated from workflow: Task Router Visual
// Workflow ID: cmr0e7cyi000cpcacay5pcbpl
// Generated: 2026-06-30T08:36:31.564Z


const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: (a: any, b: any) => [...(a || []), ...(Array.isArray(b) ? b : [b])] }),
  input: Annotation<string>(null),
  output: Annotation<string>(null),
  routeTo: Annotation<string | undefined>(null),
});


// Tool: HTTP Worker
async function http_tool(input: unknown) {
  // TODO: implement tool logic for "HTTP Worker"
  throw new Error('Tool "HTTP Worker" not implemented');
}
const http = tool(http_tool, {
  name: 'http',
  description: 'HTTP Worker',
  schema: z.object({ input: z.unknown() }),
});

async function trigger(state: typeof StateAnnotation.State) {
  // TODO: implement node "Task Input"
  return {};
}

async function route(state: typeof StateAnnotation.State): Promise<string> {
  // TODO: implement routing logic for "Needs External Data?"
  // Return the name of the next node to route to.
  const expression = "typeof input === 'string' && /fetch|http|url|api|data/i.test(input)";
  void expression;
  return 'default';
}

async function respondFetch(state: typeof StateAnnotation.State) {
  // TODO: implement node "Respond (with data)"
  return {};
}

async function respondDirect(state: typeof StateAnnotation.State) {
  // TODO: implement node "Respond (direct)"
  return {};
}
const builder = new StateGraph(StateAnnotation);

builder.addNode('trigger', trigger);
builder.addNode('respondFetch', respondFetch);
builder.addNode('respondDirect', respondDirect);
builder.addNode('tools', new ToolNode([http]));

// Entry point
builder.addEdge(START, 'trigger');
builder.addEdge('trigger', 'route');
builder.addEdge('http', 'respondFetch');
builder.addConditionalEdges('route', route, {
  "true": 'http',
  "false": 'respondDirect',
  default: END
});

// Export
export const graph = builder.compile({
});
export type WorkflowState = typeof StateAnnotation.State;