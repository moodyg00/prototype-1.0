import { NextResponse } from 'next/server';

import { listAgentMedia, uploadAgentMedia } from '@/lib/media/agent-media-service';
import type { MediaListQuery } from '@prototype/media';

export const runtime = 'nodejs';

function parseListQuery(searchParams: URLSearchParams): MediaListQuery {
  const limitRaw = searchParams.get('limit');
  return {
    cursor: searchParams.get('cursor') ?? undefined,
    limit: limitRaw ? Number(limitRaw) : undefined,
    source: searchParams.get('source') ?? 'agent',
    libraryType: searchParams.get('libraryType') ?? undefined,
    mediaKind: searchParams.get('mediaKind') ?? undefined,
    categoryId: searchParams.get('categoryId') ?? undefined,
    agentId: searchParams.get('agentId') ?? undefined,
    tag: searchParams.get('tag') ?? undefined,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listAgentMedia(parseListQuery(searchParams));
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list media';
    return NextResponse.json({ error: message, items: [], nextCursor: null, hasMore: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    const agentId = String(form.get('agentId') ?? 'default').trim();
    const libraryType = form.get('libraryType');
    const categoryId = form.get('categoryId');
    const origin = form.get('origin');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const item = await uploadAgentMedia({
      file,
      agentId,
      libraryType:
        typeof libraryType === 'string' && libraryType
          ? (libraryType as 'content' | 'submitted' | 'admin_record')
          : undefined,
      categoryId: typeof categoryId === 'string' && categoryId ? categoryId : undefined,
      origin:
        origin === 'generation' || origin === 'edit' || origin === 'upload' ? origin : undefined,
    });

    return NextResponse.json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}