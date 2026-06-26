import { NextRequest, NextResponse } from 'next/server';
import { getBrowserOperator } from '@/lib/operators/BrowserOperator';

/**
 * Real execution endpoint for the visual browser operator.
 * Starts the actual Playwright + xAI vision agent.
 * The agent controls a real browser, takes live screenshots (visual understanding first),
 * decides actions using the reasoner (screenshot + cheap DOM data), and streams everything.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, apiKey, model, inferenceOverrides, domainCredentials } = body;

    if (!task || typeof task !== 'string') {
      return NextResponse.json({ error: 'task is required' }, { status: 400 });
    }

    const op = getBrowserOperator({ 
      apiKey, 
      model, 
      domainCredentials 
    });

    // User tweaks override the operator's internally chosen "proper" params
    if (inferenceOverrides && typeof inferenceOverrides === 'object') {
      op.setInferenceOverrides(inferenceOverrides);
    }

    // Fire the real run (it is async and will update internal state + emit events)
    // We do NOT await it here so the HTTP request returns quickly.
    op.runTask(task).catch(err => console.error('Background visual browser operator error', err));

    return NextResponse.json({
      ok: true,
      message: 'Visual browser operator started. Poll /api/browser/status for live screenshots, events, and final answer.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to start' }, { status: 500 });
  }
}
