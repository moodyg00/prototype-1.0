'use client';

import { WorkspacePanel } from '@/components/WorkspacePanel';
import { CanvasViewport } from '@/components/workspace/CanvasViewport';
import { DockedPanel } from '@/components/workspace/DockedPanel';
import { FooterDrawer } from '@/components/workspace/FooterDrawer';
import { PanelContainerView } from '@/components/workspace/PanelContainerView';
import { TooltipBar } from '@/components/workspace/TooltipBar';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

export function ViewportShell() {
  const {
    activeLayout,
    hydrated,
    floatingPanels,
    getActiveBarTool,
    focusPanel,
    closePanel,
    minimizePanel,
    movePanel,
    resizePanel,
  } = useWorkspace();

  if (!hydrated) {
    return <div className="viewport-shell flex-1 bg-[#09090b]" />;
  }

  return (
    <div className="viewport-shell relative flex-1 overflow-hidden bg-[#09090b]">
      <CanvasViewport />

      {activeLayout.tooltipBars.map((bar) => (
        <TooltipBar key={bar.id} bar={bar} />
      ))}

      {activeLayout.tooltipBars.map((bar) => {
        const activeTool = getActiveBarTool(bar.id);
        if (!activeTool) return null;
        return <DockedPanel key={`${bar.id}-${activeTool}`} barId={bar.id} barSide={bar.side} toolId={activeTool} />;
      })}

      {activeLayout.panelContainers.map((container) => (
        <PanelContainerView key={container.id} container={container} />
      ))}

      {floatingPanels.map((panel) => (
        <WorkspacePanel
          key={panel.id}
          panel={panel}
          onFocus={focusPanel}
          onClose={closePanel}
          onMinimize={minimizePanel}
          onMove={movePanel}
          onResize={resizePanel}
        />
      ))}

      <FooterDrawer />
    </div>
  );
}