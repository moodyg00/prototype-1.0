'use client';

import { useEffect, useRef, useState } from 'react';

import { useShiftKeyHeld } from '@/hooks/useShiftKeyHeld';
import { cn } from '@/lib/utils';

interface HoverRevealZoneProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Extra padding around the control cluster for easier hover targeting. */
  padding?: number;
}

/**
 * Reveals children on hover; hides and passes clicks through when not hovered
 * or while Shift is held (for marquee / clicking through overlay chrome).
 *
 * Hover is tracked via window mousemove against the zone bounds so the outer
 * shell can stay pointer-events-none and let clicks pass through to the canvas.
 */
export function HoverRevealZone({ children, className, style, padding = 16 }: HoverRevealZoneProps) {
  const [hovered, setHovered] = useState(false);
  const shiftHeld = useShiftKeyHeld();
  const zoneRef = useRef<HTMLDivElement>(null);
  const visible = hovered && !shiftHeld;

  useEffect(() => {
    if (shiftHeld) {
      setHovered(false);
      return;
    }

    const onMove = (event: MouseEvent) => {
      const zone = zoneRef.current;
      if (!zone) return;

      const rect = zone.getBoundingClientRect();
      const inZone =
        event.clientX >= rect.left - padding &&
        event.clientX <= rect.right + padding &&
        event.clientY >= rect.top - padding &&
        event.clientY <= rect.bottom + padding;

      setHovered(inZone);
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [shiftHeld, padding]);

  return (
    <div
      ref={zoneRef}
      className={cn('pointer-events-none', className)}
      style={{ padding, ...style }}
    >
      <div
        className={cn(
          'transition-opacity duration-150',
          visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {children}
      </div>
    </div>
  );
}
