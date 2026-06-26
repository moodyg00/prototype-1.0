import { NextResponse } from 'next/server';

import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { getServiceDetail, updateService, deleteService } from '@/src/lib/operations/service-service';
import { serviceUpdateSchema } from '@/src/lib/validation/services';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const service = await getServiceDetail(id);
    if (!service) return jsonError(404, 'Offering not found.');
    return NextResponse.json({ service });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = serviceUpdateSchema.parse(body);
    const service = await updateService(id, parsed);
    return NextResponse.json({ service });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteService(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
