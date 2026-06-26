import { NextResponse } from 'next/server';

import { isAdminCreateSection, isAdminDbSection, type AdminCreateSection } from '@/src/lib/admin-record-form-config';

type RouteParams = {
  section: string;
};

export async function GET(_request: Request, { params }: { params: Promise<RouteParams> }) {
  const { section } = await params;

  if (!isAdminDbSection(section)) {
    return NextResponse.json({ error: 'Unsupported admin section.' }, { status: 404 });
  }

  try {
    const { listAdminRecords } = await import('@/src/lib/admin-record-operations');
    const records = await listAdminRecords(section);
    return NextResponse.json({ records }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load records.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }) {
  const { section } = await params;

  if (!isAdminCreateSection(section)) {
    return NextResponse.json({ error: 'Unsupported admin section.' }, { status: 404 });
  }

  let body: { values?: Record<string, unknown> };

  try {
    body = (await request.json()) as { values?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const { createAdminRecord } = await import('@/src/lib/admin-record-operations');
    const created = await createAdminRecord(section as AdminCreateSection, body.values ?? {});
    return NextResponse.json({ recordId: String(created.record.id), recordTitle: created.title }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create record.' },
      { status: 500 },
    );
  }
}
