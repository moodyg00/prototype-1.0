import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { listAdminRecords } from '@/src/lib/admin-record-operations';
import { createWorkOrder } from '@/src/lib/operations/work-order-service';
import { workOrderCreateSchema } from '@/src/lib/validation/work-orders';

export async function GET() {
  try {
    const records = await listAdminRecords('work-orders');
    return NextResponse.json({ records });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = workOrderCreateSchema.parse(body);
    const workOrder = await createWorkOrder(parsed);
    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
