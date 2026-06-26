import {
  expandAvailabilitySchedules,
} from '@/src/lib/scheduling/availability-schedules';
import { prisma } from '@/src/lib/prisma';
import type { ProposedSlot } from '@/src/lib/validation/scheduling';

import {
  generateBookableSlotsFromWindows,
  type TimeRange,
} from '@/src/lib/scheduling/slots';

function availableWindows(
  instances: ReturnType<typeof expandAvailabilitySchedules>,
): Array<TimeRange & { slotDurationMinutes: number; slotGapMinutes: number }> {
  return instances
    .filter((instance) => instance.isAvailable)
    .map((instance) => ({
      startsAt: instance.startsAt,
      endsAt: instance.endsAt,
      slotDurationMinutes: instance.slotDurationMinutes,
      slotGapMinutes: instance.slotGapMinutes,
    }));
}

export async function proposeSlotsForService(args: {
  serviceId: string;
  from?: Date;
  to?: Date;
  durationOverrideMinutes?: number | null;
  maxSlots?: number;
}): Promise<ProposedSlot[]> {
  const from = args.from ?? new Date();
  const to = args.to ?? new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);

  const schedules = await prisma.availabilitySchedule.findMany({
    where: {
      isPublished: true,
      subjectKind: 'service',
      serviceId: args.serviceId,
      validFrom: { lte: to },
      validTo: { gte: from },
    },
    include: {
      user: { select: { id: true, fullName: true } },
      service: { select: { id: true, name: true } },
      business: { select: { id: true, name: true } },
      patternDays: true,
      exceptions: true,
    },
  });

  const instances = expandAvailabilitySchedules(schedules, from, to);
  const windows = availableWindows(instances);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { notIn: ['cancelled', 'expired'] },
      OR: [
        { startsAt: { gte: from, lte: to } },
        { startsAt: null, bookingDate: { gte: from, lte: to } },
      ],
    },
    select: { startsAt: true, endsAt: true, bookingDate: true, startTime: true, endTime: true },
  });

  const booked: TimeRange[] = bookings.flatMap((b) =>
    b.startsAt && b.endsAt ? [{ startsAt: b.startsAt, endsAt: b.endsAt }] : [],
  );

  const slots = generateBookableSlotsFromWindows({
    windows,
    durationOverrideMinutes: args.durationOverrideMinutes,
    booked,
  });

  return args.maxSlots ? slots.slice(0, args.maxSlots) : slots;
}

export async function proposeSlotsForBookingLink(link: {
  serviceId: string | null;
  durationMinutes: number | null;
  proposedSlots: unknown;
}): Promise<ProposedSlot[]> {
  const existing = (link.proposedSlots ?? []) as ProposedSlot[];
  if (existing.length > 0) return existing;
  if (!link.serviceId) return [];

  return proposeSlotsForService({
    serviceId: link.serviceId,
    durationOverrideMinutes: link.durationMinutes,
    maxSlots: 48,
  });
}
