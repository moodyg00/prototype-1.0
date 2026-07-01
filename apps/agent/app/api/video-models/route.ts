import { NextResponse } from 'next/server';

import { listVideoModelsWithConfig } from '@/lib/integrations/video-llm';

export const runtime = 'nodejs';

export async function GET() {
  const models = await listVideoModelsWithConfig();
  return NextResponse.json({ models });
}