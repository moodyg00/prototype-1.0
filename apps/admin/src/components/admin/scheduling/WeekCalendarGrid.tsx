'use client';

import * as React from 'react';

import type { CalendarEvent } from '@/src/lib/scheduling/events';
import { cn } from '@/src/lib/utils';

import {
  TIME_SLOTS,
  availabilityCovers,
  eventsInCell,
  hourLabel,
  isSameDate,
  timeLabel,
  weekDates,
} from './calendar-utils';

interface DragState {
  dayIndex: number;
  startHour: number;
  endHour: number;
}

export function WeekCalendarGrid({
  anchor,
  events,
  onCreateSlot,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onCreateSlot?: (start: Date, end: Date) => void;
}): React.ReactElement {
  const days = React.useMemo(() => weekDates(anchor), [anchor]);
  const today = new Date();
  const [drag, setDrag] = React.useState<DragState | null>(null);
  const dragging = React.useRef(false);
  const dragRef = React.useRef<DragState | null>(null);

  const finishDrag = React.useCallback(() => {
    const currentDrag = dragRef.current;
    if (!dragging.current || !currentDrag) {
      dragging.current = false;
      dragRef.current = null;
      setDrag(null);
      return;
    }
    dragging.current = false;
    dragRef.current = null;
    const day = days[currentDrag.dayIndex];
    const lo = Math.min(currentDrag.startHour, currentDrag.endHour);
    const hi = Math.max(currentDrag.startHour, currentDrag.endHour);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), lo, 0, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hi + 1, 0, 0, 0);
    setDrag(null);
    onCreateSlot?.(start, end);
  }, [days, onCreateSlot]);

  React.useEffect(() => {
    const onUp = () => finishDrag();
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [finishDrag]);

  const inSelection = (dayIndex: number, hour: number): boolean => {
    if (!drag || drag.dayIndex !== dayIndex) return false;
    const lo = Math.min(drag.startHour, drag.endHour);
    const hi = Math.max(drag.startHour, drag.endHour);
    return hour >= lo && hour <= hi;
  };

  return (
    <div
      className="overflow-hidden rounded-2xl border select-none"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Header row */}
      <div
        className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b"
        style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--card) 90%, #f3efe7 10%)' }}
      >
        <div className="px-2 py-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Time
        </div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="border-l px-2 py-3 text-center"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div
              className={cn(
                'mx-auto mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm font-semibold tabular-nums',
                isSameDate(day, today) && 'bg-foreground text-background',
              )}
            >
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time rows */}
      {TIME_SLOTS.map((hour) => (
        <div
          key={hour}
          className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b last:border-b-0"
          style={{ borderColor: 'color-mix(in srgb, var(--border) 80%, transparent 20%)' }}
        >
          <div className="px-2 py-2 text-xs font-medium text-muted-foreground">{hourLabel(hour)}</div>
          {days.map((day, dayIndex) => {
            const cellEvents = eventsInCell(events, day, hour);
            const bookings = cellEvents.filter((ev) => ev.kind === 'booking');
            const availability = events.filter((ev) => availabilityCovers(ev, day, hour));
            const open = availability.find((ev) => ev.isAvailable);
            const blocked = availability.find((ev) => ev.isAvailable === false);
            const selected = inSelection(dayIndex, hour);

            return (
              <div
                key={`${day.toISOString()}-${hour}`}
                role="button"
                tabIndex={-1}
                aria-label={`${day.toLocaleDateString()} ${hourLabel(hour)}`}
                onMouseDown={() => {
                  const nextDrag = { dayIndex, startHour: hour, endHour: hour };
                  dragging.current = true;
                  dragRef.current = nextDrag;
                  setDrag(nextDrag);
                }}
                onMouseEnter={() => {
                  const currentDrag = dragRef.current;
                  if (dragging.current && currentDrag && currentDrag.dayIndex === dayIndex) {
                    const nextDrag = { ...currentDrag, endHour: hour };
                    dragRef.current = nextDrag;
                    setDrag(nextDrag);
                  }
                }}
                className={cn(
                  'relative min-h-14 border-l px-1 py-1 transition-colors',
                  selected ? 'bg-primary/15' : 'hover:bg-accent/40',
                )}
                style={{ borderColor: 'color-mix(in srgb, var(--border) 80%, transparent 20%)' }}
              >
                {/* Availability tint behind events */}
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
                        'truncate rounded-md px-2 py-1 text-xs font-medium',
                        ev.tentative ? 'text-foreground' : 'text-white',
                      )}
                      style={{
                        background: ev.tentative
                          ? `color-mix(in srgb, ${ev.color} 28%, var(--card))`
                          : ev.color,
                        border: ev.tentative ? `1px dashed ${ev.color}` : undefined,
                      }}
                    >
                      {ev.title}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
