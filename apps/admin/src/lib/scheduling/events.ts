/**
 * Calendar domain helpers shared by the API and the grid UI.
 *
 *   - `expandAvailabilityRules()` turns stored AvailabilityRule rows into
 *     concrete dated instances within a [from, to] window.
 *   - `buildCalendarEvents()` produces a single unified DTO array (bookings +
 *     availability) that the Month / Week / Day grids all render from, carrying
 *     color + tentative (gray) styling info.
 *
 * Timezone note (prototype): times are treated as server/browser-local
 * wall-clock. Bookings store real timestamptz values; availability times are
 * combined with the iterated calendar date in local time. On the target local
 * dev machine (America/Chicago) these line up; a production build would swap in
 * proper tz-aware expansion.
 */
import {
  type AvailabilityLayerKey,
  type AvailabilityType,
  type BookingStatus,
  TENTATIVE_BOOKING_STATUSES,
} from '@/src/lib/validation/scheduling';

export const LAYER_META: Record<AvailabilityLayerKey, { label: string; color: string }> = {
  contractor: { label: 'Contractor', color: '#0f766e' },
  contact: { label: 'Contact', color: '#4338ca' },
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

export interface AvailabilityRuleInputRow {
  id: string;
  layerKey: AvailabilityLayerKey;
  availabilityType: AvailabilityType;
  dayOfWeek?: number | null;
  specificDate?: Date | string | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  isAvailable: boolean;
  notes?: string | null;
  timezone?: string | null;
}

export interface CalendarEvent {
  id: string;
  kind: 'booking' | 'availability';
  title: string;
  startsAt: string;
  endsAt: string;
  /** booking only */
  status?: BookingStatus;
  /** availability only */
  layerKey?: AvailabilityLayerKey;
  availabilityType?: AvailabilityType;
  isAvailable?: boolean;
  /** True when this should render gray/tentative (pending/draft/unconfirmed). */
  tentative: boolean;
  color: string;
  contactId?: string | null;
  serviceId?: string | null;
  bookingLinkId?: string | null;
  notes?: string | null;
}

export interface AvailabilityInstance {
  ruleId: string;
  layerKey: AvailabilityLayerKey;
  availabilityType: AvailabilityType;
  isAvailable: boolean;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
}

function toTimeParts(value: Date | string | null | undefined): { h: number; m: number } | null {
  if (value == null) return null;
  if (value instanceof Date) {
    // Prisma TIME values arrive as a Date anchored at the epoch in UTC.
    return { h: value.getUTCHours(), m: value.getUTCMinutes() };
  }
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]) };
}

function toDateOnly(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // Anchor to the calendar date (UTC components) at local midnight.
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function combine(date: Date, time: { h: number; m: number }): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.h, time.m, 0, 0);
}

function asIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/**
 * Expand availability rules into concrete dated instances within [from, to].
 * Recurring rules emit one instance per matching weekday; specific_date /
 * blocked rules emit a single instance on their date.
 */
export function expandAvailabilityRules(
  rules: AvailabilityRuleInputRow[],
  from: Date,
  to: Date,
): AvailabilityInstance[] {
  const out: AvailabilityInstance[] = [];
  const rangeStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const rangeEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  for (const rule of rules) {
    const start = toTimeParts(rule.startTime) ?? { h: 0, m: 0 };
    const end = toTimeParts(rule.endTime) ?? { h: 23, m: 59 };

    if (rule.availabilityType === 'recurring' && rule.dayOfWeek != null) {
      const cursor = new Date(rangeStart);
      while (cursor <= rangeEnd) {
        if (cursor.getDay() === rule.dayOfWeek) {
          out.push({
            ruleId: rule.id,
            layerKey: rule.layerKey,
            availabilityType: rule.availabilityType,
            isAvailable: rule.isAvailable,
            startsAt: combine(cursor, start).toISOString(),
            endsAt: combine(cursor, end).toISOString(),
            notes: rule.notes ?? null,
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      continue;
    }

    const specific = toDateOnly(rule.specificDate);
    if (specific && specific >= rangeStart && specific <= rangeEnd) {
      const blocked = rule.availabilityType === 'blocked';
      out.push({
        ruleId: rule.id,
        layerKey: rule.layerKey,
        availabilityType: rule.availabilityType,
        isAvailable: blocked ? false : rule.isAvailable,
        startsAt: combine(specific, blocked ? { h: 0, m: 0 } : start).toISOString(),
        endsAt: combine(specific, blocked ? { h: 23, m: 59 } : end).toISOString(),
        notes: rule.notes ?? null,
      });
    }
  }
  return out;
}

function bookingTitle(booking: BookingEventInput): string {
  if (booking.contactName && booking.serviceName) {
    return `${booking.contactName} · ${booking.serviceName}`;
  }
  return booking.contactName || booking.serviceName || 'Booking';
}

/** Resolve a booking's start/end into ISO, preferring startsAt/endsAt. */
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

/**
 * Build the unified calendar DTO from bookings + availability rules over a
 * [from, to] window. Bookings carry status-driven color + tentative flag;
 * availability instances carry their layer color.
 */
export function buildCalendarEvents(args: {
  bookings: BookingEventInput[];
  rules: AvailabilityRuleInputRow[];
  from: Date;
  to: Date;
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

  for (const instance of expandAvailabilityRules(args.rules, args.from, args.to)) {
    events.push({
      id: `availability:${instance.ruleId}:${instance.startsAt}`,
      kind: 'availability',
      title: instance.isAvailable
        ? `${LAYER_META[instance.layerKey].label} available`
        : `${LAYER_META[instance.layerKey].label} blocked`,
      startsAt: instance.startsAt,
      endsAt: instance.endsAt,
      layerKey: instance.layerKey,
      availabilityType: instance.availabilityType,
      isAvailable: instance.isAvailable,
      tentative: false,
      color: LAYER_META[instance.layerKey].color,
      notes: instance.notes ?? null,
    });
  }

  events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return events;
}
