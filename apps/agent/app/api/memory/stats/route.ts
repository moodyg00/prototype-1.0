import { NextResponse } from 'next/server';
import { getMemoryStore } from '@prototype/memory';

export async function GET() {
  const store = getMemoryStore();
  const stats = await store.stats();
  return NextResponse.json({
    store: process.env.CHROMA_URL ? 'chroma' : 'mock',
    ...stats,
  });
}