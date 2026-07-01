'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'public-dev:agent-panel-width';
const DEFAULT_WIDTH = 384;
const MIN_WIDTH = 280;
const MAX_RATIO = 0.55;

function clampWidth(value: number): number {
  if (typeof window === 'undefined') return value;
  const max = Math.floor(window.innerWidth * MAX_RATIO);
  return Math.min(Math.max(MIN_WIDTH, Math.round(value)), max);
}

function readStored(fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? clampWidth(parsed) : fallback;
}

export function useAgentPanelWidth(defaultWidth = DEFAULT_WIDTH) {
  const [width, setWidth] = useState(defaultWidth);

  useEffect(() => {
    setWidth(readStored(defaultWidth));
  }, [defaultWidth]);

  useEffect(() => {
    const onResize = () => setWidth((w) => clampWidth(w));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const persist = useCallback((next: number) => {
    const clamped = clampWidth(next);
    setWidth(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }, []);

  const reset = useCallback(() => persist(defaultWidth), [defaultWidth, persist]);

  return { width, setWidth: persist, reset, min: MIN_WIDTH };
}
