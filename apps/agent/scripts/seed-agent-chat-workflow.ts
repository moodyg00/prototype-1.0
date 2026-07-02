/**
 * Seeds "Agent Chat Visual" — standard linear workflow for workspace agent chat:
 *   trigger.manual -> llm.chat -> output.respond
 *
 * Run with the agent dev server up:
 *   BASE_URL=http://localhost:3002 npx tsx scripts/seed-agent-chat-workflow.ts
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

const blueprint = {
  name: 'Agent Chat Visual',
  description:
    'Standard chat pipeline for Agents studio. Runtime injects persona via agent_chat JSON input.',
  nodes: [
    node({
      id: 'trigger',
      typeId: 'trigger.manual',
      label: 'Manual',
      x: 0,
      properties: {},
    }),
    node({
      id: 'chat',
      typeId: 'llm.chat',
      label: 'Chat model',
      x: 280,
      properties: {
        model: 'grok-3-mini',
        systemPrompt: 'You are a helpful assistant.',
        temperature: 0.7,
        maxTokens: 2048,
      },
    }),
    node({
      id: 'respond',
      typeId: 'output.respond',
      label: 'Reply',
      x: 560,
      properties: { statusCode: 200, contentType: 'application/json' },
    }),
  ],
  edges: [edge('e1', 'trigger', 'chat'), edge('e2', 'chat', 'respond')],
  timeoutMs: 120_000,
  tags: ['agents', 'chat'],
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
    throw new Error(
      `${method} ${url} -> ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`,
    );
  }
  return json;
}

async function main() {
  console.log(`Seeding agent chat workflow against ${BASE_URL}\n`);
  const list = (await api('GET', '/api/workflow')) as Array<{ id: string; name: string }>;
  const existing = list.find((w) => w.name === blueprint.name);

  let id: string;
  if (existing) {
    id = existing.id;
    console.log(`  • Found existing "${blueprint.name}" (${id})`);
  } else {
    const created = (await api('POST', '/api/workflow', {
      name: blueprint.name,
      description: blueprint.description,
      kind: 'standard',
      nodes: blueprint.nodes,
      edges: blueprint.edges,
    })) as { id: string };
    id = created.id;
    console.log(`  • Created "${blueprint.name}" (${id})`);
  }

  await api('PATCH', `/api/workflow/${id}`, {
    name: blueprint.name,
    description: blueprint.description,
    kind: 'standard',
    nodes: blueprint.nodes,
    edges: blueprint.edges,
    metadata: {
      tags: blueprint.tags,
      executionMode: 'sequential',
      errorPolicy: 'stop',
      timeoutMs: blueprint.timeoutMs,
      triggers: [{ kind: 'manual', config: {} }],
    },
  });

  const payload = (await api('POST', `/api/workflow/${id}/export`)) as {
    validation?: { valid?: boolean };
  };
  const slug = blueprint.name.replace(/\s+/g, '-').toLowerCase();
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, `${slug}-seed-id.txt`),
    `${id}\nSet AGENT_CHAT_WORKFLOW_ID=${id} in .env.local (optional)\n`,
  );
  console.log(`  • Workflow id: ${id}`);
  console.log(
    `  • Validation: ${payload.validation?.valid ? 'valid' : 'check export'}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});