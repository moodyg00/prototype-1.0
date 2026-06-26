/**
 * Client-side date/grid helpers shared by the Month / Week / Day grids.
 * Pure functions only (safe to import in client components).
 */
import type { CalendarEvent } from '@/src/lib/scheduling/events';

export type CalendarView = 'month' | 'week' | 'day';

/** Hourly slots rendered by the week + day grids. */
export const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => 8 + i); // 08:00 → 18:00

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function hourLabel(hour: number): string {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h = hour % 12 || 12;
  return `${h} ${suffix}`;
}

export function timeLabel(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

/** Sunday-based start of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  return addDays(d, -d.getDay());
}

export function endOfWeek(date: Date): Date {
  return addDays(startOfWeek(date), 7);
}

export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function weekDates(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 6-week (42-cell) month grid starting on the Sunday on/before the 1st. */
export function monthGridDates(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function monthRange(anchor: Date): { from: Date; to: Date } {
  const dates = monthGridDates(anchor);
  return { from: dates[0], to: addDays(dates[dates.length - 1], 1) };
}

export function weekRange(anchor: Date): { from: Date; to: Date } {
  return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
}

export function dayRange(anchor: Date): { from: Date; to: Date } {
  const from = startOfDay(anchor);
  return { from, to: addDays(from, 1) };
}

export function formatMonthLabel(anchor: Date): string {
  return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatWeekLabel(anchor: Date): string {
  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function formatDayLabel(anchor: Date): string {
  return anchor.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function eventStart(ev: CalendarEvent): Date {
  return new Date(ev.startsAt);
}

export function eventEnd(ev: CalendarEvent): Date {
  return new Date(ev.endsAt);
}

/** Events (any kind) that begin within the given day + hour slot. */
export function eventsInCell(events: CalendarEvent[], day: Date, hour: number): CalendarEvent[] {
  return events.filter((ev) => {
    const start = eventStart(ev);
    return isSameDate(start, day) && start.getHours() === hour;
  });
}

/** All events that start on the given day (any time). */
export function eventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((ev) => isSameDate(eventStart(ev), day));
}

/** True when an availability instance covers the given day + hour. */
export function availabilityCovers(ev: CalendarEvent, day: Date, hour: number): boolean {
  if (ev.kind !== 'availability') return false;
  const start = eventStart(ev);
  const end = eventEnd(ev);
  if (!isSameDate(start, day)) return false;
  return hour >= start.getHours() && hour < Math.max(end.getHours(), start.getHours() + 1);
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Inclusive date range from today through the end of the current month. */
export function remainderOfMonthRange(now = new Date()): { from: string; to: string } {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: isoDate(from),
    to: isoDate(to),
  };
}
