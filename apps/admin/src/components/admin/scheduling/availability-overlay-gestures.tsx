'use client';

import * as React from 'react';

import type { CalendarEvent } from '@/src/lib/scheduling/events';

const LONG_PRESS_MS = 500;

/** Right-click or long-press to edit availability; left click passes through to booking. */
export function useAvailabilityEditGestures(
  target: CalendarEvent | undefined,
  onEdit?: (event: CalendarEvent) => void,
): {
  onContextMenu: React.MouseEventHandler;
  onTouchStart: React.TouchEventHandler;
  onTouchMove: React.TouchEventHandler;
  onTouchEnd: React.TouchEventHandler;
  onTouchCancel: React.TouchEventHandler;
} | Record<string, never> {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = React.useRef(false);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const openEdit = React.useCallback(() => {
    if (target?.scheduleId) onEdit?.(target);
  }, [target, onEdit]);

  React.useEffect(() => () => clearTimer(), [clearTimer]);

  if (!target?.scheduleId) return {};

  return {
    onContextMenu: (e) => {
      e.preventDefault();
      openEdit();
    },
    onTouchStart: () => {
      longPressFiredRef.current = false;
      clearTimer();
      timerRef.current = setTimeout(() => {
        longPressFiredRef.current = true;
        openEdit();
      }, LONG_PRESS_MS);
    },
    onTouchMove: clearTimer,
    onTouchEnd: (e) => {
      clearTimer();
      if (longPressFiredRef.current) {
        e.preventDefault();
        longPressFiredRef.current = false;
      }
    },
    onTouchCancel: clearTimer,
  };
}

export function AvailabilityOverlayTint({
  open,
  blocked,
}: {
  open?: CalendarEvent;
  blocked?: CalendarEvent;
}): React.ReactElement | null {
  if (!open && !blocked) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-1 z-[1] rounded-md"
      style={{
        background: blocked
          ? undefined
          : open
            ? `color-mix(in srgb, ${open.color} 12%, transparent)`
            : undefined,
      }}
    >
      {blocked && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-md bg-[repeating-linear-gradient(45deg,color-mix(in_srgb,var(--muted-foreground)_18%,transparent)_0,color-mix(in_srgb,var(--muted-foreground)_18%,transparent)_4px,transparent_4px,transparent_8px)]"
        />
      )}
    </div>
  );
}
