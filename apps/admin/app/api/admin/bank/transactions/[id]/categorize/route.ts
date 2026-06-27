import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { assignManualBankCategory } from '@prototype/accounting';
import { z } from 'zod';

const bodySchema = z.object({
  internalCategory: z.string().min(1),
  reason: z.string().min(1),
  createJournalEntry: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = bodySchema.parse(await request.json());
    await assignManualBankCategory(id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
