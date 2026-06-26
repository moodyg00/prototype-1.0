import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  LangGraphIR,
  LangGraphNodeIR,
  LangGraphEdgeIR,
  LangGraphStateField,
  WorkflowExportArtifacts,
} from './types';
import { CATALOG_BY_TYPE } from './node-catalog';

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ nodeId?: string; message: string }>;
  warnings: Array<{ nodeId?: string; message: string }>;
}

export function validateWorkflow(def: WorkflowDefinition): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  if (!def.nodes.length) {
    errors.push({ message: 'Workflow has no nodes.' });
    return { valid: false, errors, warnings };
  }

  const nodeIds = new Set(def.nodes.map(n => n.id));

  // Check all edge endpoints exist
  for (const edge of def.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({ message: `Edge ${edge.id}: source node "${edge.source}" not found.` });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({ message: `Edge ${edge.id}: target node "${edge.target}" not found.` });
    }
  }

  // Check required properties on each node
  for (const node of def.nodes) {
    const typeDef = CATALOG_BY_TYPE[node.data.typeId];
    if (!typeDef) {
      warnings.push({ nodeId: node.id, message: `Unknown node type "${node.data.typeId}".` });
      continue;
    }
    for (const field of typeDef.properties) {
      if (field.required && (node.data.properties[field.key] === undefined || node.data.properties[field.key] === '')) {
        errors.push({ nodeId: node.id, message: `Required property "${field.label}" is missing.` });
      }
    }
  }

  // Check for trigger nodes
  const hasTrigger = def.nodes.some(n => {
    const t = CATALOG_BY_TYPE[n.data.typeId];
    return t?.category === 'trigger';
  });
  if (!hasTrigger) {
    warnings.push({ message: 'Workflow has no trigger node.' });
  }

  // Check for orphan nodes (no edges, and not a trigger/output)
  const connectedNodes = new Set([
    ...def.edges.map(e => e.source),
    ...def.edges.map(e => e.target),
  ]);
  for (const node of def.nodes) {
    if (!connectedNodes.has(node.id) && def.nodes.length > 1) {
      const t = CATALOG_BY_TYPE[node.data.typeId];
      if (t?.category !== 'trigger' && t?.category !== 'output') {
        warnings.push({ nodeId: node.id, message: `Node "${node.data.label}" is not connected to anything.` });
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── LangGraph IR Compiler ────────────────────────────────────────────────────

function deriveStateSchema(nodes: WorkflowNode[]): LangGraphStateField[] {
  const fields: LangGraphStateField[] = [
    { key: 'messages', type: 'BaseMessage[]', reducer: 'append', description: 'Conversation message history' },
    { key: 'input', type: 'string', reducer: 'replace', description: 'Current input to process' },
    { key: 'output', type: 'string', reducer: 'replace', description: 'Final output value' },
  ];

  // Add node-specific state keys based on node type patterns
  const hasMemory = nodes.some(n => n.data.typeId.startsWith('memory.'));
  if (hasMemory) {
    fields.push({ key: 'memory', type: 'Record<string, unknown>', reducer: 'replace', description: 'Agent memory context' });
  }

  const hasConditional = nodes.some(n => n.data.typeId === 'logic.condition');
  if (hasConditional) {
    fields.push({ key: 'routeTo', type: 'string | undefined', reducer: 'replace', description: 'Conditional routing target' });
  }

  return fields;
}

function compileNode(node: WorkflowNode): LangGraphNodeIR {
  const typeDef = CATALOG_BY_TYPE[node.data.typeId];
  const kind = typeDef?.langGraphKind ?? 'node';
  const props = node.data.properties;

  const ir: LangGraphNodeIR = {
    id: node.id,
    kind,
    label: node.data.label,
    stateInputKeys: ['messages', 'input'],
    stateOutputKeys: ['messages', 'output'],
    properties: props,
  };

  if (node.data.typeId.startsWith('llm.')) {
    ir.model = (props.model as string) || 'grok-3-mini';
    ir.systemPrompt = (props.systemPrompt as string) || '';
  }

  if (node.data.typeId === 'tool.http' || node.data.typeId === 'tool.code') {
    ir.kind = 'tool';
    ir.toolRef = node.id;
  }

  if (node.data.typeId === 'langgraph.interrupt') {
    ir.kind = 'interrupt';
  }

  if (node.data.typeId === 'langgraph.subgraph') {
    ir.kind = 'subgraph';
  }

  return ir;
}

function compileEdges(edges: WorkflowEdge[], nodes: WorkflowNode[]): LangGraphEdgeIR[] {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return edges.map(edge => {
    const sourceNode = nodeMap[edge.source];
    const ir: LangGraphEdgeIR = { from: edge.source, to: edge.target };

    // Conditional edges use the handle id as the branch key
    if (sourceNode?.data.typeId === 'logic.condition') {
      ir.condition = edge.sourceHandle; // 'true' | 'false'
    } else if (edge.condition) {
      ir.condition = edge.condition;
    }

    return ir;
  });
}

export function compileToLangGraphIR(def: WorkflowDefinition): LangGraphIR {
  const stateSchema = deriveStateSchema(def.nodes);

  const entryNode = def.nodes.find(n => {
    const t = CATALOG_BY_TYPE[n.data.typeId];
    return t?.category === 'trigger';
  }) ?? def.nodes[0];

  const interruptBefore = def.nodes
    .filter(n => n.data.typeId === 'langgraph.interrupt')
    .map(n => n.id);

  return {
    workflowId: def.id,
    workflowName: def.name,
    stateSchema,
    entryPoint: entryNode.id,
    nodes: def.nodes.map(compileNode),
    edges: compileEdges(def.edges, def.nodes),
    interruptBefore: interruptBefore.length ? interruptBefore : undefined,
  };
}

// ─── TypeScript Scaffold Generator ───────────────────────────────────────────

function stateFieldToAnnotation(field: LangGraphStateField): string {
  const reducer =
    field.reducer === 'append'
      ? `{ reducer: (a: any, b: any) => [...(a || []), ...(Array.isArray(b) ? b : [b])] }`
      : `null`;
  return `  ${field.key}: Annotation<${field.type}>(${reducer}),`;
}

function nodeToFunction(node: LangGraphNodeIR): string {
  if (node.kind === 'tool') {
    return `
// Tool: ${node.label}
async function ${sanitizeId(node.id)}_tool(input: unknown) {
  // TODO: implement tool logic for "${node.label}"
  throw new Error('Tool "${node.label}" not implemented');
}
const ${sanitizeId(node.id)} = tool(${sanitizeId(node.id)}_tool, {
  name: '${node.id}',
  description: '${node.label}',
  schema: z.object({ input: z.unknown() }),
});`;
  }

  if (node.kind === 'conditional') {
    return `
async function ${sanitizeId(node.id)}(state: typeof StateAnnotation.State): Promise<string> {
  // TODO: implement routing logic for "${node.label}"
  // Return the name of the next node to route to.
  const expression = ${JSON.stringify(node.properties.expression ?? 'false')};
  void expression;
  return 'default';
}`;
  }

  if (node.kind === 'interrupt') {
    return `
async function ${sanitizeId(node.id)}(state: typeof StateAnnotation.State) {
  interrupt(${JSON.stringify(node.properties.prompt ?? 'Please review.')});
  return {};
}`;
  }

  if (node.model) {
    return `
async function ${sanitizeId(node.id)}(state: typeof StateAnnotation.State) {
  const model = new ChatOpenAI({ model: '${node.model}' });
  const response = await model.invoke([
    new SystemMessage(${JSON.stringify(node.systemPrompt ?? 'You are a helpful assistant.')}),
    ...state.messages,
  ]);
  return { messages: [response], output: response.content as string };
}`;
  }

  return `
async function ${sanitizeId(node.id)}(state: typeof StateAnnotation.State) {
  // TODO: implement node "${node.label}"
  return {};
}`;
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

export function generateTypeScaffold(ir: LangGraphIR): string {
  const imports = `import { StateGraph, START, END, Annotation, interrupt } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Auto-generated from workflow: ${ir.workflowName}
// Workflow ID: ${ir.workflowId}
// Generated: ${new Date().toISOString()}
`;

  const stateAnnotation = `
const StateAnnotation = Annotation.Root({
${ir.stateSchema.map(stateFieldToAnnotation).join('\n')}
});
`;

  const toolNodes = ir.nodes.filter(n => n.kind === 'tool');
  const otherNodes = ir.nodes.filter(n => n.kind !== 'tool');

  const nodeFunctions = otherNodes.map(nodeToFunction).join('\n');
  const toolFunctions = toolNodes.map(nodeToFunction).join('\n');

  const builderLines: string[] = [];
  builderLines.push(`const builder = new StateGraph(StateAnnotation);`);
  builderLines.push('');

  // Add non-tool nodes
  for (const node of otherNodes) {
    if (node.kind === 'conditional') continue;
    builderLines.push(`builder.addNode('${node.id}', ${sanitizeId(node.id)});`);
  }

  // Add tool node if any tools
  if (toolNodes.length > 0) {
    const toolList = toolNodes.map(n => sanitizeId(n.id)).join(', ');
    builderLines.push(`builder.addNode('tools', new ToolNode([${toolList}]));`);
  }

  builderLines.push('');
  builderLines.push(`// Entry point`);
  builderLines.push(`builder.addEdge(START, '${ir.entryPoint}');`);

  // Build edge/conditional groupings
  const conditionals = new Map<string, LangGraphEdgeIR[]>();
  const plainEdges: LangGraphEdgeIR[] = [];

  for (const edge of ir.edges) {
    const sourceNode = ir.nodes.find(n => n.id === edge.from);
    if (sourceNode?.kind === 'conditional') {
      const group = conditionals.get(edge.from) ?? [];
      group.push(edge);
      conditionals.set(edge.from, group);
    } else {
      plainEdges.push(edge);
    }
  }

  for (const edge of plainEdges) {
    builderLines.push(`builder.addEdge('${edge.from}', '${edge.to}');`);
  }

  for (const [fromId, branches] of conditionals.entries()) {
    const mappingEntries = branches
      .map(b => `  ${JSON.stringify(b.condition ?? b.to)}: '${b.to}'`)
      .join(',\n');
    builderLines.push(`builder.addConditionalEdges('${fromId}', ${sanitizeId(fromId)}, {\n${mappingEntries},\n  default: END\n});`);
  }

  builderLines.push('');
  builderLines.push(`// Export`);
  builderLines.push(`export const graph = builder.compile({`);
  if (ir.interruptBefore?.length) {
    builderLines.push(`  interruptBefore: ${JSON.stringify(ir.interruptBefore)},`);
  }
  builderLines.push(`});`);
  builderLines.push(`export type WorkflowState = typeof StateAnnotation.State;`);

  return [imports, stateAnnotation, toolFunctions, nodeFunctions, builderLines.join('\n')].join('\n');
}

// ─── Full Export Pipeline ─────────────────────────────────────────────────────

export function compileWorkflow(def: WorkflowDefinition): WorkflowExportArtifacts {
  const langGraphIr = compileToLangGraphIR(def);
  const typescriptScaffold = generateTypeScaffold(langGraphIr);

  return {
    workflowId: def.id,
    version: def.version,
    exportedAt: new Date().toISOString(),
    productionJson: def,
    langGraphIr,
    typescriptScaffold,
  };
}
