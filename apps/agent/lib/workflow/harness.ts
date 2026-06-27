import { bootstrapAgents, isAgentsBootstrapped } from '../agents/bootstrap';
import { toolRegistry } from '../agents/tools';
import { compileWorkflow, validateWorkflow } from './compiler';
import { CATALOG_BY_TYPE } from './node-catalog';
import type { WorkflowDefinition, WorkflowNode } from './types';

export type HarnessAssertion = {
  name: string;
  pass: boolean;
  detail?: string;
};

export type HarnessResult = {
  ok: boolean;
  assertions: HarnessAssertion[];
};

function nodeFromCatalog(id: string, typeId: string, label: string, x: number, properties: Record<string, unknown>): WorkflowNode {
  const def = CATALOG_BY_TYPE[typeId];
  return {
    id,
    type: 'workflowNode',
    position: { x, y: 0 },
    data: {
      typeId,
      label,
      properties,
      handles: def?.handles ?? [],
      category: def?.category ?? 'tool',
      color: def?.color ?? '#64748b',
      icon: def?.icon ?? 'Circle',
    },
  };
}

const sampleWorkflow: WorkflowDefinition = {
  id: 'harness-sample',
  name: 'Harness sample',
  description: 'Minimal workflow used by the phase-4 harness.',
  kind: 'standard',
  version: 1,
  nodes: [
    nodeFromCatalog('trigger-1', 'trigger.manual', 'Manual trigger', 0, { payload: '{}' }),
    nodeFromCatalog('tool-1', 'tool.http', 'HTTP step', 240, {
      method: 'GET',
      url: 'https://example.com',
      headers: '{}',
      body: '',
    }),
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'trigger-1',
      sourceHandle: 'out',
      target: 'tool-1',
      targetHandle: 'in',
    },
  ],
  metadata: {
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    tags: ['harness'],
    executionMode: 'sequential',
    errorPolicy: 'stop',
    maxRetries: 0,
    timeoutMs: 60_000,
    envVars: [],
    triggers: [{ kind: 'manual', config: {} }],
  },
};

export function runWorkflowHarness(def: WorkflowDefinition = sampleWorkflow): HarnessResult {
  const assertions: HarnessAssertion[] = [];

  bootstrapAgents();
  assertions.push({
    name: 'agents bootstrapped',
    pass: isAgentsBootstrapped(),
  });

  const tools = toolRegistry.list();
  assertions.push({
    name: 'core tools registered',
    pass: tools.length >= 5,
    detail: `registered=${tools.length}`,
  });

  const validation = validateWorkflow(def);
  assertions.push({
    name: 'workflow validates',
    pass: validation.valid,
    detail: validation.errors.map((e) => e.message).join('; ') || undefined,
  });

  const compiled = compileWorkflow(def);
  assertions.push({
    name: 'workflow compiles',
    pass: Boolean(compiled.langGraphIr.nodes.length),
    detail: `nodes=${compiled.langGraphIr.nodes.length}`,
  });

  return {
    ok: assertions.every((a) => a.pass),
    assertions,
  };
}