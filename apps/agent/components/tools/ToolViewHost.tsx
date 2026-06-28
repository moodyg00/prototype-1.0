'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ToolView } from '@/components/PanelContent';
import { ToolRenderContextProvider } from '@/components/tools/ToolRenderContext';
import { createToolRenderContext, DEFAULT_TOOL_BOUNDS, type ToolSurface } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';

interface ToolViewHostProps {
  toolId: ToolId;
  surface: ToolSurface;
  instanceId?: string;
  barId?: string;
  containerId?: string;
  className?: string;
}

export function ToolViewHost({
  toolId,
  surface,
  instanceId,
  barId,
  containerId,
  className,
}: ToolViewHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState(DEFAULT_TOOL_BOUNDS);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setBounds({ width, height });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const context = useMemo(
    () =>
      createToolRenderContext({
        toolId,
        surface,
        instanceId,
        barId,
        containerId,
        bounds,
      }),
    [toolId, surface, instanceId, barId, containerId, bounds],
  );

  return (
    <div ref={containerRef} className={className ?? 'h-full min-h-0 w-full min-w-0'}>
      <ToolRenderContextProvider value={context}>
        <ToolView toolId={toolId} context={context} />
      </ToolRenderContextProvider>
    </div>
  );
}