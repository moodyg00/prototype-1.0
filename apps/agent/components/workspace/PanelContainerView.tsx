'use client';

import { X } from 'lucide-react';
import { chromeRectToStyle, getContainerRect } from '@/lib/chrome-layout';
import { PanelContent } from '@/components/PanelContent';
import { ToolPicker } from '@/components/workspace/ToolPicker';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { getTool } from '@/lib/tools';
import type { PanelContainerConfig } from '@/lib/workspace-layout';
import { cn } from '@/lib/utils';

export function PanelContainerView({ container }: { container: PanelContainerConfig }) {
  const { getContainerPanels, closeContainerPanel, addPanelToContainer, activeLayout } = useWorkspace();
  const panels = getContainerPanels(container.id);
  const isVerticalStack = container.side === 'left' || container.side === 'right';
  const rect = getContainerRect(activeLayout, container.id);
  if (!rect) return null;

  return (
    <div
      style={chromeRectToStyle(rect)}
      className={cn(
        'panel-container flex min-h-0 flex-col bg-[#0d0d0f]',
        container.side === 'left' && 'border-r border-white/10',
        container.side === 'right' && 'border-l border-white/10',
        container.side === 'top' && 'border-b border-white/10',
        container.side === 'bottom' && 'border-t border-white/10',
      )}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">Panels</span>
        <ToolPicker
          existing={panels}
          label="Add panel"
          onSelect={(toolId) => addPanelToContainer(container.id, toolId)}
        />
      </div>
      <div
        className={cn(
          'min-h-0 flex-1 overflow-auto p-2',
          isVerticalStack ? 'flex flex-col gap-2' : 'grid grid-cols-1 gap-2 sm:grid-cols-2',
        )}
      >
        {panels.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-zinc-600">
            Empty container. Use + to pin a panel.
          </div>
        ) : (
          panels.map((toolId) => {
            const tool = getTool(toolId);
            const Icon = tool.icon;
            return (
              <div
                key={`${container.id}-${toolId}`}
                className="flex min-h-[180px] min-w-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#111113]"
              >
                <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="truncate text-xs font-medium">{tool.label}</span>
                  </div>
                  <button
                    type="button"
                    className="panel-btn panel-btn-close"
                    onClick={() => closeContainerPanel(container.id, toolId)}
                    title="Close panel"
                  >
                    <X size={11} />
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  <PanelContent toolId={toolId} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}