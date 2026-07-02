import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import type { WorkflowDefinition } from '../../../../../lib/workflow/types';

type Params = { params: Promise<{ id: string }> };

// POST /api/workflow/[id]/duplicate — copy a workflow's latest version into a
// brand-new workflow (own id, its own version history starting at 1) so the
// original is never at risk while experimenting with the copy.
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;

  const source = await prisma.workflow.findUnique({
    where: { id },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  if (!source) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const sourceDef = source.versions[0]?.definition as WorkflowDefinition | undefined;
  const now = new Date().toISOString();
  const name = `${source.name} (copy)`;

  const workflow = await prisma.workflow.create({
    data: {
      name,
      description: source.description,
      kind: source.kind,
      currentVersion: 1,
      versions: {
        create: {
          version: 1,
          definition: {
            ...(sourceDef ?? {}),
            id: '', // filled after creation
            name,
            description: source.description,
            kind: source.kind,
            version: 1,
            metadata: {
              ...(sourceDef?.metadata ?? {
                tags: [],
                executionMode: 'sequential',
                errorPolicy: 'stop',
                maxRetries: 0,
                timeoutMs: 60000,
                envVars: [],
                triggers: [],
              }),
              createdAt: now,
              updatedAt: now,
            },
            nodes: sourceDef?.nodes ?? [],
            edges: sourceDef?.edges ?? [],
          } satisfies Omit<WorkflowDefinition, 'id'> & { id: string },
        },
      },
    },
    include: { versions: true },
  });

  // Backfill the new workflow's own id into its definition (same pattern as POST /api/workflow)
  const version = workflow.versions[0];
  const def = version.definition as WorkflowDefinition;
  def.id = workflow.id;
  await prisma.workflowVersion.update({
    where: { id: version.id },
    data: { definition: def },
  });

  return NextResponse.json({
    id: workflow.id,
    name: workflow.name,
    kind: workflow.kind,
    currentVersion: 1,
  }, { status: 201 });
}
