import { NextResponse } from 'next/server';

import { handleRouteError, jsonError } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { buildCalendarEvents } from '@/src/lib/scheduling/events';

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

const RULE_SELECT = {
  id: true,
  layerKey: true,
  availabilityType: true,
  dayOfWeek: true,
  specificDate: true,
  startTime: true,
  endTime: true,
  isAvailable: true,
  notes: true,
  timezone: true,
} as const;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    const from = fromParam ? new Date(fromParam) : new Date();
    const to = toParam ? new Date(toParam) : new Date(from.getTime() + 31 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return jsonError(400, 'Invalid from/to date.');
    }

    const [bookings, rules] = await Promise.all([
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
      prisma.availabilityRule.findMany({
        where: { isPublished: true },
        select: RULE_SELECT,
      }),
    ]);

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
      rules: rules.map((r) => ({
        id: r.id,
        layerKey: r.layerKey as never,
        availabilityType: r.availabilityType as never,
        dayOfWeek: r.dayOfWeek,
        specificDate: r.specificDate,
        startTime: r.startTime,
        endTime: r.endTime,
        isAvailable: r.isAvailable,
        notes: r.notes,
        timezone: r.timezone,
      })),
      from,
      to,
    });

    return NextResponse.json({ events, range: { from: from.toISOString(), to: to.toISOString() } });
  } catch (error) {
    return handleRouteError(error);
  }
}
