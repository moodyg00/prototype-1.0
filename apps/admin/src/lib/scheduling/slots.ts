import type { ProposedSlot } from '@/src/lib/validation/scheduling';

export type TimeRange = { startsAt: Date | string; endsAt: Date | string };

function toMs(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return toMs(a.startsAt) < toMs(b.endsAt) && toMs(b.startsAt) < toMs(a.endsAt);
}

/** Generate discrete bookable slots within a single availability window. */
export function generateBookableSlots(args: {
  window: TimeRange;
  slotDurationMinutes: number;
  slotGapMinutes: number;
  booked?: TimeRange[];
}): ProposedSlot[] {
  const { slotDurationMinutes, slotGapMinutes } = args;
  const windowStart = toMs(args.window.startsAt);
  const windowEnd = toMs(args.window.endsAt);
  const slotMs = slotDurationMinutes * 60_000;
  const stepMs = (slotDurationMinutes + slotGapMinutes) * 60_000;
  const booked = args.booked ?? [];

  const out: ProposedSlot[] = [];
  for (let cursor = windowStart; cursor + slotMs <= windowEnd; cursor += stepMs) {
    const slot: ProposedSlot = {
      startsAt: new Date(cursor).toISOString(),
      endsAt: new Date(cursor + slotMs).toISOString(),
    };
    if (!booked.some((b) => rangesOverlap(slot, b))) {
      out.push(slot);
    }
  }
  return out;
}

/** Generate slots across many availability windows (deduped, sorted). */
export function generateBookableSlotsFromWindows(args: {
  windows: Array<TimeRange & { slotDurationMinutes: number; slotGapMinutes: number }>;
  durationOverrideMinutes?: number | null;
  booked?: TimeRange[];
}): ProposedSlot[] {
  const seen = new Set<string>();
  const out: ProposedSlot[] = [];

  for (const window of args.windows) {
    const duration = args.durationOverrideMinutes ?? window.slotDurationMinutes;
    const slots = generateBookableSlots({
      window,
      slotDurationMinutes: duration,
      slotGapMinutes: window.slotGapMinutes,
      booked: args.booked,
    });
    for (const slot of slots) {
      const key = slot.startsAt;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(slot);
    }
  }

  out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return out;
}

/** Snap a drag-selected range to the first matching slot within availability. */
export function snapRangeToBookableSlot(args: {
  start: Date;
  end: Date;
  windows: Array<TimeRange & { slotDurationMinutes: number; slotGapMinutes: number }>;
  durationOverrideMinutes?: number | null;
}): { start: Date; end: Date } | null {
  const midpoint = new Date((args.start.getTime() + args.end.getTime()) / 2);
  for (const window of args.windows) {
    const ws = toMs(window.startsAt);
    const we = toMs(window.endsAt);
    if (toMs(midpoint) < ws || toMs(midpoint) >= we) continue;

    const duration = args.durationOverrideMinutes ?? window.slotDurationMinutes;
    const slots = generateBookableSlots({
      window,
      slotDurationMinutes: duration,
      slotGapMinutes: window.slotGapMinutes,
    });
    const match = slots.find(
      (slot) => toMs(slot.startsAt) <= toMs(midpoint) && toMs(slot.endsAt) > toMs(midpoint),
    );
    if (match) {
      return { start: new Date(match.startsAt), end: new Date(match.endsAt) };
    }
  }
  return null;
}
