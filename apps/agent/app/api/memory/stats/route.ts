import { NextResponse } from 'next/server';
import { getMemoryStore } from '@prototype/memory';

export async function GET() {
  try {
    const store = getMemoryStore();
    const stats = await store.stats();
    return NextResponse.json({
      store: process.env.CHROMA_URL ? 'chroma' : 'mock',
      ...stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load stats';
    return NextResponse.json({ store: 'unknown', documentCount: 0, error: message }, { status: 500 });
  }
}