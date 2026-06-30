/**
 * Seeds memory ingest/recall workflows for the visual designer.
 *
 *   BASE_URL=http://localhost:3002 npx tsx scripts/seed-memory-workflows.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { CATALOG_BY_TYPE } from '../lib/workflow/node-catalog';
import type { WorkflowDefinition, WorkflowEdge, WorkflowNode } from '../lib/workflow/types';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const ARTIFACT_DIR = path.join(process.cwd(), 'artifacts', 'workflows');

type NodeSpec = {
  id: string;
  typeId: string;
  label: string;
  x: number;
  properties: Record<string, unknown>;
};

function node({ id, typeId, label, x, properties }: NodeSpec): WorkflowNode {
  const def = CATALOG_BY_TYPE[typeId];
  if (!def) throw new Error(`Unknown node type: ${typeId}`);
  return {
    id,
    type: 'workflowNode',
    position: { x, y: 0 },
    data: {
      typeId,
      label,
      properties,
      handles: def.handles,
      category: def.category,
      color: def.color,
      icon: def.icon,
    },
  };
}

function edge(id: string, source: string, target: string): WorkflowEdge {
  return { id, source, sourceHandle: 'out', target, targetHandle: 'in' };
}

type Blueprint = {
  name: string;
  description: string;
  kind: 'standard' | 'langgraph';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  timeoutMs: number;
  tags: string[];
  triggers?: Array<{ kind: 'manual' | 'webhook' | 'schedule'; config: Record<string, unknown> }>;
};

const memoryIngestLinear: Blueprint = {
  name: 'Memory Ingest (linear)',
  description: 'LangChain-standard pipeline: ingest trigger → shard → tag → embed → Chroma upsert → output.',
  kind: 'standard',
  nodes: [
    node({
      id: 'trigger',
      typeId: 'trigger.memory_ingest',
      label: 'Ingest Payload',
      x: 0,
      properties: {
        payload: '{"text":"","scopeKind":"global","sourceKind":"domain"}',
        scopeKind: 'global',
        sourceKind: 'domain',
      },
    }),
    node({ id: 'shard', typeId: 'memory.shard', label: 'Shard', x: 200, properties: { maxChars: 1200, scopeKind: 'global' } }),
    node({ id: 'tag', typeId: 'memory.tag', label: 'Tag', x: 400, properties: { partition: 'default', sourceKind: 'domain' } }),
    node({ id: 'embed', typeId: 'memory.embed', label: 'Embed', x: 600, properties: {} }),
    node({ id: 'upsert', typeId: 'memory.chroma_upsert', label: 'Chroma Upsert', x: 800, properties: { partition: 'default' } }),
    node({ id: 'out', typeId: 'output.terminal', label: 'Done', x: 1000, properties: { label: 'ingest' } }),
  ],
  edges: [
    edge('e1', 'trigger', 'shard'),
    edge('e2', 'shard', 'tag'),
    edge('e3', 'tag', 'embed'),
    edge('e4', 'embed', 'upsert'),
    edge('e5', 'upsert', 'out'),
  ],
  timeoutMs: 120_000,
  tags: ['memory-ingest', 'memory', 'standard'],
};

const memoryRecallTest: Blueprint = {
  name: 'Memory Recall (test)',
  description: 'Standard recall workflow for Recall lab and debugging.',
  kind: 'standard',
  nodes: [
    node({
      id: 'trigger',
      typeId: 'trigger.manual',
      label: 'Query Input',
      x: 0,
      properties: { payload: '{}' },
    }),
    node({
      id: 'recall',
      typeId: 'memory.chroma_recall',
      label: 'Chroma Recall',
      x: 280,
      properties: { agentId: 'default', topK: 8, scopeKind: 'global' },
    }),
    node({ id: 'out', typeId: 'output.respond', label: 'Hits', x: 560, properties: { statusCode: 200 } }),
  ],
  edges: [edge('e1', 'trigger', 'recall'), edge('e2', 'recall', 'out')],
  timeoutMs: 60_000,
  tags: ['memory-recall', 'memory', 'standard'],
};

const memoryIngestReview: Blueprint = {
  name: 'Memory Ingest (with review)',
  description: 'LangGraph ingest with human-in-the-loop before Chroma upsert.',
  kind: 'langgraph',
  nodes: [
    node({
      id: 'trigger',
      typeId: 'trigger.memory_ingest',
      label: 'Ingest Payload',
      x: 0,
      properties: { scopeKind: 'global', sourceKind: 'domain' },
    }),
    node({ id: 'shard', typeId: 'memory.shard', label: 'Shard', x: 200, properties: { maxChars: 1200 } }),
    node({ id: 'tag', typeId: 'memory.tag', label: 'Tag', x: 400, properties: { partition: 'default' } }),
    node({ id: 'embed', typeId: 'memory.embed', label: 'Embed', x: 600, properties: {} }),
    node({
      id: 'review',
      typeId: 'langgraph.interrupt',
      label: 'Review before upsert',
      x: 800,
      properties: { prompt: 'Review tagged chunks before writing to Chroma. Resume to upsert.' },
    }),
    node({ id: 'upsert', typeId: 'memory.chroma_upsert', label: 'Chroma Upsert', x: 1080, properties: {} }),
    node({ id: 'out', typeId: 'output.respond', label: 'Done', x: 1320, properties: { statusCode: 200 } }),
  ],
  edges: [
    edge('e1', 'trigger', 'shard'),
    edge('e2', 'shard', 'tag'),
    edge('e3', 'tag', 'embed'),
    edge('e4', 'embed', 'review'),
    edge('e5', 'review', 'upsert'),
    edge('e6', 'upsert', 'out'),
  ],
  timeoutMs: 300_000,
  tags: ['memory-ingest', 'memory', 'langgraph'],
};

const memoryAgentRag: Blueprint = {
  name: 'Memory Agent (RAG)',
  description: 'Default agent graph: recall vector memory → inject context → LLM chat response.',
  kind: 'langgraph',
  nodes: [
    node({
      id: 'trigger',
      typeId: 'trigger.manual',
      label: 'User prompt',
      x: 0,
      properties: { payload: '{}' },
    }),
    node({
      id: 'recall',
      typeId: 'memory.recall_context',
      label: 'Recall context',
      x: 240,
      properties: { agentId: 'default', topK: 6, scopeKind: 'agent', scopeId: 'default' },
    }),
    node({
      id: 'inject',
      typeId: 'transform.memory_inject',
      label: 'Inject memory',
      x: 480,
      properties: { header: '## Retrieved memory' },
    }),
    node({
      id: 'llm',
      typeId: 'llm.chat',
      label: 'Agent LLM',
      x: 720,
      properties: {
        model: 'grok-3-mini',
        systemPrompt: 'You are a helpful executive agent. Use retrieved memory faithfully.',
        temperature: 0.5,
      },
    }),
    node({ id: 'out', typeId: 'output.respond', label: 'Respond', x: 960, properties: { statusCode: 200 } }),
  ],
  edges: [
    edge('e1', 'trigger', 'recall'),
    edge('e2', 'recall', 'inject'),
    edge('e3', 'inject', 'llm'),
    edge('e4', 'llm', 'out'),
  ],
  timeoutMs: 120_000,
  tags: ['memory-agent', 'memory', 'langgraph', 'default-agent'],
};

const memoryWebhookIngest: Blueprint = {
  name: 'Memory Webhook ingest',
  description: 'Same linear ingest chain; triggered via POST /api/memory/hooks/ingest.',
  kind: 'standard',
  nodes: memoryIngestLinear.nodes,
  edges: memoryIngestLinear.edges,
  timeoutMs: 120_000,
  tags: ['memory-ingest', 'memory', 'webhook'],
  triggers: [
    {
      kind: 'webhook',
      config: { path: '/api/memory/hooks/ingest', secretHeader: 'X-Memory-Webhook-Secret' },
    },
  ],
};

const turnCapture: Blueprint = {
  name: 'Turn capture',
  description: 'Capture agent turns into scoped vector memory (standard pipeline).',
  kind: 'standard',
  nodes: memoryIngestLinear.nodes.map((n) =>
    n.id === 'trigger'
      ? node({
          id: 'trigger',
          typeId: 'trigger.memory_ingest',
          label: 'Turn payload',
          x: 0,
          properties: {
            scopeKind: 'agent',
            sourceKind: 'turn',
            payload: '{"text":"","scopeKind":"agent","sourceKind":"turn"}',
          },
        })
      : { ...n },
  ),
  edges: memoryIngestLinear.edges,
  timeoutMs: 120_000,
  tags: ['memory-turn', 'memory', 'standard'],
  triggers: [
    {
      kind: 'schedule',
      config: { cron: '0 */6 * * *', endpoint: '/api/memory/cron/ingest' },
    },
  ],
};

