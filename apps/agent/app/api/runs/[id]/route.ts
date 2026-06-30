import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET /api/runs/[id] — full run detail including the node timeline + final state.
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const run = await prisma.workflowRun.findUnique({ where: { id } });
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }
    return NextResponse.json(run);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load run';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/runs/[id] — delete a single run record.
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.workflowRun.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete run';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
