'use client';

import { Columns3, Rows3 } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { sideLabel } from '@/lib/workspace-mutations';
import type { PinSide } from '@/lib/workspace-layout';
import { cn } from '@/lib/utils';

const EDGE_STYLES: Record<PinSide, string> = {
  top: 'top-2 left-1/2 -translate-x-1/2 flex-row',
  bottom: 'bottom-2 left-1/2 -translate-x-1/2 flex-row',
  left: 'left-2 top-1/2 -translate-y-1/2 flex-col',
  right: 'right-2 top-1/2 -translate-y-1/2 flex-col',
};

function EdgeAdder({ side }: { side: PinSide }) {
  const { addTooltipBar, addPanelContainer } = useWorkspace();

  return (
    <div
      className={cn(
        'pointer-events-auto absolute z-[35] flex gap-1 rounded-lg border border-dashed border-amber-500/35 bg-[#0d0d0f]/90 p-1 shadow-lg backdrop-blur-sm',
        EDGE_STYLES[side],
      )}
    >
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-amber-200/90 hover:bg-amber-500/15"
        onClick={() => addTooltipBar(side)}
        title={`Add tooltip bar on ${side}`}
      >
        <Rows3 className="h-3 w-3" />
        Bar
      </button>
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-amber-200/90 hover:bg-amber-500/15"
        onClick={() => addPanelContainer(side)}
        title={`Add panel zone on ${side}`}
      >
        <Columns3 className="h-3 w-3" />
        Panel
      </button>
      <span className="sr-only">{sideLabel(side)} edge</span>
    </div>
  );
}

export function ChromeEdgeAdders() {
  const sides: PinSide[] = ['top', 'right', 'bottom', 'left'];

  return (
    <>
      {sides.map((side) => (
        <EdgeAdder key={side} side={side} />
      ))}
    </>
  );
}