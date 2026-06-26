import { NextResponse } from 'next/server';
import { z } from 'zod';

import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import {
  IgnoreTransactionError,
  ignoreTransactionErrorStatus,
  setBankTransactionIgnored,
} from '@/src/lib/banking/ignore-transaction';

const bodySchema = z.object({
  ignore: z.boolean(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = bodySchema.parse(await readJsonBody(request));
    const result = await setBankTransactionIgnored(id, body.ignore);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof IgnoreTransactionError) {
      return jsonError(ignoreTransactionErrorStatus(error.code), error.message, { code: error.code });
    }
    return handleRouteError(error);
  }
}
