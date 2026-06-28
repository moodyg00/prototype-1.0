'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

export function CanvasViewport() {
  const { session, setCanvasTransform, insets } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ active: boolean; x: number; y: number; originX: number; originY: number }>({
    active: false,
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
  });

  const onWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.92 : 1.08;
      const nextScale = Math.min(2.5, Math.max(0.35, session.canvas.scale * delta));
      setCanvasTransform({ ...session.canvas, scale: nextScale });
    },
    [session.canvas, setCanvasTransform],
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') panRef.current.active = true;
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
      className="canvas-viewport absolute overflow-hidden"
      style={{
        top: insets.top,
        left: insets.left,
        right: insets.right,
        bottom: insets.bottom,
        zIndex: 1,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="canvas-world h-[4000px] w-[6000px]"
        style={{
          transform: `translate(${session.canvas.x}px, ${session.canvas.y}px) scale(${session.canvas.scale})`,
          transformOrigin: '0 0',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}