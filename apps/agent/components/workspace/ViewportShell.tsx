'use client';

import { CanvasViewport } from '@/components/workspace/CanvasViewport';
import { DockedPanel } from '@/components/workspace/DockedPanel';
import { FooterDrawer } from '@/components/workspace/FooterDrawer';
import { PanelContainerView } from '@/components/workspace/PanelContainerView';
import { TooltipBar } from '@/components/workspace/TooltipBar';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

export function ViewportShell() {
  const { activeLayout, hydrated, getActiveBarTool } = useWorkspace();

  if (!hydrated) {
    return <div className="viewport-shell flex-1 bg-[#09090b]" />;
  }

  return (
    <div className="viewport-shell relative flex-1 overflow-hidden bg-[#09090b]">
      <CanvasViewport />

      <div className="pinned-chrome-layer pointer-events-none absolute inset-0 z-[30] overflow-hidden">
        {activeLayout.tooltipBars.map((bar) => (
          <div key={bar.id} className="pointer-events-auto">
            <TooltipBar bar={bar} />
          </div>
        ))}

        {activeLayout.tooltipBars.map((bar) => {
          const activeTool = getActiveBarTool(bar.id);
          if (!activeTool) return null;
          return (
            <div key={`${bar.id}-${activeTool}`} className="pointer-events-auto">
              <DockedPanel barId={bar.id} barSide={bar.side} toolId={activeTool} />
            </div>
          );
        })}

        {activeLayout.panelContainers.map((container) => (
          <div key={container.id} className="pointer-events-auto">
            <PanelContainerView container={container} />
          </div>
        ))}

        <div className="pointer-events-auto">
          <FooterDrawer />
        </div>
      </div>
    </div>
  );
}