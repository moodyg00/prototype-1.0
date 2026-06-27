import { NextResponse } from 'next/server';
import { z } from 'zod';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { listBankTransactions } from '@prototype/accounting';

const querySchema = z.object({
  q: z.string().optional(),
  filter: z.enum(['all', 'income', 'expense', 'pending', 'ignored']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      q: url.searchParams.get('q') ?? undefined,
      filter: url.searchParams.get('filter') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });

    const result = await listBankTransactions({
      q: parsed.q,
      filter: parsed.filter ?? 'all',
      limit: parsed.limit,
      offset: parsed.offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
