import { NextResponse } from 'next/server';

import { Prisma } from '@prototype/db';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { generatePublicToken, uniqueSlug } from '@/src/lib/scheduling/tokens';
import { adminBookingCreateSchema } from '@/src/lib/validation/scheduling';

const BOOKING_SELECT = {
  id: true,
  status: true,
  source: true,
  startsAt: true,
  endsAt: true,
  bookingDate: true,
  contactId: true,
  serviceId: true,
  bookingLinkId: true,
  notes: true,
} as const;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = adminBookingCreateSchema.parse(body);
    const startsAt = new Date(parsed.startsAt);
    const endsAt = new Date(parsed.endsAt);
    const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);

    const result = await prisma.$transaction(async (tx) => {
      let bookingLinkId: string | null = null;
      let publicToken: string | null = null;

      if (parsed.sendConfirmationLink) {
        const link = await tx.bookingLink.create({
          data: {
            name: 'Confirm appointment',
            slug: uniqueSlug('confirm-appointment'),
            publicToken: generatePublicToken(),
            linkKind: 'confirmation',
            isActive: true,
            serviceId: parsed.serviceId ?? null,
            contactId: parsed.contactId ?? null,
            workOrderId: parsed.workOrderId ?? null,
            durationMinutes,
            fieldsToCollect: [] as unknown as Prisma.InputJsonValue,
            proposedSlots: [
              { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() },
            ] as unknown as Prisma.InputJsonValue,
          },
          select: { id: true, publicToken: true },
        });
        bookingLinkId = link.id;
        publicToken = link.publicToken;
      }

      const booking = await tx.booking.create({
        data: {
          contactId: parsed.contactId ?? null,
          serviceId: parsed.serviceId ?? null,
          workOrderId: parsed.workOrderId ?? null,
          bookingLinkId,
          status: parsed.status,
          source: 'admin',
          bookingDate: new Date(
            Date.UTC(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate()),
          ),
          startsAt,
          endsAt,
          durationMinutes,
          notes: parsed.notes ?? null,
        },
        select: BOOKING_SELECT,
      });

      return { booking, publicToken };
    });

    return NextResponse.json(
      {
        booking: result.booking,
        bookingUrl: result.publicToken ? `/book/${result.publicToken}` : null,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
