'use client';

import { useEffect, useRef, useState } from 'react';
import { WorkspacePanel } from '@/components/WorkspacePanel';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { cn } from '@/lib/utils';

function canStartPan(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.classList.contains('canvas-viewport') || target.classList.contains('canvas-world');
}

export function CanvasViewport() {
  const {
    session,
    canvasPanLocked,
    setCanvasTransform,
    floatingPanels,
    focusPanel,
    closePanel,
    minimizePanel,
    movePanel,
    resizePanel,
    registerCanvasViewport,
  } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{ active: boolean; x: number; y: number; originX: number; originY: number }>({
    active: false,
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    registerCanvasViewport(ref.current);
    return () => registerCanvasViewport(null);
  }, [registerCanvasViewport]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (canvasPanLocked || event.button !== 0 || !canStartPan(event.target)) return;
    panRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      originX: session.canvas.x,
      originY: session.canvas.y,
    };
    setPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current.active) return;
    const dx = event.clientX - panRef.current.x;
    const dy = event.clientY - panRef.current.y;
    setCanvasTransform({
      ...session.canvas,
      x: panRef.current.originX + dx,
      y: panRef.current.originY + dy,
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    panRef.current.active = false;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'canvas-viewport canvas-layer absolute inset-0 overflow-hidden',
        panning && 'is-panning',
        canvasPanLocked && 'is-pan-locked cursor-default',
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        ref={worldRef}
        className="canvas-world relative h-[6000px] w-[8000px]"
        style={{
          transform: `translate(${session.canvas.x}px, ${session.canvas.y}px) scale(${session.canvas.scale})`,
          transformOrigin: '0 0',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {floatingPanels.map((panel) => (
          <WorkspacePanel
            key={panel.id}
            panel={panel}
            scale={session.canvas.scale}
            onFocus={focusPanel}
            onClose={closePanel}
            onMinimize={minimizePanel}
            onMove={movePanel}
            onResize={resizePanel}
          />
        ))}
      </div>
    </div>
  );
}