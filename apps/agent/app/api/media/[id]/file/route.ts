import { NextResponse } from 'next/server';

import { getAgentMediaItem } from '@/lib/media/agent-media-service';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  try {
    const item = await getAgentMediaItem(id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const res = await fetch(item.url);
    if (!res.ok) {
      return NextResponse.redirect(item.url);
    }
    const blob = await res.arrayBuffer();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': item.mimeType,
        'Content-Disposition': `attachment; filename="${item.filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Download failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}