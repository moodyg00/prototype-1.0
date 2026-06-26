import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import type { UpdateWorkflowInput, WorkflowDefinition } from '../../../../lib/workflow/types';

type Params = { params: Promise<{ id: string }> };

function isUpdateInput(v: unknown): v is UpdateWorkflowInput {
  return !!v && typeof v === 'object';
}

// GET /api/workflow/[id] — get latest definition
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
  });

  if (!workflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const def = workflow.versions[0]?.definition as WorkflowDefinition | undefined;
  return NextResponse.json({ workflow, definition: def });
}

// PATCH /api/workflow/[id] — save a new version
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isUpdateInput(body)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const input = body as UpdateWorkflowInput;

  const existing = await prisma.workflow.findUnique({
    where: { id },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const prevDef = existing.versions[0]?.definition as WorkflowDefinition;
  const newVersion = existing.currentVersion + 1;
  const now = new Date().toISOString();

  const newDef: WorkflowDefinition = {
    ...prevDef,
    id,
    version: newVersion,
    name: input.name ?? prevDef.name,
    description: input.description ?? prevDef.description,
    nodes: input.nodes ?? prevDef.nodes,
    edges: input.edges ?? prevDef.edges,
    metadata: {
      ...prevDef.metadata,
      ...input.metadata,
      updatedAt: now,
    },
  };

  const [workflow] = await prisma.$transaction([
    prisma.workflow.update({
      where: { id },
      data: {
        name: newDef.name,
        description: newDef.description,
        currentVersion: newVersion,
        updatedAt: new Date(),
      },
    }),
    prisma.workflowVersion.create({
      data: {
        workflowId: id,
        version: newVersion,
        definition: newDef,
      },
    }),
  ]);

  return NextResponse.json({ id: workflow.id, currentVersion: workflow.currentVersion });
}

// DELETE /api/workflow/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.workflow.delete({ where: { id } });
  return NextResponse.json({ deleted: id });
}
