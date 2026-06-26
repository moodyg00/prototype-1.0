import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import {
  AcceptEstimateError,
  acceptEstimateAndCreateWorkOrder,
  acceptEstimateErrorStatus,
} from '@/src/lib/operations/accept-estimate';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await acceptEstimateAndCreateWorkOrder(id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AcceptEstimateError) {
      return NextResponse.json(
        { error: error.message, details: { code: error.code } },
        { status: acceptEstimateErrorStatus(error.code) },
      );
    }
    return handleRouteError(error);
  }
}
