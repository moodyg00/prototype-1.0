import { NextResponse } from 'next/server';

import { Prisma } from '@prototype/db';
import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { slugify } from '@/src/lib/scheduling/tokens';
import { bookingLinkUpdateSchema } from '@/src/lib/validation/scheduling';

type RouteParams = { params: Promise<{ id: string }> };

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

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const link = await prisma.bookingLink.findUnique({ where: { id }, select: LINK_SELECT });
    if (!link) return jsonError(404, 'Booking link not found.');
    return NextResponse.json({ link });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = bookingLinkUpdateSchema.parse(body);
    const link = await prisma.bookingLink.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.slug !== undefined ? { slug: slugify(parsed.slug) } : {}),
        ...(parsed.linkKind !== undefined ? { linkKind: parsed.linkKind } : {}),
        ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
        ...(parsed.serviceId !== undefined ? { serviceId: parsed.serviceId ?? null } : {}),
        ...(parsed.contactId !== undefined ? { contactId: parsed.contactId ?? null } : {}),
        ...(parsed.workOrderId !== undefined ? { workOrderId: parsed.workOrderId ?? null } : {}),
        ...(parsed.durationMinutes !== undefined
          ? { durationMinutes: parsed.durationMinutes ?? null }
          : {}),
        ...(parsed.channel !== undefined ? { channel: parsed.channel ?? null } : {}),
        ...(parsed.knownData !== undefined
          ? { knownData: (parsed.knownData ?? Prisma.JsonNull) as Prisma.InputJsonValue }
          : {}),
        ...(parsed.fieldsToCollect !== undefined
          ? { fieldsToCollect: parsed.fieldsToCollect as unknown as Prisma.InputJsonValue }
          : {}),
        ...(parsed.proposedSlots !== undefined
          ? { proposedSlots: (parsed.proposedSlots ?? Prisma.JsonNull) as Prisma.InputJsonValue }
          : {}),
        ...(parsed.expiresAt !== undefined
          ? { expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null }
          : {}),
      },
      select: LINK_SELECT,
    });
    return NextResponse.json({ link });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.bookingLink.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
