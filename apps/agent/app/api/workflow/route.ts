import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import type { CreateWorkflowInput, WorkflowDefinition } from '../../../lib/workflow/types';

function isCreateInput(v: unknown): v is CreateWorkflowInput {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.name === 'string' && o.name.length > 0;
}

// GET /api/workflow — list all workflows
export async function GET() {
  const workflows = await prisma.workflow.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      kind: true,
      currentVersion: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(workflows);
}

// POST /api/workflow — create a new workflow
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isCreateInput(body)) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const nodes = body.nodes ?? [];
  const edges = body.edges ?? [];

  const workflow = await prisma.workflow.create({
    data: {
      name: body.name,
      description: body.description ?? '',
      // Default to 'langgraph': per product direction, most workflows should run on the
      // real LangGraph engine. 'standard' (a straight-line subset, see standard-runtime.ts)
      // remains available as an explicit opt-in for genuinely simple linear action
      // sequences — it must never be the silent default, since it rejects
      // conditionals/interrupts at run time instead of edit time.
      kind: body.kind ?? 'langgraph',
      currentVersion: 1,
      versions: {
        create: {
          version: 1,
          definition: {
            id: '',          // filled after creation
            name: body.name,
            description: body.description ?? '',
            kind: body.kind ?? 'langgraph',
            version: 1,
            nodes,
            edges,
            metadata: {
              createdAt: now,
              updatedAt: now,
              tags: [],
              executionMode: 'sequential',
              errorPolicy: 'stop',
              maxRetries: 0,
              timeoutMs: 60000,
              envVars: [],
              triggers: [],
            },
          } satisfies Omit<WorkflowDefinition, 'id'> & { id: string },
        },
      },
    },
    include: { versions: true },
  });

  // Backfill the workflow id into the definition
  const version = workflow.versions[0];
  const def = version.definition as WorkflowDefinition;
  def.id = workflow.id;
  await prisma.workflowVersion.update({
    where: { id: version.id },
    data: { definition: def },
  });

  return NextResponse.json({ id: workflow.id, name: workflow.name, kind: workflow.kind, currentVersion: 1 }, { status: 201 });
}
