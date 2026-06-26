/**
 * Calendar domain helpers shared by the API and the grid UI.
 */
import type { ExpandedScheduleInstance } from '@/src/lib/scheduling/availability-schedules';
import {
  type AvailabilityLayerKey,
  type AvailabilityType,
  type BookingStatus,
  TENTATIVE_BOOKING_STATUSES,
} from '@/src/lib/validation/scheduling';

export const LAYER_META: Record<AvailabilityLayerKey, { label: string; color: string }> = {
  contractor: { label: 'Contractor', color: '#0f766e' },
  owner: { label: 'Owner', color: '#b45309' },
  business: { label: 'Business', color: '#475569' },
  service: { label: 'Service', color: '#be185d' },
};

export const STATUS_META: Record<
  BookingStatus,
  { label: string; color: string; tentative: boolean }
> = {
  draft: { label: 'Draft', color: '#9ca3af', tentative: true },
  pending_customer: { label: 'Pending customer', color: '#9ca3af', tentative: true },
  unconfirmed: { label: 'Unconfirmed', color: '#9ca3af', tentative: true },
  confirmed: { label: 'Confirmed', color: '#111111', tentative: false },
  cancelled: { label: 'Cancelled', color: '#dc2626', tentative: false },
  expired: { label: 'Expired', color: '#9ca3af', tentative: true },
};

export interface BookingEventInput {
  id: string;
  status: BookingStatus;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  bookingDate?: Date | string | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  contactId?: string | null;
  serviceId?: string | null;
  bookingLinkId?: string | null;
  contactName?: string | null;
  serviceName?: string | null;
  notes?: string | null;
}

export interface CalendarEvent {
  id: string;
  kind: 'booking' | 'availability';
  title: string;
  startsAt: string;
  endsAt: string;
  status?: BookingStatus;
  layerKey?: AvailabilityLayerKey;
  availabilityType?: AvailabilityType;
  isAvailable?: boolean;
  tentative: boolean;
  color: string;
  contactId?: string | null;
  serviceId?: string | null;
  userId?: string | null;
  businessId?: string | null;
  subjectLabel?: string | null;
  scheduleId?: string | null;
  exceptionId?: string | null;
  exceptionType?: 'exclude' | 'add' | null;
  slotDurationMinutes?: number;
  slotGapMinutes?: number;
  bookingLinkId?: string | null;
  notes?: string | null;
}

function parseScheduleInstanceId(scheduleId: string): {
  scheduleId: string;
  exceptionId: string | null;
  exceptionType: 'exclude' | 'add' | null;
} {
  const parts = scheduleId.split(':');
  if (parts.length >= 4 && (parts[1] === 'add' || parts[1] === 'exclude')) {
    return {
      scheduleId: parts[0]!,
      exceptionType: parts[1] as 'exclude' | 'add',
      exceptionId: parts[3] ?? null,
    };
  }
  return { scheduleId, exceptionId: null, exceptionType: null };
}

function bookingTitle(booking: BookingEventInput): string {
  if (booking.contactName && booking.serviceName) {
    return `${booking.contactName} · ${booking.serviceName}`;
  }
  return booking.contactName || booking.serviceName || 'Booking';
}

function toDateOnly(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function toTimeParts(value: Date | string | null | undefined): { h: number; m: number } | null {
  if (value == null) return null;
  if (value instanceof Date) return { h: value.getUTCHours(), m: value.getUTCMinutes() };
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]) };
}

function combine(date: Date, time: { h: number; m: number }): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.h, time.m, 0, 0);
}

function asIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function resolveBookingRange(booking: BookingEventInput): { startsAt: string; endsAt: string } | null {
  if (booking.startsAt && booking.endsAt) {
    return { startsAt: asIso(booking.startsAt), endsAt: asIso(booking.endsAt) };
  }
  const date = toDateOnly(booking.bookingDate);
  const start = toTimeParts(booking.startTime);
  const end = toTimeParts(booking.endTime);
  if (date && start) {
    const startsAt = combine(date, start);
    const endsAt = end ? combine(date, end) : new Date(startsAt.getTime() + 60 * 60 * 1000);
    return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
  }
  return null;
}

export function buildCalendarEvents(args: {
  bookings: BookingEventInput[];
  availability: ExpandedScheduleInstance[];
}): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const booking of args.bookings) {
    if (booking.status === 'cancelled' || booking.status === 'expired') continue;
    const range = resolveBookingRange(booking);
    if (!range) continue;
    const meta = STATUS_META[booking.status];
    events.push({
      id: `booking:${booking.id}`,
      kind: 'booking',
      title: bookingTitle(booking),
      startsAt: range.startsAt,
      endsAt: range.endsAt,
      status: booking.status,
      tentative: TENTATIVE_BOOKING_STATUSES.includes(booking.status),
      color: meta.color,
      contactId: booking.contactId ?? null,
      serviceId: booking.serviceId ?? null,
      bookingLinkId: booking.bookingLinkId ?? null,
      notes: booking.notes ?? null,
    });
  }

  for (const instance of args.availability) {
    const layerKey = instance.subjectKind;
    const parsed = parseScheduleInstanceId(instance.scheduleId);
    events.push({
      id: `availability:${instance.scheduleId}:${instance.startsAt}`,
      kind: 'availability',
      title: instance.isAvailable
        ? `${instance.subjectLabel} · ${LAYER_META[layerKey].label}`
        : `${instance.subjectLabel} blocked`,
      startsAt: instance.startsAt,
      endsAt: instance.endsAt,
      layerKey,
      availabilityType: instance.isAvailable ? 'specific_date' : 'blocked',
      isAvailable: instance.isAvailable,
      tentative: false,
      color: LAYER_META[layerKey].color,
      userId: instance.userId,
      serviceId: instance.serviceId,
      businessId: instance.businessId,
      subjectLabel: instance.subjectLabel,
      scheduleId: parsed.scheduleId,
      exceptionId: parsed.exceptionId,
      exceptionType: parsed.exceptionType,
      slotDurationMinutes: instance.slotDurationMinutes,
      slotGapMinutes: instance.slotGapMinutes,
    });
  }

  events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return events;
}
