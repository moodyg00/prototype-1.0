import { NextResponse } from 'next/server';

import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { replaceServiceMaterials } from '@/src/lib/operations/service-service';
import { serviceMaterialsReplaceSchema } from '@/src/lib/validation/service-materials';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { getServiceDetail } = await import('@/src/lib/operations/service-service');
    const service = await getServiceDetail(id);
    if (!service) return jsonError(404, 'Offering not found.');
    return NextResponse.json({ materials: service.materials });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = serviceMaterialsReplaceSchema.parse(body);
    const materials = await replaceServiceMaterials(id, parsed.materials);
    return NextResponse.json({ materials });
  } catch (error) {
    return handleRouteError(error);
  }
}
