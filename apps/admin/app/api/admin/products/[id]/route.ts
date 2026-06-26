import { NextResponse } from 'next/server';

import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { getProductDetail, updateProduct } from '@/src/lib/operations/product-service';
import { productUpdateSchema } from '@/src/lib/validation/products';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await getProductDetail(id);
    if (!product) return jsonError(404, 'Catalog item not found.');
    return NextResponse.json({ product });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = productUpdateSchema.parse(body);
    const product = await updateProduct(id, parsed);
    return NextResponse.json({ product });
  } catch (error) {
    return handleRouteError(error);
  }
}
