/**
 * Seeds the "IDE Agent Visual" workflow — the LangGraph graph that powers the
 * public-dev IDE chat. It wires the IDE chat trigger to a Grok-backed ReAct
 * agent (reasoning effort low for testing) bound to the full set of path-scoped
 * file tools, ending in a respond node.
 *
 *   trigger.ide_chat -> llm.agent (+ tool.ide.* tools) -> output.respond
 *
 * It saves through the real API (POST/PATCH /api/workflow) so the workflow shows
 * up in the WorkflowPanel + DB, then exports artifacts to artifacts/workflows/.
 *
 * Run with the agent dev server up:
 *   BASE_URL=http://localhost:3002 npx tsx scripts/seed-ide-agent-workflow.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { CATALOG_BY_TYPE } from '../lib/workflow/node-catalog';
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '../lib/workflow/types';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const ARTIFACT_DIR = path.join(process.cwd(), 'artifacts', 'workflows');

type NodeSpec = {
  id: string;
  typeId: string;
  label: string;
  x: number;
  y?: number;
  properties: Record<string, unknown>;
};

function node({ id, typeId, label, x, y = 0, properties }: NodeSpec): WorkflowNode {
  const def = CATALOG_BY_TYPE[typeId];
  if (!def) throw new Error(`Unknown node type: ${typeId}`);
  return {
    id,
    type: 'workflowNode',
    position: { x, y },
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

// Edge from an IDE tool node's `tool` output into the agent's `tools` input.
function edgeToTools(id: string, toolNodeId: string, agentId: string): WorkflowEdge {
  return { id, source: toolNodeId, sourceHandle: 'tool', target: agentId, targetHandle: 'tools' };
}

type Blueprint = {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  timeoutMs: number;
  tags: string[];
};

const IDE_TOOL_TYPES = [
  'tool.ide.list_files',
  'tool.ide.read_file',
  'tool.ide.patch_file',
  'tool.ide.write_file',
  'tool.ide.create_path',
  'tool.ide.delete_file',
  'tool.ide.move_file',
  'tool.ide.copy_file',
  'tool.ide.revert_checkpoint',
  'tool.ide.request_deploy',
] as const;

const toolNodes: WorkflowNode[] = IDE_TOOL_TYPES.map((typeId, i) =>
  node({
    id: typeId.replace(/\./g, '_'),
    typeId,
    label: CATALOG_BY_TYPE[typeId].label,
    x: 280,
    y: 140 + i * 90,
    properties: {},
  }),
);

const toolEdges: WorkflowEdge[] = IDE_TOOL_TYPES.map((typeId, i) =>
  edgeToTools(`et${i + 1}`, typeId.replace(/\./g, '_'), 'agent'),
);

const ideAgent: Blueprint = {
  name: 'IDE Agent Visual',
  description:
    'IDE chat agent for the public-dev static-site IDE. trigger.ide_chat -> Grok ReAct agent (reasoning low) bound to path-scoped file tools -> respond.',
  nodes: [
    node({
      id: 'trigger',
      typeId: 'trigger.ide_chat',
      label: 'IDE Chat',
      x: 0,
      properties: { payload: '{"slug":"","messages":[]}' },
    }),
    node({
      id: 'agent',
      typeId: 'llm.agent',
      label: 'IDE Developer Agent',
      x: 560,
      properties: {
        model: 'grok-4.3',
        reasoningEffort: 'low',
        systemPrompt: '',
        maxIterations: 12,
      },
    }),
    ...toolNodes,
    node({
      id: 'respond',
      typeId: 'output.respond',
      label: 'Reply',
      x: 840,
      properties: { statusCode: 200, contentType: 'application/json' },
    }),
  ],
  edges: [edge('e1', 'trigger', 'agent'), ...toolEdges, edge('e2', 'agent', 'respond')],
  timeoutMs: 120_000,
  tags: ['ide', 'public-dev'],
};

async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
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
  const list: Array<{ id: string; name: string }> = await api('GET', '/api/workflow');
  const existing = list.find((w) => w.name === bp.name);

  let id: string;
  if (existing) {
    id = existing.id;
    console.log(`  • Found existing "${bp.name}" (${id}) — updating in place.`);
  } else {
    const created = await api('POST', '/api/workflow', {
      name: bp.name,
      description: bp.description,
      kind: 'langgraph',
      nodes: bp.nodes,
      edges: bp.edges,
    });
    id = created.id;
    console.log(`  • Created "${bp.name}" (${id}).`);
  }

  await api('PATCH', `/api/workflow/${id}`, {
    name: bp.name,
    description: bp.description,
    nodes: bp.nodes,
    edges: bp.edges,
    metadata: {
      tags: bp.tags,
      executionMode: 'sequential',
      errorPolicy: 'stop',
      timeoutMs: bp.timeoutMs,
      triggers: [{ kind: 'manual', config: {} }],
    },
  });

  return id;
}

async function exportArtifacts(id: string, bp: Blueprint) {
  const payload = await api('POST', `/api/workflow/${id}/export`);
  const artifacts = payload.artifacts as {
    productionJson: WorkflowDefinition;
    langGraphIr: unknown;
    typescriptScaffold: string;
  };
  const slug = bp.name.replace(/\s+/g, '-').toLowerCase();
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, `${slug}.artifacts.json`), JSON.stringify(artifacts, null, 2));
  fs.writeFileSync(path.join(ARTIFACT_DIR, `${slug}.graph.ts`), artifacts.typescriptScaffold);
  console.log(`  • Exported artifacts -> artifacts/workflows/${slug}.artifacts.json + ${slug}.graph.ts`);
  return payload.validation;
}

async function main() {
  console.log(`Seeding IDE agent workflow against ${BASE_URL}\n`);
  console.log(`▶ ${ideAgent.name}`);
  const id = await upsert(ideAgent);
  const validation = await exportArtifacts(id, ideAgent);
  console.log(
    `  • Validation: ${validation?.valid ? 'valid' : 'INVALID'} (errors=${validation?.errors?.length ?? 0}, warnings=${validation?.warnings?.length ?? 0})`,
  );
  console.log(`  • id=${id}\n`);
  console.log('Done. Set IDE_AGENT_WORKFLOW_ID to this id (optional) or rely on name lookup.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});
