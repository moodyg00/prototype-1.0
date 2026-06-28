'use client';

import { useCallback, useEffect, useRef } from 'react';
import { WorkspacePanel } from '@/components/WorkspacePanel';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { zoomCanvasAtPointer } from '@/lib/canvas-coords';

export function CanvasViewport() {
  const {
    session,
    setCanvasTransform,
    insets,
    floatingPanels,
    focusPanel,
    closePanel,
    minimizePanel,
    movePanel,
    resizePanel,
    registerCanvasViewport,
  } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
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

  const onWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      setCanvasTransform(
        zoomCanvasAtPointer(session.canvas, event.clientX, event.clientY, rect, event.deltaY),
      );
    },
    [session.canvas, setCanvasTransform],
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
        panRef.current.active = true;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') panRef.current.active = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    node.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      node.removeEventListener('wheel', onWheel);
    };
  }, [onWheel]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const spacePan = panRef.current.active;
    const middlePan = event.button === 1;
    if (!spacePan && !middlePan) return;
    panRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      originX: session.canvas.x,
      originY: session.canvas.y,
    };
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
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={ref}
      className="canvas-viewport canvas-layer absolute overflow-hidden"
      style={{
        top: insets.top,
        left: insets.left,
        right: insets.right,
        bottom: insets.bottom,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
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