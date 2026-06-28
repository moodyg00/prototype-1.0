'use client';

import { Plus } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { ALL_TOOL_IDS, getTool, type ToolId } from '@/lib/tools';

type MenuAlign = 'start' | 'end';

const MENU_WIDTH = 176;
const MENU_MAX_HEIGHT = 224;
const VIEWPORT_MARGIN = 8;

function clampMenuPosition(
  anchor: DOMRect,
  menuHeight: number,
  align: MenuAlign,
): { top: number; left: number } {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let left = align === 'end' ? anchor.right - MENU_WIDTH : anchor.left;
  let top = anchor.bottom + 4;

  if (top + menuHeight > viewportH - VIEWPORT_MARGIN) {
    top = anchor.top - menuHeight - 4;
  }

  if (left + MENU_WIDTH > viewportW - VIEWPORT_MARGIN) {
    left = viewportW - MENU_WIDTH - VIEWPORT_MARGIN;
  }
  if (left < VIEWPORT_MARGIN) {
    left = VIEWPORT_MARGIN;
  }
  if (top < VIEWPORT_MARGIN) {
    top = VIEWPORT_MARGIN;
  }

  return { top, left };
}

export function ToolPicker({
  existing,
  onSelect,
  label = 'Add tool',
  align = 'start',
}: {
  existing: ToolId[];
  onSelect: (toolId: ToolId) => void;
  label?: string;
  align?: MenuAlign;
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const available = ALL_TOOL_IDS.filter((toolId) => !existing.includes(toolId));

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const measuredHeight = Math.min(menu?.offsetHeight ?? MENU_MAX_HEIGHT, MENU_MAX_HEIGHT);
    setMenuPosition(clampMenuPosition(rect, measuredHeight, align));
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, available.length, updatePosition]);

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

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[80]"
              aria-label="Close tool picker"
              onClick={() => setOpen(false)}
            />
            <div
              ref={menuRef}
              className="fixed z-[81] overflow-auto rounded-md border border-white/10 bg-[#111113] p-1 shadow-xl"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                width: MENU_WIDTH,
                maxHeight: MENU_MAX_HEIGHT,
              }}
            >
              {available.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-zinc-500">No more tools</div>
              ) : (
                available.map((toolId) => {
                  const tool = getTool(toolId);
                  const Icon = tool.icon;
                  return (
                    <button
                      key={toolId}
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/8"
                      onClick={() => {
                        onSelect(toolId);
                        setOpen(false);
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{tool.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div ref={anchorRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      {menu}
    </div>
  );
}