import { NextResponse } from 'next/server';

import { handleRouteError, jsonError } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import type { CollectField, ProposedSlot } from '@/src/lib/validation/scheduling';

type RouteParams = { params: Promise<{ token: string }> };

/**
 * Public link metadata. Token-only access (no admin auth). Honors isActive and
 * expiresAt, and never exposes internal IDs that would enable enumeration.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const link = await prisma.bookingLink.findUnique({
      where: { publicToken: token },
      select: {
        name: true,
        linkKind: true,
        isActive: true,
        durationMinutes: true,
        channel: true,
        knownData: true,
        fieldsToCollect: true,
        proposedSlots: true,
        expiresAt: true,
        service: { select: { name: true } },
        contact: { select: { name: true } },
      },
    });

    if (!link || !link.isActive) {
      return jsonError(404, 'This booking link is not available.');
    }
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      return jsonError(410, 'This booking link has expired.');
    }

    return NextResponse.json({
      link: {
        name: link.name,
        linkKind: link.linkKind,
        serviceName: link.service?.name ?? null,
        contactName: link.contact?.name ?? null,
        durationMinutes: link.durationMinutes,
        channel: link.channel,
        knownData: (link.knownData ?? {}) as Record<string, unknown>,
        fieldsToCollect: (link.fieldsToCollect ?? []) as unknown as CollectField[],
        proposedSlots: (link.proposedSlots ?? []) as unknown as ProposedSlot[],
        expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
