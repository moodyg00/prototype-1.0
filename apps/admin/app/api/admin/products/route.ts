import type { Prisma } from '@prototype/db';
import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { materialProductWhere } from '@/src/lib/billing/line-item-kinds';
import { prisma } from '@/src/lib/prisma';
import { billingPickerQuerySchema } from '@/src/lib/validation/billing-document';

const LIMIT = 20;

function productPickerWhere(scope: string | null, term?: string): Prisma.ProductWhereInput {
  const scopeFilter: Prisma.ProductWhereInput =
    scope === 'inventory'
      ? {}
      : scope === 'materials'
        ? materialProductWhere()
        : { isForSale: true };

  if (!term || term.length === 0) return scopeFilter;

  return {
    AND: [
      scopeFilter,
      {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } },
        ],
      },
    ],
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = billingPickerQuerySchema.parse({
      q: url.searchParams.get('q') ?? undefined,
    });

    const term = parsed.q?.trim();
    const scope = url.searchParams.get('scope');
    const products = await prisma.product.findMany({
      where: productPickerWhere(scope, term),
      orderBy: [{ name: 'asc' }],
      take: LIMIT,
      select: { id: true, name: true, unitPrice: true, category: true },
    });

    return NextResponse.json({
      items: products.map((product) => ({
        id: product.id,
        name: product.name,
        unitPrice: product.unitPrice ? product.unitPrice.toString() : null,
        category: product.category,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
