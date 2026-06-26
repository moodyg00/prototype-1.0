import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { billingPickerQuerySchema } from '@/src/lib/validation/billing-document';

const LIMIT = 20;

/**
 * Offerings are surfaced from the `services` table. We treat each active
 * service as a sellable offering with a suggested price, which the editor
 * can prefill into a line item.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope');
    const parsed = billingPickerQuerySchema.parse({
      q: url.searchParams.get('q') ?? undefined,
    });

    const term = parsed.q?.trim();
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        ...(term && term.length > 0
          ? { name: { contains: term, mode: 'insensitive' } }
          : {}),
      },
      orderBy: [{ name: 'asc' }],
      take: LIMIT,
      select: { id: true, name: true, suggestedPrice: true, category: true },
    });

    const items = services.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      suggestedPrice: service.suggestedPrice ? service.suggestedPrice.toString() : null,
    }));

    if (scope === 'picker') {
      return NextResponse.json({ items });
    }

    const { listAdminRecords } = await import('@/src/lib/admin-record-operations');
    const records = await listAdminRecords('offerings');

    return NextResponse.json({ records, items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  let body: { values?: Record<string, unknown> };

  try {
    body = (await request.json()) as { values?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const { createAdminRecord } = await import('@/src/lib/admin-record-operations');
    const created = await createAdminRecord('offerings', body.values ?? {});
    return NextResponse.json({ recordId: String(created.record.id), recordTitle: created.title }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create record.' },
      { status: 500 },
    );
  }
}
