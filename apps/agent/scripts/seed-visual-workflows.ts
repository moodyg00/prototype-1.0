/**
 * Foundational migration seed.
 *
 * Creates (or updates, idempotently by name) two visual LangGraph workflows that
 * replicate existing agent flows using ONLY the visual node catalog:
 *
 *   1. "Browser Agent Visual"  — the complex visual browser agent
 *      (lib/operators/BrowserOperator + reasoners + api/visual-browser), wrapped
 *      as a single tool.browser node behind a human-in-the-loop approval gate.
 *   2. "Simple HTTP Tool Visual" — the simple http flow (lib/agents/tools/http-tool
 *      + workflow harness sample) as trigger -> tool.http -> output.
 *
 * It saves them through the real API (POST/PATCH /api/workflow) so they appear in
 * the WorkflowPanel table + editor and as DB rows, then exports each
 * (POST /api/workflow/[id]/export) and writes the productionJson / langGraphIr /
 * typescriptScaffold artifacts to apps/agent/artifacts/workflows/.
 *
 * Run with the agent dev server up:
 *   BASE_URL=http://localhost:3002 npx tsx scripts/seed-visual-workflows.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { CATALOG_BY_TYPE } from '../lib/workflow/node-catalog';
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
} from '../lib/workflow/types';

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

// Edge from a specific source handle (e.g. a condition node's 'true' / 'false' output).
function edgeFrom(id: string, source: string, sourceHandle: string, target: string): WorkflowEdge {
  return { id, source, sourceHandle, target, targetHandle: 'in' };
}

type Blueprint = {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  timeoutMs: number;
  tags: string[];
};

// ── Blueprint 1: Browser Agent Visual ──────────────────────────────────────────
const browserAgent: Blueprint = {
  name: 'Browser Agent Visual',
  description:
    'Visual LangGraph port of the Playwright + xAI vision browser agent. trigger -> human approval (interrupt) -> browser agent loop -> respond.',
  nodes: [
    node({ id: 'trigger', typeId: 'trigger.manual', label: 'Task Input', x: 0, properties: { payload: '{}' } }),
    node({
      id: 'approve',
      typeId: 'langgraph.interrupt',
      label: 'Human Approval / Login Gate',
      x: 280,
      properties: {
        prompt:
          'Approve the browser task before the agent acts. If the target site requires login, save the credentials in Secure Logins first, then resume.',
      },
    }),
    node({
      id: 'browser',
      typeId: 'tool.browser',
      label: 'Browser Agent Loop',
      x: 560,
      properties: { task: '', model: 'grok-4.3', maxSteps: 30 },
    }),
    node({
      id: 'respond',
      typeId: 'output.respond',
      label: 'Final Answer',
      x: 840,
      properties: { statusCode: 200, contentType: 'application/json' },
    }),
  ],
  edges: [
    edge('e1', 'trigger', 'approve'),
    edge('e2', 'approve', 'browser'),
    edge('e3', 'browser', 'respond'),
  ],
  timeoutMs: 300_000,
  tags: ['migration', 'browser', 'visual'],
};

// ── Blueprint 2: Simple HTTP Tool Visual ────────────────────────────────────────
const httpTool: Blueprint = {
  name: 'Simple HTTP Tool Visual',
  description:
    'Visual LangGraph port of the simple HTTP tool flow. trigger -> HTTP GET -> output.',
  nodes: [
    node({ id: 'trigger', typeId: 'trigger.manual', label: 'Manual Trigger', x: 0, properties: { payload: '{}' } }),
    node({
      id: 'http',
      typeId: 'tool.http',
      label: 'HTTP GET',
      x: 280,
      properties: {
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/todos/1',
        headers: '{}',
        body: 'null',
      },
    }),
    node({ id: 'out', typeId: 'output.terminal', label: 'Result', x: 560, properties: { label: 'result' } }),
  ],
  edges: [edge('e1', 'trigger', 'http'), edge('e2', 'http', 'out')],
  timeoutMs: 60_000,
  tags: ['migration', 'http', 'visual'],
};

// ── Blueprint 3: Task Router Visual ─────────────────────────────────────────────
// Demonstrates the tiered "supervisor routes to the cheapest worker" pattern:
// a logic.condition node inspects the input and routes either to a cheap HTTP fetch
// (when the task needs external data) or straight to a direct response. No vision,
// no LLM tokens — the routing decision itself is free.
const taskRouter: Blueprint = {
  name: 'Task Router Visual',
  description:
    'Visual LangGraph router. trigger -> condition -> (HTTP worker | direct respond). Routes simple tasks to the cheapest path, escalating only when external data is needed.',
  nodes: [
    node({ id: 'trigger', typeId: 'trigger.manual', label: 'Task Input', x: 0, properties: { payload: '{}' } }),
    node({
      id: 'route',
      typeId: 'logic.condition',
      label: 'Needs External Data?',
      x: 260,
      properties: {
        expression: "typeof input === 'string' && /fetch|http|url|api|data/i.test(input)",
      },
    }),
    node({
      id: 'http',
      typeId: 'tool.http',
      label: 'HTTP Worker',
      x: 540,
      properties: {
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/todos/1',
        headers: '{}',
        body: 'null',
      },
    }),
    node({
      id: 'respondFetch',
      typeId: 'output.respond',
      label: 'Respond (with data)',
      x: 820,
      properties: { statusCode: 200, contentType: 'application/json' },
    }),
    node({
      id: 'respondDirect',
      typeId: 'output.respond',
      label: 'Respond (direct)',
      x: 540,
      properties: { statusCode: 200, contentType: 'application/json' },
    }),
  ],
  edges: [
    edge('e1', 'trigger', 'route'),
    edgeFrom('e2', 'route', 'true', 'http'),
    edgeFrom('e3', 'route', 'false', 'respondDirect'),
    edge('e4', 'http', 'respondFetch'),
  ],
  timeoutMs: 60_000,
  tags: ['migration', 'router', 'visual'],
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
  const existing = list.find(w => w.name === bp.name);

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

  // PATCH writes a new version with nodes/edges/metadata (also covers the update path).
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
  console.log(`Seeding visual workflows against ${BASE_URL}\n`);
  for (const bp of [browserAgent, httpTool, taskRouter]) {
    console.log(`▶ ${bp.name}`);
    const id = await upsert(bp);
    const validation = await exportArtifacts(id, bp);
    console.log(`  • Validation: ${validation?.valid ? 'valid' : 'INVALID'} (errors=${validation?.errors?.length ?? 0}, warnings=${validation?.warnings?.length ?? 0})`);
    console.log(`  • id=${id}\n`);
  }
  console.log('Done. Open the Workflow panel and pick the new workflows.');
}

main().catch(err => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});
