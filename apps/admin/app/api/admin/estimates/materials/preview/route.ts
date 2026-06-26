import { NextResponse } from 'next/server';
import { z } from 'zod';

import { handleRouteError, jsonError } from '@/src/lib/accounting/api-helpers';
import { computeMaterialsPreviewFromLineItems } from '@/src/lib/operations/estimate-materials';
import { lineItemSchema } from '@/src/lib/validation/billing-document';

const previewInputSchema = z.object({
  lineItems: z.array(lineItemSchema),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = previewInputSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid preview payload.');
    }

    const materials = await computeMaterialsPreviewFromLineItems(parsed.data.lineItems);
    return NextResponse.json({ mode: 'live' as const, materials });
  } catch (error) {
    return handleRouteError(error);
  }
}
