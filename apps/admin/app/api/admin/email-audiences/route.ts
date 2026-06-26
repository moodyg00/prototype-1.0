import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { resolveRecipients } from '@/src/lib/email/manual-send';
import { emailAudienceCreateSchema } from '@/src/lib/validation/email';

export async function GET() {
  try {
    const audiences = await prisma.emailAudience.findMany({
      where: { status: 'active' },
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        estimatedRecipientCount: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ audiences });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = emailAudienceCreateSchema.parse(body);

    // Resolve the selection so we can store an accurate estimated count and
    // persist the manual selection into filterRules.
    const resolved = await resolveRecipients(parsed.selection);

    const audience = await prisma.emailAudience.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        status: 'active',
        filterRules: resolved.filterRules,
        estimatedRecipientCount: resolved.recipients.length,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        estimatedRecipientCount: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ audience }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
