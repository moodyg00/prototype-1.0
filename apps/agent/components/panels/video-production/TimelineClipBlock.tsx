'use client';

import { useRef, useState } from 'react';
import { Film, Mic, Trash2 } from 'lucide-react';

import type { TimelineClip } from '@prototype/ide-tools';

const PX_PER_SEC = 48;

export function TimelineClipBlock({
  clip,
  onCommitStartMs,
  onRemove,
}: {
  clip: TimelineClip;
  onCommitStartMs: (clipId: string, startMs: number) => void;
  onRemove: (clipId: string) => void;
}) {
  const [dragMs, setDragMs] = useState<number | null>(null);
  const dragRef = useRef<{ startX: number; originMs: number } | null>(null);
  const startMs = dragMs ?? clip.startMs;

  const top = clip.track === 'audio' ? 52 : 28;
  const border =
    clip.track === 'audio' ? 'border-cyan-500/40 bg-cyan-500/15' : 'border-amber-500/40 bg-amber-500/15';

  return (
    <div
      role="button"
      tabIndex={0}
      className={`absolute flex h-10 cursor-grab items-center overflow-hidden rounded border px-1 text-[9px] active:cursor-grabbing ${border}`}
      style={{
        top,
        left: (startMs / 1000) * PX_PER_SEC,
        width: Math.max(24, (clip.durationMs / 1000) * PX_PER_SEC),
      }}
      title={`${clip.label ?? clip.mediaId.slice(0, 8)} · ${clip.syncAnchor}`}
      onPointerDown={(e) => {
        dragRef.current = { startX: e.clientX, originMs: clip.startMs };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const next = Math.max(0, dragRef.current.originMs + (dx / PX_PER_SEC) * 1000);
        setDragMs(Math.round(next));
      }}
      onPointerUp={() => {
        if (dragMs != null) onCommitStartMs(clip.id, dragMs);
        setDragMs(null);
        dragRef.current = null;
      }}
    >
      {clip.track === 'audio' ? (
        <Mic size={10} className="mr-1 shrink-0 opacity-70" />
      ) : (
        <Film size={10} className="mr-1 shrink-0 opacity-70" />
      )}
      <span className="truncate">{clip.label ?? clip.mediaId.slice(0, 8)}</span>
      <button
        type="button"
        className="ml-auto shrink-0 text-zinc-500 hover:text-red-300"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(clip.id);
        }}
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}