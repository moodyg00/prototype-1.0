import { NextResponse } from 'next/server';
import { Client } from 'langsmith';

// Server-side LangSmith access. The API key is read from the environment only
// and never exposed to the client.

interface RunSummary {
  id: string;
  name: string;
  runType: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  latencyMs: number | null;
  totalTokens: number | null;
  totalCost: number | null;
  error: string | null;
}

function toMs(value: unknown): number | null {
  if (!value) return null;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

// GET /api/langsmith/runs?project=&limit=
export async function GET(req: Request) {
  const apiKey = process.env.LANGCHAIN_API_KEY || process.env.LANGSMITH_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { configured: false, error: 'LANGCHAIN_API_KEY is not set on the server.' },
      { status: 200 },
    );
  }

  const url = new URL(req.url);
  const projectName =
    url.searchParams.get('project') || process.env.LANGCHAIN_PROJECT || 'default';
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 25) || 25, 100);

  try {
    const client = new Client({ apiKey });
    const runs: RunSummary[] = [];

    for await (const run of client.listRuns({ projectName, limit })) {
      // Token/cost analytics are server-computed fields not present on the typed
      // Run shape; read them defensively.
      const extra = run as unknown as { total_tokens?: number; total_cost?: number };
      const start = toMs(run.start_time);
      const end = toMs(run.end_time);
      runs.push({
        id: String(run.id),
        name: run.name ?? 'run',
        runType: run.run_type ?? 'chain',
        status: run.status ?? (run.error ? 'error' : 'success'),
        startTime: run.start_time ? new Date(run.start_time).toISOString() : null,
        endTime: run.end_time ? new Date(run.end_time).toISOString() : null,
        latencyMs: start != null && end != null ? end - start : null,
        totalTokens: typeof extra.total_tokens === 'number' ? extra.total_tokens : null,
        totalCost: typeof extra.total_cost === 'number' ? extra.total_cost : null,
        error: run.error ?? null,
      });
    }

    const totals = runs.reduce(
      (acc, r) => {
        acc.tokens += r.totalTokens ?? 0;
        acc.cost += r.totalCost ?? 0;
        acc.errors += r.error ? 1 : 0;
        if (r.latencyMs != null) {
          acc.latencySum += r.latencyMs;
          acc.latencyCount += 1;
        }
        return acc;
      },
      { tokens: 0, cost: 0, errors: 0, latencySum: 0, latencyCount: 0 },
    );

    return NextResponse.json({
      configured: true,
      projectName,
      runs,
      summary: {
        count: runs.length,
        totalTokens: totals.tokens,
        totalCost: totals.cost,
        errorCount: totals.errors,
        avgLatencyMs: totals.latencyCount ? Math.round(totals.latencySum / totals.latencyCount) : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load runs';
    return NextResponse.json({ configured: true, error: message }, { status: 500 });
  }
}
