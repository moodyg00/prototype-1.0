'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const STORAGE_PREFIX = 'public-dev:pane-zoom:';

export type PaneZoomId = 'editor' | 'agent';

const LIMITS: Record<PaneZoomId, { min: number; max: number; step: number }> = {
  editor: { min: 10, max: 24, step: 1 },
  agent: { min: 11, max: 22, step: 1 },
};

function clamp(pane: PaneZoomId, value: number): number {
  const { min, max } = LIMITS[pane];
  return Math.min(max, Math.max(min, Math.round(value)));
}

function readStored(pane: PaneZoomId, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${pane}`);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? clamp(pane, parsed) : fallback;
}

export function usePaneZoom(pane: PaneZoomId, defaultSize: number) {
  const [size, setSize] = useState(defaultSize);

  useEffect(() => {
    setSize(readStored(pane, defaultSize));
  }, [pane, defaultSize]);

  const persist = useCallback(
    (next: number) => {
      const clamped = clamp(pane, next);
      setSize(clamped);
      localStorage.setItem(`${STORAGE_PREFIX}${pane}`, String(clamped));
    },
    [pane],
  );

  const zoomIn = useCallback(() => persist(size + LIMITS[pane].step), [pane, persist, size]);
  const zoomOut = useCallback(() => persist(size - LIMITS[pane].step), [pane, persist, size]);
  const reset = useCallback(() => persist(defaultSize), [defaultSize, persist]);

  return { size, zoomIn, zoomOut, reset, defaultSize, min: LIMITS[pane].min, max: LIMITS[pane].max };
}

export function usePaneZoomShortcuts(
  paneRef: RefObject<HTMLElement | null>,
  zoom: { zoomIn: () => void; zoomOut: () => void; reset: () => void },
) {
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (!paneRef.current?.contains(document.activeElement)) return;

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomRef.current.zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomRef.current.zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        zoomRef.current.reset();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [paneRef]);
}
