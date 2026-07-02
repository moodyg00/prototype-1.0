import { NextResponse } from 'next/server';
import {
  chromaConnectionHint,
  chromaConnectionSummary,
  getMemoryStore,
  isChromaConnectionError,
} from '@prototype/memory';

export async function GET() {
  try {
    const store = getMemoryStore();
    const stats = await store.stats();
    return NextResponse.json({
      store: process.env.CHROMA_URL ? 'chroma' : 'mock',
      ...stats,
    });
  } catch (error: unknown) {
    const raw = error instanceof Error ? error.message : 'Failed to load stats';
    const chromaDown = isChromaConnectionError(raw);
    return NextResponse.json(
      {
        store: 'unknown',
        documentCount: 0,
        error: chromaDown ? chromaConnectionSummary() : raw,
        hint: chromaDown ? chromaConnectionHint() : undefined,
      },
      { status: 503 },
    );
  }
}