import { NextResponse } from 'next/server';

import { handleRouteError, jsonError } from '@/src/lib/accounting/api-helpers';
import { getBankTransactionDetail } from '@prototype/accounting';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const transaction = await getBankTransactionDetail(id);
    if (!transaction) {
      return jsonError(404, 'Transaction not found.');
    }
    return NextResponse.json({ transaction });
  } catch (error) {
    return handleRouteError(error);
  }
}
