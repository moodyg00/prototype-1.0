'use client';

import * as React from 'react';

import type { CalendarEvent } from '@/src/lib/scheduling/events';
import { cn } from '@/src/lib/utils';

import {
  WEEKDAY_SHORT,
  eventStart,
  eventsOnDay,
  isSameDate,
  monthGridDates,
} from './calendar-utils';

const MAX_PILLS = 4;

export function MonthCalendarGrid({
  anchor,
  events,
  onSelectDay,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onSelectDay?: (day: Date) => void;
}): React.ReactElement {
  const dates = React.useMemo(() => monthGridDates(anchor), [anchor]);
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
        {WEEKDAY_SHORT.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
            style={{ background: 'color-mix(in srgb, var(--card) 90%, #f3efe7 10%)' }}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {dates.map((date) => {
          const isCurrentMonth = date.getMonth() === anchor.getMonth();
          const isToday = isSameDate(date, today);
          // Only "real" events (bookings) get pills in month view; availability
          // would flood the cell, so we keep it to bookings + blocked days.
          const dayEvents = eventsOnDay(events, date).filter(
            (ev) => ev.kind === 'booking' || ev.availabilityType === 'blocked',
          );
          const shown = dayEvents.slice(0, MAX_PILLS);
          const overflow = dayEvents.length - shown.length;

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDay?.(date)}
              className="@container flex min-h-24 flex-col gap-1 border-r border-b p-2 text-left transition-colors last:border-r-0 hover:bg-accent/40"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--card)',
                color: isCurrentMonth ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              <span
                className={cn(
                  'inline-flex h-6 min-w-6 items-center justify-center self-start rounded-full px-1 text-sm font-medium tabular-nums',
                  isToday && 'bg-foreground text-background',
                )}
              >
                {date.getDate()}
              </span>

              <span className="flex flex-col gap-1">
                {shown.map((ev) => (
                  <span
                    key={ev.id}
                    title={ev.title}
                    // Pills-only when the cell is narrow; the title text appears
                    // once the day cell is wide enough (container query).
                    className="flex items-center gap-1.5 rounded-full text-left @max-[7rem]:justify-center"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
                        ev.tentative && 'opacity-60 ring-1 ring-current ring-offset-1',
                      )}
                      style={{ background: ev.color }}
                    />
                    <span className="hidden truncate text-xs leading-tight @[7rem]:inline">
                      {ev.title}
                    </span>
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="text-[11px] text-muted-foreground">+{overflow} more</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function eventDayLabel(ev: CalendarEvent): string {
  return eventStart(ev).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
