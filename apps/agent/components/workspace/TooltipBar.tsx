'use client';

import { X } from 'lucide-react';
import { chromeRectToStyle, getBarRect } from '@/lib/chrome-layout';
import { getTool } from '@/lib/tools';
import type { TooltipBarConfig } from '@/lib/workspace-layout';
import { ChromeItemMenu } from '@/components/workspace/ChromeItemMenu';
import { ToolPicker } from '@/components/workspace/ToolPicker';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { cn } from '@/lib/utils';

export function TooltipBar({ bar }: { bar: TooltipBarConfig }) {
  const {
    getBarTools,
    getActiveBarTool,
    handleBarToolClick,
    addToolToBar,
    removeToolFromBar,
    activeLayout,
    layoutEditMode,
  } = useWorkspace();
  const tools = getBarTools(bar.id);
  const activeTool = getActiveBarTool(bar.id);
  const isVertical = bar.side === 'left' || bar.side === 'right';
  const rect = getBarRect(activeLayout, bar.id);
  if (!rect) return null;

  return (
    <div
      className={cn(
        'tooltip-bar flex border-white/10 bg-[#0d0d0f]/95 backdrop-blur-sm',
        layoutEditMode && 'ring-1 ring-inset ring-amber-500/30',
        isVertical ? 'flex-col items-center py-2' : 'flex-row items-center px-2',
        bar.side === 'top' && 'border-b',
        bar.side === 'bottom' && 'border-t',
        bar.side === 'left' && 'border-r',
        bar.side === 'right' && 'border-l',
      )}
      style={chromeRectToStyle(rect)}
    >
      <div
        className={cn(
          'flex shrink-0 gap-0.5',
          isVertical ? 'flex-col items-center' : 'flex-row items-center',
        )}
      >
        <ToolPicker
          existing={tools}
          align="start"
          onSelect={(toolId) => addToolToBar(bar.id, toolId)}
        />
        {layoutEditMode ? (
          <ChromeItemMenu kind="bar" itemId={bar.id} side={bar.side} />
        ) : null}
      </div>

      <div
        className={cn(
          'flex min-w-0 gap-1',
          isVertical
            ? 'flex-col items-center overflow-y-auto'
            : 'flex-row items-center overflow-x-auto',
        )}
      >
        {tools.map((toolId) => {
          const tool = getTool(toolId);
          const Icon = tool.icon;
          const active = activeTool === toolId;
          return (
            <div key={toolId} className="group relative shrink-0">
              <button
                type="button"
                title={tool.label}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
                  active
                    ? 'border-blue-500/50 bg-blue-500/15 text-blue-200'
                    : 'border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/6 hover:text-zinc-100',
                )}
                onClick={() => handleBarToolClick(bar.id, toolId)}
              >
                <Icon className="h-4 w-4" />
              </button>
              <button
                type="button"
                title={`Remove ${tool.label}`}
                className="absolute -right-1 -top-1 z-10 hidden h-3.5 w-3.5 items-center justify-center rounded-full border border-white/15 bg-[#1a1a1d] text-zinc-400 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-200 group-hover:flex"
                onClick={(event) => {
                  event.stopPropagation();
                  removeToolFromBar(bar.id, toolId);
                }}
              >
                <X className="h-2 w-2" />
              </button>
              <span
                className={
                  isVertical
                    ? 'pointer-events-none absolute left-full top-1/2 z-[70] ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded border border-white/10 bg-[#111113] px-2 py-1 text-[10px] text-zinc-200 group-hover:block'
                    : 'pointer-events-none absolute bottom-full left-1/2 z-[70] mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-[#111113] px-2 py-1 text-[10px] text-zinc-200 group-hover:block'
                }
              >
                {tool.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}