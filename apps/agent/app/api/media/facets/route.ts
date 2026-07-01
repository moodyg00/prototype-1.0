import { NextResponse } from 'next/server';

import { getMediaFacets } from '@/lib/media/agent-media-service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const facets = await getMediaFacets();
    return NextResponse.json(facets);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load facets';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}