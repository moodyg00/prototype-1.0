'use client';

import { Group, Hand, Lock, LockOpen, RotateCcw, Ungroup, ZoomIn, ZoomOut } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { HoverRevealZone } from '@/components/ui/HoverRevealZone';
import { collectGroupIdsFromSelection, validateCanvasGroupSelection } from '@/lib/canvas-groups';
import { cn } from '@/lib/utils';

const CONTROL_SIZE = 32;

function lockToggleClass(locked: boolean): string {
  return locked
    ? 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
    : 'text-zinc-400 hover:bg-white/6 hover:text-zinc-100';
}

export function CanvasControls() {
  const {
    session,
    chromeMetrics,
    canvasZoomLocked,
    canvasPanLocked,
    toggleCanvasZoomLocked,
    toggleCanvasPanLocked,
    zoomCanvasIn,
    zoomCanvasOut,
    resetCanvasView,
    canvasSelection,
    studioInstances,
    paneWindows,
    floatingPanels,
    createCanvasGroupFromSelection,
    ungroupCanvasSelection,
  } = useWorkspace();

  const canGroup =
    validateCanvasGroupSelection(
      canvasSelection,
      studioInstances,
      paneWindows,
      floatingPanels,
    ) === undefined;
  const canUngroup =
    collectGroupIdsFromSelection(canvasSelection, studioInstances, paneWindows, floatingPanels).size > 0;

  return (
    <HoverRevealZone
      className="absolute"
      style={{ right: chromeMetrics.rightWidth, bottom: chromeMetrics.bottomHeight }}
      padding={20}
    >
      <div className="canvas-controls flex items-center gap-1 rounded-lg border border-white/12 bg-[#111113]/95 p-1 shadow-lg backdrop-blur-sm">
        <button
          type="button"
          className={cn(
            'flex items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/6 hover:text-zinc-100',
            canvasZoomLocked && 'pointer-events-none opacity-40',
          )}
          style={{ width: CONTROL_SIZE, height: CONTROL_SIZE }}
          onClick={zoomCanvasOut}
          disabled={canvasZoomLocked}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="flex items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/6 hover:text-zinc-100"
          style={{ width: CONTROL_SIZE, height: CONTROL_SIZE }}
          onClick={resetCanvasView}
          aria-label="Reset view"
          title="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"
          className={cn(
            'flex items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/6 hover:text-zinc-100',
            canvasZoomLocked && 'pointer-events-none opacity-40',
          )}
          style={{ width: CONTROL_SIZE, height: CONTROL_SIZE }}
          onClick={zoomCanvasIn}
          disabled={canvasZoomLocked}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <button
          type="button"
          className={cn(
            'flex items-center justify-center rounded-md transition-colors',
            lockToggleClass(canvasZoomLocked),
          )}
          style={{ width: CONTROL_SIZE, height: CONTROL_SIZE }}
          onClick={toggleCanvasZoomLocked}
          aria-label={canvasZoomLocked ? 'Unlock zoom' : 'Lock zoom'}
          aria-pressed={canvasZoomLocked}
          title={canvasZoomLocked ? 'Unlock zoom' : 'Lock zoom'}
        >
          {canvasZoomLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
        </button>

        <div className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />

        <button
          type="button"
          className={cn(
            'flex items-center justify-center rounded-md transition-colors',
            canGroup ? 'text-zinc-300 hover:bg-white/6 hover:text-zinc-100' : 'pointer-events-none opacity-40 text-zinc-500',
          )}
          style={{ width: CONTROL_SIZE, height: CONTROL_SIZE }}
          onClick={createCanvasGroupFromSelection}
          disabled={!canGroup}
          aria-label="Group selected windows"
          title="Group selected (⌘G)"
        >
          <Group className="h-4 w-4" />
        </button>

        <button
          type="button"
          className={cn(
            'flex items-center justify-center rounded-md transition-colors',
            canUngroup ? 'text-zinc-300 hover:bg-white/6 hover:text-zinc-100' : 'pointer-events-none opacity-40 text-zinc-500',
          )}
          style={{ width: CONTROL_SIZE, height: CONTROL_SIZE }}
          onClick={ungroupCanvasSelection}
          disabled={!canUngroup}
          aria-label="Ungroup"
          title="Ungroup selected groups (⌘⇧G) — dissolves entire group"
        >
          <Ungroup className="h-4 w-4" />
        </button>

        <div className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />

        <button
          type="button"
          className={cn(
            'flex items-center justify-center rounded-md transition-colors',
            lockToggleClass(canvasPanLocked),
          )}
          style={{ width: CONTROL_SIZE, height: CONTROL_SIZE }}
          onClick={toggleCanvasPanLocked}
          aria-label={canvasPanLocked ? 'Enable pan' : 'Lock pan'}
          aria-pressed={canvasPanLocked}
          title={canvasPanLocked ? 'Enable pan' : 'Lock pan'}
        >
          <Hand className="h-4 w-4" />
        </button>

        <span className="sr-only">
          Canvas scale {Math.round(session.canvas.scale * 100)}%
          {canvasZoomLocked ? ', zoom locked' : ''}
          {canvasPanLocked ? ', pan locked' : ''}
        </span>
      </div>
    </HoverRevealZone>
  );
}
