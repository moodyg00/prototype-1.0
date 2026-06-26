import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import {
  EstimateServiceError,
  estimateServiceErrorStatus,
  deleteEstimateDraft,
  updateEstimateDraft,
} from '@/src/lib/billing/estimate-service';
import { estimateUpdateInputSchema } from '@/src/lib/validation/billing-document';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = estimateUpdateInputSchema.parse(body);
    const estimate = await updateEstimateDraft(id, parsed);
    return NextResponse.json({
      id: estimate.id,
      estimateNumber: estimate.estimateNumber,
      totalAmount: estimate.totalAmount,
      estimate,
    });
  } catch (error) {
    if (error instanceof EstimateServiceError) {
      return NextResponse.json(
        { error: error.message, details: { code: error.code } },
        { status: estimateServiceErrorStatus(error.code) },
      );
    }
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteEstimateDraft(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof EstimateServiceError) {
      return NextResponse.json(
        { error: error.message, details: { code: error.code } },
        { status: estimateServiceErrorStatus(error.code) },
      );
    }
    return handleRouteError(error);
  }
}
