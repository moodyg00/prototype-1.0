import { NextResponse } from 'next/server';

import { resolveActingUser } from '@/src/lib/acting-user';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import {
  expandAvailabilitySchedules,
  listPublishedSchedules,
} from '@/src/lib/scheduling/availability-schedules';
import { buildCalendarEvents } from '@/src/lib/scheduling/events';
import { prisma } from '@/src/lib/prisma';

const BOOKING_SELECT = {
  id: true,
  status: true,
  startsAt: true,
  endsAt: true,
  bookingDate: true,
  startTime: true,
  endTime: true,
  contactId: true,
  serviceId: true,
  bookingLinkId: true,
  notes: true,
  contact: { select: { name: true } },
  service: { select: { name: true } },
} as const;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    const from = fromParam ? new Date(fromParam) : new Date();
    const to = toParam ? new Date(toParam) : new Date(from.getTime() + 31 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Invalid from/to date.' }, { status: 400 });
    }

    const actingUser = await resolveActingUser();

    const [bookings, schedules] = await Promise.all([
      prisma.booking.findMany({
        where: {
          status: { notIn: ['cancelled', 'expired'] },
          OR: [
            { startsAt: { gte: from, lte: to } },
            { startsAt: null, bookingDate: { gte: from, lte: to } },
          ],
        },
        select: BOOKING_SELECT,
        orderBy: [{ startsAt: 'asc' }],
      }),
      listPublishedSchedules(actingUser),
    ]);

    const availability = expandAvailabilitySchedules(schedules, from, to);

    const events = buildCalendarEvents({
      bookings: bookings.map((b) => ({
        id: b.id,
        status: b.status as never,
        startsAt: b.startsAt,
        endsAt: b.endsAt,
        bookingDate: b.bookingDate,
        startTime: b.startTime,
        endTime: b.endTime,
        contactId: b.contactId,
        serviceId: b.serviceId,
        bookingLinkId: b.bookingLinkId,
        contactName: b.contact?.name ?? null,
        serviceName: b.service?.name ?? null,
        notes: b.notes,
      })),
      availability,
    });

    return NextResponse.json({ events, range: { from: from.toISOString(), to: to.toISOString() } });
  } catch (error) {
    return handleRouteError(error);
  }
}
