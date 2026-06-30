import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// Native run/trace listing. Replaces the external LangSmith dashboard with our own
// observability backed by the WorkflowRun table. Works for ALL workflows (any kind).
//
// GET /api/runs?workflowId=&limit=&status=
export async function GET(req: Request) {
  const url = new URL(req.url);
  const workflowId = url.searchParams.get('workflowId') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50) || 50, 200);

  try {
    const where = {
      ...(workflowId ? { workflowId } : {}),
      ...(status ? { status } : {}),
    };

    const runs = await prisma.workflowRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        workflowId: true,
        workflowName: true,
        version: true,
        status: true,
        output: true,
        errorText: true,
        durationMs: true,
        nodeCount: true,
        eventCount: true,
        tokens: true,
        createdAt: true,
      },
    });

    const summary = runs.reduce(
      (acc: { count: number; tokens: number; durationSum: number; errorCount: number }, r: (typeof runs)[number]) => {
        acc.count += 1;
        acc.tokens += r.tokens ?? 0;
        acc.durationSum += r.durationMs ?? 0;
        if (r.status === 'error') acc.errorCount += 1;
        return acc;
      },
      { count: 0, tokens: 0, durationSum: 0, errorCount: 0 },
    );

    return NextResponse.json({
      runs,
      summary: {
        count: summary.count,
        totalTokens: summary.tokens,
        errorCount: summary.errorCount,
        avgDurationMs: summary.count ? Math.round(summary.durationSum / summary.count) : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load runs';
    return NextResponse.json({ error: message, runs: [], summary: null }, { status: 500 });
  }
}

// DELETE /api/runs?workflowId=  — clear run history (all, or for one workflow).
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const workflowId = url.searchParams.get('workflowId') || undefined;
  try {
    const result = await prisma.workflowRun.deleteMany({
      where: workflowId ? { workflowId } : {},
    });
    return NextResponse.json({ deleted: result.count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to clear runs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
