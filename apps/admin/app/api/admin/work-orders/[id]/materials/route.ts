import { NextResponse } from 'next/server';

import { handleRouteError, jsonError } from '@/src/lib/accounting/api-helpers';
import { getWorkOrderMaterials } from '@/src/lib/operations/accept-estimate';
import { getWorkOrderDetail } from '@/src/lib/operations/work-order-service';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const workOrder = await getWorkOrderDetail(id);
    if (!workOrder) return jsonError(404, 'Work order not found.');
    const materials = await getWorkOrderMaterials(id);
    return NextResponse.json({ materials });
  } catch (error) {
    return handleRouteError(error);
  }
}
