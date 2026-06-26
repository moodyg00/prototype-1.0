import { NextResponse } from 'next/server';

import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import {
  getWorkOrderDetail,
  updateWorkOrder,
} from '@/src/lib/operations/work-order-service';
import { workOrderUpdateSchema } from '@/src/lib/validation/work-orders';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const workOrder = await getWorkOrderDetail(id);
    if (!workOrder) return jsonError(404, 'Work order not found.');
    return NextResponse.json({ workOrder });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = workOrderUpdateSchema.parse(body);
    const workOrder = await updateWorkOrder(id, parsed);
    return NextResponse.json({ workOrder });
  } catch (error) {
    return handleRouteError(error);
  }
}
