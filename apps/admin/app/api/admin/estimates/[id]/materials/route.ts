import { NextResponse } from 'next/server';

import { handleRouteError, jsonError } from '@/src/lib/accounting/api-helpers';
import { getEstimateMaterials } from '@/src/lib/operations/estimate-materials';
import { getEstimateDetail } from '@/src/lib/billing/estimate-service';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const estimate = await getEstimateDetail(id);
    if (!estimate) return jsonError(404, 'Estimate not found.');
    const result = await getEstimateMaterials(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
