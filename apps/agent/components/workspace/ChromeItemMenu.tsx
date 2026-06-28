'use client';

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { PIN_SIDES, isVerticalSide, sideLabel } from '@/lib/workspace-mutations';
import type { PinSide } from '@/lib/workspace-layout';
import { cn } from '@/lib/utils';

const MENU_WIDTH = 168;
const VIEWPORT_MARGIN = 8;

function clampMenuPosition(anchor: DOMRect): { top: number; left: number } {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  let left = anchor.left;
  let top = anchor.bottom + 4;

  if (left + MENU_WIDTH > viewportW - VIEWPORT_MARGIN) {
    left = viewportW - MENU_WIDTH - VIEWPORT_MARGIN;
  }
  if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
  if (top + 220 > viewportH - VIEWPORT_MARGIN) {
    top = anchor.top - 220 - 4;
  }
  if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;

  return { top, left };
}

export function ChromeItemMenu({
  kind,
  itemId,
  side,
  className,
}: {
  kind: 'bar' | 'container';
  itemId: string;
  side: PinSide;
  className?: string;
}) {
  const {
    reorderTooltipBar,
    moveTooltipBarToSide,
    removeTooltipBar,
    reorderPanelContainer,
    movePanelContainerToSide,
    removePanelContainer,
  } = useWorkspace();

  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const vertical = isVerticalSide(side);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    setMenuPosition(clampMenuPosition(anchor.getBoundingClientRect()));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, updatePosition]);

  const reorderEarlier = () => {
    if (kind === 'bar') reorderTooltipBar(itemId, -1);
    else reorderPanelContainer(itemId, -1);
    setOpen(false);
  };

  const reorderLater = () => {
    if (kind === 'bar') reorderTooltipBar(itemId, 1);
    else reorderPanelContainer(itemId, 1);
    setOpen(false);
  };

  const moveToSide = (target: PinSide) => {
    if (kind === 'bar') moveTooltipBarToSide(itemId, target);
    else movePanelContainerToSide(itemId, target);
    setOpen(false);
  };

  const remove = () => {
    if (kind === 'bar') removeTooltipBar(itemId);
    else removePanelContainer(itemId);
    setOpen(false);
  };

  const EarlierIcon = vertical ? ArrowUp : ArrowLeft;
  const LaterIcon = vertical ? ArrowDown : ArrowRight;

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[85]"
              aria-label="Close chrome menu"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-[86] overflow-hidden rounded-md border border-white/10 bg-[#111113] p-1 shadow-xl"
              style={{ top: menuPosition.top, left: menuPosition.left, width: MENU_WIDTH }}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/8"
                onClick={reorderEarlier}
              >
                <EarlierIcon className="h-3.5 w-3.5" />
                Move earlier
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/8"
                onClick={reorderLater}
              >
                <LaterIcon className="h-3.5 w-3.5" />
                Move later
              </button>
              <div className="my-1 border-t border-white/8" />
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-600">
                Move to edge
              </div>
              {PIN_SIDES.filter((target) => target !== side).map((target) => (
                <button
                  key={target}
                  type="button"
                  className="flex w-full rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/8"
                  onClick={() => moveToSide(target)}
                >
                  {sideLabel(target)}
                </button>
              ))}
              <div className="my-1 border-t border-white/8" />
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-red-300 hover:bg-red-500/10"
                onClick={remove}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div ref={anchorRef} className={cn('relative', className)}>
      <button
        type="button"
        title="Layout options"
        className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-white/8 hover:text-zinc-200"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {menu}
    </div>
  );
}