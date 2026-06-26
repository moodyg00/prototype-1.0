import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import {
  EstimateServiceError,
  estimateServiceErrorStatus,
  createEstimateDraft,
} from '@/src/lib/billing/estimate-service';
import { estimateCreateInputSchema } from '@/src/lib/validation/billing-document';

export async function GET() {
  try {
    const { listAdminRecords } = await import('@/src/lib/admin-record-operations');
    const records = await listAdminRecords('estimates');
    return NextResponse.json({ records }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load records.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = estimateCreateInputSchema.parse(body);
    const estimate = await createEstimateDraft(parsed);
    return NextResponse.json(
      {
        id: estimate.id,
        estimateNumber: estimate.estimateNumber,
        totalAmount: estimate.totalAmount,
        estimate,
      },
      { status: 201 },
    );
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
