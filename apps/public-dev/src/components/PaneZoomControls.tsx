'use client';

import { Minus, Plus, RotateCcw } from 'lucide-react';

export function PaneZoomControls({
  value,
  defaultValue,
  min,
  max,
  onZoomIn,
  onZoomOut,
  onReset,
  title,
}: {
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  title: string;
}) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-0.5"
      title={title}
    >
      <button
        type="button"
        onClick={onZoomOut}
        disabled={atMin}
        title="Zoom out (⌘-)"
        className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--color-panel)] hover:text-[var(--color-fg)] disabled:opacity-30"
      >
        <Minus size={11} />
      </button>
      <span className="min-w-[1.75rem] px-0.5 text-center text-[10px] tabular-nums text-[var(--color-muted)]">
        {value}
      </span>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={atMax}
        title="Zoom in (⌘+)"
        className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--color-panel)] hover:text-[var(--color-fg)] disabled:opacity-30"
      >
        <Plus size={11} />
      </button>
      {value !== defaultValue && (
        <button
          type="button"
          onClick={onReset}
          title="Reset to default"
          className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--color-panel)] hover:text-[var(--color-fg)]"
        >
          <RotateCcw size={10} />
        </button>
      )}
    </div>
  );
}
