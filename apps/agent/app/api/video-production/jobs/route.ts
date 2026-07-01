import { NextResponse } from 'next/server';

import { listVideoProductionJobs } from '@/lib/media/video-production-jobs';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId') ?? undefined;
  return NextResponse.json({ jobs: listVideoProductionJobs(agentId) });
}