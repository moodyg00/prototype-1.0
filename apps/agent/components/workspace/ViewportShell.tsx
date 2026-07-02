'use client';

import { CanvasControls } from '@/components/workspace/CanvasControls';
import { CanvasViewport } from '@/components/workspace/CanvasViewport';
import { ChromeEdgeAdders } from '@/components/workspace/ChromeEdgeAdders';
import { DockedPanel } from '@/components/workspace/DockedPanel';
import { FooterDrawer } from '@/components/workspace/FooterDrawer';
import { PanelSlotView } from '@/components/workspace/PanelSlotView';
import { TooltipBar } from '@/components/workspace/TooltipBar';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { featureUsesDockedBar } from '@/lib/pane-catalog';
import { AgentsProvider } from '@/components/panels/agents/AgentsProvider';
import { MediaLibraryProvider } from '@/components/panels/media-library/MediaLibraryProvider';
import { MemoryProvider } from '@/components/panels/memory/MemoryProvider';
import { RunsProvider } from '@/components/panels/runs/RunsProvider';
import { BrowserProvider } from '@/components/panels/browser/BrowserProvider';
import { PhotographyProvider } from '@/components/panels/photography/PhotographyProvider';
import { WorkflowProvider } from '@/components/panels/workflow/WorkflowProvider';
import { WorkflowScopeBridge } from '@/components/panels/workflow/WorkflowScopeBridge';
import { VideoProductionProvider } from '@/components/panels/video-production/VideoProductionProvider';
import { cn } from '@/lib/utils';

export function ViewportShell() {
  const { activeLayout, hydrated, getActiveBarTool, layoutEditMode } = useWorkspace();

  if (!hydrated) {
    return <div className="viewport-shell flex-1 bg-[#09090b]" />;
  }

  return (
    <MediaLibraryProvider>
      <AgentsProvider>
      <MemoryProvider>
      <RunsProvider>
      <BrowserProvider>
      <WorkflowProvider>
      <WorkflowScopeBridge />
      <PhotographyProvider>
        <VideoProductionProvider>
      <div
        className={cn(
          'viewport-shell relative flex-1 overflow-hidden bg-[#09090b]',
          layoutEditMode && 'is-layout-edit',
        )}
      >
        <CanvasViewport />

        <div className="pointer-events-none absolute inset-0 z-[28]">
          <CanvasControls />
        </div>

        {layoutEditMode ? (
          <div className="pointer-events-none absolute inset-0 z-[32]">
            <ChromeEdgeAdders />
          </div>
        ) : null}

        <div className="pinned-chrome-layer pointer-events-none absolute inset-0 z-[30] overflow-hidden">
          {activeLayout.tooltipBars.map((bar) => (
            <div key={bar.id} className="pointer-events-auto">
              <TooltipBar bar={bar} />
            </div>
          ))}

          {activeLayout.tooltipBars.map((bar) => {
            const activeTool = getActiveBarTool(bar.id);
            if (!activeTool || !featureUsesDockedBar(activeTool)) return null;
            return (
              <div key={`${bar.id}-${activeTool}`} className="pointer-events-auto">
                <DockedPanel barId={bar.id} barSide={bar.side} toolId={activeTool} />
              </div>
            );
          })}

          {activeLayout.panelContainers.map((container) => (
            <div key={container.id} className="pointer-events-auto">
              <PanelSlotView container={container} />
            </div>
          ))}

          <div className="pointer-events-auto">
            <FooterDrawer />
          </div>
        </div>
      </div>
        </VideoProductionProvider>
      </PhotographyProvider>
      </WorkflowProvider>
      </BrowserProvider>
      </RunsProvider>
      </MemoryProvider>
      </AgentsProvider>
    </MediaLibraryProvider>
  );
}
