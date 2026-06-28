'use client';

import { getBarRect } from '@/lib/chrome-layout';
import { getTool } from '@/lib/tools';
import type { TooltipBarConfig } from '@/lib/workspace-layout';
import { ToolPicker } from '@/components/workspace/ToolPicker';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { cn } from '@/lib/utils';

export function TooltipBar({ bar }: { bar: TooltipBarConfig }) {
  const { getBarTools, getActiveBarTool, handleBarToolClick, addToolToBar, activeLayout, headerHeight } = useWorkspace();
  const tools = getBarTools(bar.id);
  const activeTool = getActiveBarTool(bar.id);
  const isVertical = bar.side === 'left' || bar.side === 'right';
  const rect = getBarRect(activeLayout, headerHeight, bar.side);

  const style: React.CSSProperties = {
    position: 'fixed',
  };

  if (bar.side === 'top' || bar.side === 'bottom') {
    style.left = rect.left;
    style.right = rect.right;
    style.height = rect.height;
    if (bar.side === 'top') style.top = rect.top;
    if (bar.side === 'bottom') style.bottom = rect.bottom;
  } else {
    style.top = rect.top;
    style.bottom = rect.bottom;
    style.width = rect.width;
    if (bar.side === 'left') style.left = rect.left;
    if (bar.side === 'right') style.right = rect.right;
  }

  return (
    <div
      className={cn(
        'tooltip-bar flex border-white/10 bg-[#0d0d0f]/95 backdrop-blur-sm',
        isVertical ? 'flex-col items-center py-2' : 'flex-row items-center px-2',
        bar.side === 'top' && 'border-b',
        bar.side === 'bottom' && 'border-t',
        bar.side === 'left' && 'border-r',
        bar.side === 'right' && 'border-l',
      )}
      style={style}
    >
      <div className={cn('flex gap-1', isVertical ? 'flex-col items-center' : 'flex-row items-center overflow-x-auto')}>
        {tools.map((toolId) => {
          const tool = getTool(toolId);
          const Icon = tool.icon;
          const active = activeTool === toolId;
          return (
            <button
              key={toolId}
              type="button"
              title={tool.label}
              className={cn(
                'group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors',
                active
                  ? 'border-blue-500/50 bg-blue-500/15 text-blue-200'
                  : 'border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/6 hover:text-zinc-100',
              )}
              onClick={() => handleBarToolClick(bar.id, toolId)}
            >
              <Icon className="h-4 w-4" />
              <span
                className={
                  isVertical
                    ? 'pointer-events-none absolute left-full top-1/2 z-[70] ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded border border-white/10 bg-[#111113] px-2 py-1 text-[10px] text-zinc-200 group-hover:block'
                    : 'pointer-events-none absolute bottom-full left-1/2 z-[70] mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-[#111113] px-2 py-1 text-[10px] text-zinc-200 group-hover:block'
                }
              >
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className={cn(isVertical ? 'mt-auto' : 'ml-2 shrink-0')}>
        <ToolPicker existing={tools} onSelect={(toolId) => addToolToBar(bar.id, toolId)} />
      </div>
    </div>
  );
}