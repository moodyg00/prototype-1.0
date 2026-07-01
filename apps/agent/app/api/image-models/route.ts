import { NextResponse } from 'next/server';

import { listImageModelsWithConfig } from '@/lib/integrations/image-llm';

export const runtime = 'nodejs';

export async function GET() {
  const models = await listImageModelsWithConfig();
  return NextResponse.json({ models });
}