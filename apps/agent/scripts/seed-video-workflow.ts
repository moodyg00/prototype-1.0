/**
 * Seeds a standard video production pipeline workflow.
 *
 *   BASE_URL=http://localhost:3002 pnpm --filter @prototype/agent seed:video
 */

import { CATALOG_BY_TYPE } from '../lib/workflow/node-catalog';
import type { WorkflowEdge, WorkflowNode } from '../lib/workflow/types';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

type NodeSpec = {
  id: string;
  typeId: string;
  label: string;
  properties: Record<string, unknown>;
};

function node({ id, typeId, label, properties }: NodeSpec): WorkflowNode {
  const def = CATALOG_BY_TYPE[typeId];
  if (!def) throw new Error(`Unknown node type: ${typeId}`);
  return {
    id,
    type: 'workflowNode',
    position: { x: 0, y: 0 },
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

const videoMontage = {
  name: 'Video Montage (generate → sync → render)',
  description: 'Generate clip, append to timeline, sync, render export to media library.',
  kind: 'standard' as const,
  nodes: [
    node({
      id: 'trigger',
      typeId: 'trigger.manual',
      label: 'Prompt',
      properties: { payload: '{"prompt":"Establishing wide shot, slow dolly"}' },
    }),
    node({
      id: 'gen',
      typeId: 'video.generate',
      label: 'Generate',
      properties: { agentId: 'default', modelId: 'grok-video' },
    }),
    node({
      id: 'load',
      typeId: 'video.timeline_load',
      label: 'Load timeline',
      properties: { agentId: 'default', projectId: 'default' },
    }),
    node({
      id: 'append',
      typeId: 'video.timeline_append',
      label: 'Append clip',
      properties: { agentId: 'default', projectId: 'default' },
    }),
    node({
      id: 'sync',
      typeId: 'video.sync',
      label: 'Sync',
      properties: { agentId: 'default', projectId: 'default' },
    }),
    node({
      id: 'render',
      typeId: 'video.render',
      label: 'Render',
      properties: { agentId: 'default', projectId: 'default' },
    }),
    node({ id: 'meta', typeId: 'video.media_meta', label: 'Output meta', properties: {} }),
    node({ id: 'out', typeId: 'output.respond', label: 'Respond', properties: { statusCode: 200 } }),
  ],
  edges: [
    edge('e1', 'trigger', 'gen'),
    edge('e2', 'gen', 'load'),
    edge('e3', 'load', 'append'),
    edge('e4', 'append', 'sync'),
    edge('e5', 'sync', 'render'),
    edge('e6', 'render', 'meta'),
    edge('e7', 'meta', 'out'),
  ],
  timeoutMs: 300_000,
  tags: ['video', 'montage', 'standard'],
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

async function upsert(bp: typeof videoMontage) {
  const list = (await api('GET', '/api/workflow')) as Array<{ id: string; name: string }>;
  const existing = list.find((w) => w.name === bp.name);
  const payload = {
    name: bp.name,
    description: bp.description,
    kind: bp.kind,
    nodes: bp.nodes,
    edges: bp.edges,
    metadata: {
      tags: bp.tags,
      timeoutMs: bp.timeoutMs,
      triggers: [{ kind: 'manual' as const, config: {} }],
    },
  };
  if (existing) {
    await api('PUT', `/api/workflow/${existing.id}`, payload);
    console.log('Updated:', bp.name, existing.id);
  } else {
    const created = (await api('POST', '/api/workflow', payload)) as { id: string };
    console.log('Created:', bp.name, created.id);
  }
}

void upsert(videoMontage).catch((err) => {
  console.error(err);
  process.exit(1);
});