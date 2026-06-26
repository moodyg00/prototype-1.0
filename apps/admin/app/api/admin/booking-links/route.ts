import { NextResponse } from 'next/server';

import { Prisma } from '@prototype/db';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { generatePublicToken, slugify, uniqueSlug } from '@/src/lib/scheduling/tokens';
import { bookingLinkCreateSchema } from '@/src/lib/validation/scheduling';

const LINK_SELECT = {
  id: true,
  name: true,
  slug: true,
  publicToken: true,
  linkKind: true,
  isActive: true,
  serviceId: true,
  contactId: true,
  workOrderId: true,
  durationMinutes: true,
  channel: true,
  knownData: true,
  fieldsToCollect: true,
  proposedSlots: true,
  expiresAt: true,
  updatedAt: true,
  createdAt: true,
  service: { select: { id: true, name: true } },
  contact: { select: { id: true, name: true, email: true } },
  _count: { select: { bookings: true } },
} as const;

export async function GET() {
  try {
    const links = await prisma.bookingLink.findMany({
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
      select: LINK_SELECT,
    });
    return NextResponse.json({ links });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = bookingLinkCreateSchema.parse(body);
    const slug = parsed.slug ? slugify(parsed.slug) : uniqueSlug(parsed.name);
    const link = await prisma.bookingLink.create({
      data: {
        name: parsed.name,
        slug,
        publicToken: generatePublicToken(),
        linkKind: parsed.linkKind,
        isActive: parsed.isActive,
        serviceId: parsed.serviceId ?? null,
        contactId: parsed.contactId ?? null,
        workOrderId: parsed.workOrderId ?? null,
        durationMinutes: parsed.durationMinutes ?? null,
        channel: parsed.channel ?? null,
        knownData: (parsed.knownData ?? undefined) as Prisma.InputJsonValue | undefined,
        fieldsToCollect: parsed.fieldsToCollect as unknown as Prisma.InputJsonValue,
        proposedSlots: (parsed.proposedSlots ?? undefined) as Prisma.InputJsonValue | undefined,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      },
      select: LINK_SELECT,
    });
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
