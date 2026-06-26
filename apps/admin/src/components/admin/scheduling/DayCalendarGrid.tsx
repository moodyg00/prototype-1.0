'use client';

import * as React from 'react';

import type { CalendarEvent } from '@/src/lib/scheduling/events';
import { cn } from '@/src/lib/utils';

import {
  TIME_SLOTS,
  availabilityCovers,
  eventsInCell,
  hourLabel,
  timeLabel,
} from './calendar-utils';

export function DayCalendarGrid({
  anchor,
  events,
  onCreateSlot,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onCreateSlot?: (start: Date, end: Date) => void;
}): React.ReactElement {
  const [range, setRange] = React.useState<{ start: number; end: number } | null>(null);
  const dragging = React.useRef(false);
  const rangeRef = React.useRef<{ start: number; end: number } | null>(null);

  const finish = React.useCallback(() => {
    const currentRange = rangeRef.current;
    if (!dragging.current || !currentRange) {
      dragging.current = false;
      rangeRef.current = null;
      setRange(null);
      return;
    }
    dragging.current = false;
    rangeRef.current = null;
    const lo = Math.min(currentRange.start, currentRange.end);
    const hi = Math.max(currentRange.start, currentRange.end);
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), lo, 0, 0, 0);
    const end = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), hi + 1, 0, 0, 0);
    setRange(null);
    onCreateSlot?.(start, end);
  }, [anchor, onCreateSlot]);

  React.useEffect(() => {
    const onUp = () => finish();
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [finish]);

  const selected = (hour: number) =>
    range !== null && hour >= Math.min(range.start, range.end) && hour <= Math.max(range.start, range.end);

  return (
    <div className="overflow-hidden rounded-2xl border select-none" style={{ borderColor: 'var(--border)' }}>
      {TIME_SLOTS.map((hour) => {
        const cellEvents = eventsInCell(events, anchor, hour);
        const bookings = cellEvents.filter((ev) => ev.kind === 'booking');
        const availability = events.filter((ev) => availabilityCovers(ev, anchor, hour));
        const open = availability.find((ev) => ev.isAvailable);
        const blocked = availability.find((ev) => ev.isAvailable === false);

        return (
          <div
            key={hour}
            className="grid grid-cols-[72px_minmax(0,1fr)] border-b last:border-b-0"
            style={{ borderColor: 'color-mix(in srgb, var(--border) 80%, transparent 20%)' }}
          >
            <div className="px-3 py-3 text-xs font-medium text-muted-foreground">{hourLabel(hour)}</div>
            <div
              role="button"
              tabIndex={-1}
              aria-label={`${anchor.toLocaleDateString()} ${hourLabel(hour)}`}
              onMouseDown={() => {
                const nextRange = { start: hour, end: hour };
                dragging.current = true;
                rangeRef.current = nextRange;
                setRange(nextRange);
              }}
              onMouseEnter={() => {
                const currentRange = rangeRef.current;
                if (dragging.current && currentRange) {
                  const nextRange = { ...currentRange, end: hour };
                  rangeRef.current = nextRange;
                  setRange(nextRange);
                }
              }}
              className={cn(
                'relative min-h-16 border-l px-2 py-2 transition-colors',
                selected(hour) ? 'bg-primary/15' : 'hover:bg-accent/40',
              )}
              style={{ borderColor: 'color-mix(in srgb, var(--border) 80%, transparent 20%)' }}
            >
              {open && !blocked && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-1 rounded-md"
                  style={{ background: `color-mix(in srgb, ${open.color} 12%, transparent)` }}
                />
              )}
              {blocked && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-1 rounded-md bg-[repeating-linear-gradient(45deg,color-mix(in_srgb,var(--muted-foreground)_18%,transparent)_0,color-mix(in_srgb,var(--muted-foreground)_18%,transparent)_4px,transparent_4px,transparent_8px)]"
                />
              )}
              <div className="relative flex flex-col gap-1">
                {bookings.map((ev) => (
                  <span
                    key={ev.id}
                    title={`${ev.title} · ${timeLabel(new Date(ev.startsAt))}`}
                    className={cn(
                      'truncate rounded-md px-2 py-1 text-sm font-medium',
                      ev.tentative ? 'text-foreground' : 'text-white',
                    )}
                    style={{
                      background: ev.tentative
                        ? `color-mix(in srgb, ${ev.color} 28%, var(--card))`
                        : ev.color,
                      border: ev.tentative ? `1px dashed ${ev.color}` : undefined,
                    }}
                  >
                    {ev.title} · {timeLabel(new Date(ev.startsAt))}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
