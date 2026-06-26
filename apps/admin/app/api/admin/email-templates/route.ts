import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { emailTemplateCreateSchema } from '@/src/lib/validation/email';

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

export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      select: TEMPLATE_SELECT,
    });
    return NextResponse.json({ templates });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = emailTemplateCreateSchema.parse(body);
    const template = await prisma.emailTemplate.create({
      data: {
        name: parsed.name,
        subject: parsed.subject,
        preheader: parsed.preheader,
        bodyHtml: parsed.bodyHtml,
        bodyText: parsed.bodyText,
        footerText: parsed.footerText,
        category: parsed.category,
        status: parsed.status,
      },
      select: TEMPLATE_SELECT,
    });
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
