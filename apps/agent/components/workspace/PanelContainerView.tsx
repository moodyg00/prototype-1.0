'use client';

import { X } from 'lucide-react';
import { getContainerRect } from '@/lib/chrome-layout';
import { PanelContent } from '@/components/PanelContent';
import { ToolPicker } from '@/components/workspace/ToolPicker';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { getTool } from '@/lib/tools';
import type { PanelContainerConfig } from '@/lib/workspace-layout';
import { cn } from '@/lib/utils';

export function PanelContainerView({ container }: { container: PanelContainerConfig }) {
  const { getContainerPanels, closeContainerPanel, addPanelToContainer, activeLayout, headerHeight } = useWorkspace();
  const panels = getContainerPanels(container.id);
  const isVerticalStack = container.side === 'left' || container.side === 'right';
  const rect = getContainerRect(activeLayout, headerHeight, container.id);
  if (!rect) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    background: '#0d0d0f',
  };

  if ('width' in rect) {
    style.width = rect.width;
    style.top = rect.top;
    style.bottom = rect.bottom;
    if ('left' in rect) style.left = rect.left;
    if ('right' in rect) style.right = rect.right;
    style.borderLeft = container.side === 'right' ? '1px solid rgba(255,255,255,0.1)' : undefined;
    style.borderRight = container.side === 'left' ? '1px solid rgba(255,255,255,0.1)' : undefined;
  }
  if ('height' in rect) {
    style.height = rect.height;
    style.left = rect.left;
    style.right = rect.right;
    if ('top' in rect) style.top = rect.top;
    if ('bottom' in rect) style.bottom = rect.bottom;
    style.borderTop = container.side === 'bottom' ? '1px solid rgba(255,255,255,0.1)' : undefined;
    style.borderBottom = container.side === 'top' ? '1px solid rgba(255,255,255,0.1)' : undefined;
  }

  return (
    <div style={style} className="panel-container flex min-h-0 flex-col">
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