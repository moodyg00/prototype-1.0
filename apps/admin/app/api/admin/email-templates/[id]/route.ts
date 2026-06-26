import { NextResponse } from 'next/server';

import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { emailTemplateUpdateSchema } from '@/src/lib/validation/email';

type RouteParams = { params: Promise<{ id: string }> };

const TEMPLATE_SELECT = {
  id: true,
  name: true,
  subject: true,
  preheader: true,
  bodyHtml: true,
  bodyText: true,
  footerText: true,
  category: true,
  status: true,
  accentColor: true,
  updatedAt: true,
  createdAt: true,
} as const;

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      select: TEMPLATE_SELECT,
    });
    if (!template) {
      return jsonError(404, 'Template not found.');
    }
    return NextResponse.json({ template });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = emailTemplateUpdateSchema.parse(body);
    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.subject !== undefined ? { subject: parsed.subject } : {}),
        ...(parsed.preheader !== undefined ? { preheader: parsed.preheader } : {}),
        ...(parsed.bodyHtml !== undefined ? { bodyHtml: parsed.bodyHtml } : {}),
        ...(parsed.bodyText !== undefined ? { bodyText: parsed.bodyText } : {}),
        ...(parsed.footerText !== undefined ? { footerText: parsed.footerText } : {}),
        ...(parsed.category !== undefined ? { category: parsed.category } : {}),
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      },
      select: TEMPLATE_SELECT,
    });
    return NextResponse.json({ template });
  } catch (error) {
    return handleRouteError(error);
  }
}
