import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { prisma } = await import('@/src/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: 'connected' });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        database: 'disconnected',
        error: error?.message ?? 'Unknown database error',
      },
      { status: 500 }
    );
  }
}
