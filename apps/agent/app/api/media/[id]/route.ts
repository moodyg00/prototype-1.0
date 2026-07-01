import { NextResponse } from 'next/server';

import {
  getAgentMediaItem,
  patchAgentMedia,
  removeAgentMedia,
} from '@/lib/media/agent-media-service';
import type { AgentMediaTag } from '@/lib/media/agent-media-constants';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  try {
    const item = await getAgentMediaItem(id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  try {
    const body = (await request.json()) as { altText?: string | null; tags?: AgentMediaTag };
    const item = await patchAgentMedia(id, body);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  try {
    const ok = await removeAgentMedia(id);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}