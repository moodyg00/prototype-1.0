'use client';

import { ChevronRight, Layers, Plus, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getAllFeatureCatalogs, isFeatureMigrated } from '@/lib/pane-catalog';
import type { PaneSpan } from '@/lib/pane-types';
import { getTool, type ToolId } from '@/lib/tools';
import { cn } from '@/lib/utils';

const MENU_WIDTH = 220;
const MENU_MAX_HEIGHT = 360;
const VIEWPORT_MARGIN = 8;

function spanBadgeLabel(span: PaneSpan): string {
  if (span === 'third') return '⅓';
  if (span === 'half') return '½';
  return 'full';
}

function clampMenuPosition(anchor: DOMRect, menuHeight: number): { top: number; left: number } {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  let left = anchor.left;
  let top = anchor.bottom + 4;

  if (top + menuHeight > viewportH - VIEWPORT_MARGIN) top = anchor.top - menuHeight - 4;
  if (left + MENU_WIDTH > viewportW - VIEWPORT_MARGIN) left = viewportW - MENU_WIDTH - VIEWPORT_MARGIN;
  if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
  if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;
  return { top, left };
}

export function FeatureMenu({
  onAddPane,
  onOpenStudio,
  label = 'Add pane',
}: {
  onAddPane: (featureId: ToolId, paneId: string) => void;
  onOpenStudio: (featureId: ToolId, studioId: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<ToolId | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const catalogs = getAllFeatureCatalogs();

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor) return;
    const measuredHeight = Math.min(menu?.offsetHeight ?? MENU_MAX_HEIGHT, MENU_MAX_HEIGHT);
    setMenuPosition(clampMenuPosition(anchor.getBoundingClientRect(), measuredHeight));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, expanded, updatePosition]);

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

  const closeMenu = useCallback(() => {
    setOpen(false);
    setExpanded(null);
  }, []);

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[80]"
              aria-label="Close feature menu"
              onClick={closeMenu}
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
              {catalogs.map((catalog) => {
                const tool = getTool(catalog.featureId);
                const Icon = tool.icon;
                const migrated = isFeatureMigrated(catalog.featureId);
                const isExpanded = expanded === catalog.featureId;

                if (!migrated) {
                  return (
                    <button
                      key={catalog.featureId}
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/8"
                      onClick={() => {
                        onAddPane(catalog.featureId, catalog.panes[0].id);
                        closeMenu();
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{catalog.label}</span>
                      <Plus className="h-3 w-3 shrink-0 text-zinc-600" />
                    </button>
                  );
                }

                return (
                  <div key={catalog.featureId}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-zinc-200 hover:bg-white/8"
                      onClick={() => setExpanded(isExpanded ? null : catalog.featureId)}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate font-medium">{catalog.label}</span>
                      <ChevronRight
                        className={cn('h-3 w-3 shrink-0 text-zinc-600 transition-transform', isExpanded && 'rotate-90')}
                      />
                    </button>
                    {isExpanded ? (
                      <div className="mb-1 ml-3 border-l border-white/8 pl-2">
                        {catalog.panes.map((pane) => (
                          <button
                            key={pane.id}
                            type="button"
                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-zinc-300 hover:bg-white/8"
                            onClick={() => {
                              onAddPane(catalog.featureId, pane.id);
                              closeMenu();
                            }}
                          >
                            <span className="min-w-0 flex-1 truncate">{pane.label}</span>
                            <span className="shrink-0 rounded bg-white/8 px-1 py-0.5 text-[9px] text-zinc-500">
                              {spanBadgeLabel(pane.defaultSpan)}
                            </span>
                          </button>
                        ))}
                        {catalog.studios.map((studio) => (
                          <button
                            key={studio.id}
                            type="button"
                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-violet-300 hover:bg-violet-500/10"
                            onClick={() => {
                              onOpenStudio(catalog.featureId, studio.id);
                              closeMenu();
                            }}
                          >
                            <Sparkles className="h-3 w-3 shrink-0" />
                            {studio.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        title={label}
        className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-white/8 hover:text-zinc-200"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <Layers className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      </button>
      {menu}
    </div>
  );
}
