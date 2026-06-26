import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { billingPickerQuerySchema } from '@/src/lib/validation/billing-document';

const LIMIT = 20;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = billingPickerQuerySchema.parse({
      q: url.searchParams.get('q') ?? undefined,
      active: url.searchParams.get('active') ?? undefined,
    });

    const term = parsed.q?.trim();
    const templates = await prisma.estimateTemplate.findMany({
      where: {
        ...(parsed.active === false ? {} : { isActive: true }),
        ...(term && term.length > 0
          ? { name: { contains: term, mode: 'insensitive' } }
          : {}),
      },
      orderBy: [{ name: 'asc' }],
      take: LIMIT,
      select: {
        id: true,
        name: true,
        description: true,
        introText: true,
        footerText: true,
        paymentTerms: true,
        accentColor: true,
        lineItems: true,
      },
    });

    return NextResponse.json({
      items: templates.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        introText: template.introText,
        footerText: template.footerText,
        paymentTerms: template.paymentTerms,
        accentColor: template.accentColor,
        lineItems: Array.isArray(template.lineItems) ? template.lineItems : [],
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
