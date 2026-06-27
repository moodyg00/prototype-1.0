import { NextResponse } from 'next/server';

import { runWorkflowHarness } from '@/lib/workflow/harness';

export async function GET() {
  const result = runWorkflowHarness();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}