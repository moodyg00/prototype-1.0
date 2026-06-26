import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import type { WorkflowDefinition } from '../../../../../lib/workflow/types';
import { compileWorkflow, validateWorkflow } from '../../../../../lib/workflow/compiler';

type Params = { params: Promise<{ id: string }> };

// POST /api/workflow/[id]/export — compile and store export artifacts
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;

  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  if (!workflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const def = workflow.versions[0]?.definition as WorkflowDefinition | undefined;
  if (!def) {
    return NextResponse.json({ error: 'No versions found' }, { status: 400 });
  }

  const validation = validateWorkflow(def);
  if (!validation.valid) {
    return NextResponse.json({ error: 'Validation failed', validation }, { status: 422 });
  }

  const artifacts = compileWorkflow(def);

  const record = await prisma.workflowExport.create({
    data: {
      workflowId: id,
      version: def.version,
      artifacts,
    },
  });

  return NextResponse.json({
    exportId: record.id,
    version: def.version,
    artifacts,
    validation,
  });
}

// GET /api/workflow/[id]/export — latest export artifacts
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const latest = await prisma.workflowExport.findFirst({
    where: { workflowId: id },
    orderBy: { createdAt: 'desc' },
  });

  if (!latest) {
    return NextResponse.json({ error: 'No exports found' }, { status: 404 });
  }

  return NextResponse.json(latest.artifacts);
}