async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${url} -> ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`);
  }
  return json;
}

async function upsert(bp: Blueprint): Promise<string> {
  const list = (await api('GET', '/api/workflow')) as Array<{ id: string; name: string }>;
  const existing = list.find((w) => w.name === bp.name);

  let id: string;
  if (existing) {
    id = existing.id;
    console.log(`  • Found existing "${bp.name}" (${id})`);
  } else {
    const created = (await api('POST', '/api/workflow', {
      name: bp.name,
      description: bp.description,
      kind: bp.kind,
      nodes: bp.nodes,
      edges: bp.edges,
    })) as { id: string };
    id = created.id;
    console.log(`  • Created "${bp.name}" (${id})`);
  }

  await api('PATCH', `/api/workflow/${id}`, {
    name: bp.name,
    description: bp.description,
    kind: bp.kind,
    nodes: bp.nodes,
    edges: bp.edges,
    metadata: {
      tags: bp.tags,
      executionMode: 'sequential',
      errorPolicy: 'stop',
      timeoutMs: bp.timeoutMs,
      triggers: bp.triggers ?? [{ kind: 'manual', config: {} }],
    },
  });

  return id;
}

async function exportArtifacts(id: string, bp: Blueprint) {
  const payload = (await api('POST', `/api/workflow/${id}/export`)) as {
    artifacts: { typescriptScaffold: string };
    validation?: { valid: boolean };
  };
  const slug = bp.name.replace(/\s+/g, '-').replace(/[()]/g, '').toLowerCase();
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, `${slug}.graph.ts`),
    payload.artifacts.typescriptScaffold,
  );
  console.log(`  • Exported -> artifacts/workflows/${slug}.graph.ts`);
  return payload.validation;
}

async function main() {
  console.log(`Seeding memory workflows against ${BASE_URL}\n`);
  for (const bp of [
    memoryIngestLinear,
    memoryRecallTest,
    memoryIngestReview,
    turnCapture,
    memoryAgentRag,
    memoryWebhookIngest,
  ]) {
    console.log(`▶ ${bp.name} [${bp.kind}]`);
    const id = await upsert(bp);
    const validation = await exportArtifacts(id, bp);
    console.log(`  • Validation: ${validation?.valid ? 'valid' : 'INVALID'}\n`);
    console.log(`  • id=${id}\n`);
  }
  console.log('Done. Open Workflow panel → Memory Ingest (linear) / Memory Recall (test).');
}

main().catch((err: Error) => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});