import type { CanvasGroup, CanvasWindowRef, PaneWindowInstance, StudioInstance } from './pane-types';
import type { PanelInstance } from './panels';

export type CanvasWindowBounds = { x: number; y: number; w: number; h: number };

export function studioBounds(studio: StudioInstance): CanvasWindowBounds {
  return { x: studio.x, y: studio.y, w: studio.w, h: studio.minimized ? 40 : studio.h };
}

export function paneWindowBounds(win: PaneWindowInstance): CanvasWindowBounds {
  return { x: win.x, y: win.y, w: win.w, h: win.minimized ? 40 : win.h };
}

export function panelBounds(panel: PanelInstance): CanvasWindowBounds {
  return { x: panel.x, y: panel.y, w: panel.w, h: panel.minimized ? 40 : panel.h };
}

export function canvasWindowKey(ref: CanvasWindowRef): string {
  return `${ref.kind}:${ref.id}`;
}

export function canvasWindowRefsEqual(a: CanvasWindowRef, b: CanvasWindowRef): boolean {
  return a.kind === b.kind && a.id === b.id;
}

export function resolveWindowGroupId(
  ref: CanvasWindowRef,
  studios: StudioInstance[],
  paneWindows: PaneWindowInstance[],
  floatingPanels: PanelInstance[],
): string | undefined {
  if (ref.kind === 'studio') return studios.find((s) => s.id === ref.id)?.groupId;
  if (ref.kind === 'pane-window') return paneWindows.find((w) => w.id === ref.id)?.groupId;
  return floatingPanels.find((p) => p.id === ref.id)?.groupId;
}

/** Group ids for every selected window that belongs to a group. */
export function collectGroupIdsFromSelection(
  selection: CanvasWindowRef[],
  studios: StudioInstance[],
  paneWindows: PaneWindowInstance[],
  floatingPanels: PanelInstance[],
): Set<string> {
  const groupIds = new Set<string>();
  for (const ref of selection) {
    const groupId = resolveWindowGroupId(ref, studios, paneWindows, floatingPanels);
    if (groupId) groupIds.add(groupId);
  }
  return groupIds;
}

/** Show a group hull only when at least one of its members is selected. */
export function isGroupVisibleInSelection(
  group: CanvasGroup,
  selection: CanvasWindowRef[],
): boolean {
  return group.members.some((member) => selection.some((ref) => canvasWindowRefsEqual(ref, member)));
}

/**
 * Ungroup semantics: dissolve every group that has at least one selected member.
 * All windows in those groups become independent — we do not split into sub-groups
 * or detach only the selected subset (keeps one groupId per arrangement, simple UX).
 */
export function dissolveCanvasGroups(
  session: {
    studioInstances: StudioInstance[];
    paneWindows: PaneWindowInstance[];
    floatingPanels: PanelInstance[];
    canvasGroups: CanvasGroup[];
  },
  groupIds: Iterable<string>,
): {
  studioInstances: StudioInstance[];
  paneWindows: PaneWindowInstance[];
  floatingPanels: PanelInstance[];
  canvasGroups: CanvasGroup[];
} {
  const ids = new Set(groupIds);
  if (ids.size === 0) {
    return {
      studioInstances: session.studioInstances,
      paneWindows: session.paneWindows,
      floatingPanels: session.floatingPanels,
      canvasGroups: session.canvasGroups,
    };
  }

  let studioInstances = session.studioInstances;
  let paneWindows = session.paneWindows;
  let floatingPanels = session.floatingPanels;
  for (const groupId of ids) {
    const cleared = clearGroupIdFromWindows(groupId, studioInstances, paneWindows, floatingPanels);
    studioInstances = cleared.studioInstances;
    paneWindows = cleared.paneWindows;
    floatingPanels = cleared.floatingPanels;
  }

  return {
    studioInstances,
    paneWindows,
    floatingPanels,
    canvasGroups: session.canvasGroups.filter((g) => !ids.has(g.id)),
  };
}

/** Returns undefined when selection is valid for a new group; otherwise a reason string. */
export function validateCanvasGroupSelection(
  selection: CanvasWindowRef[],
  studios: StudioInstance[],
  paneWindows: PaneWindowInstance[],
  floatingPanels: PanelInstance[],
): string | undefined {
  if (selection.length < 2) return 'Select at least two windows';

  const groupIds = new Set<string>();
  let ungroupedCount = 0;
  for (const ref of selection) {
    const groupId = resolveWindowGroupId(ref, studios, paneWindows, floatingPanels);
    if (groupId) groupIds.add(groupId);
    else ungroupedCount += 1;
  }

  if (groupIds.size > 1) return 'Selection spans multiple groups';
  if (groupIds.size === 1 && ungroupedCount > 0) return 'Selection mixes grouped and ungrouped windows';
  if (groupIds.size === 1 && ungroupedCount === 0) return 'Selection is already a single group';

  return undefined;
}

export function groupBounds(
  members: CanvasWindowRef[],
  studios: StudioInstance[],
  paneWindows: PaneWindowInstance[],
  floatingPanels: PanelInstance[],
): CanvasWindowBounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const ref of members) {
    const bounds = resolveBounds(ref, studios, paneWindows, floatingPanels);
    if (!bounds) continue;
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.w);
    maxY = Math.max(maxY, bounds.y + bounds.h);
  }

  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function resolveBounds(
  ref: CanvasWindowRef,
  studios: StudioInstance[],
  paneWindows: PaneWindowInstance[],
  floatingPanels: PanelInstance[],
): CanvasWindowBounds | null {
  if (ref.kind === 'studio') {
    const studio = studios.find((s) => s.id === ref.id);
    return studio ? studioBounds(studio) : null;
  }
  if (ref.kind === 'pane-window') {
    const win = paneWindows.find((w) => w.id === ref.id);
    return win ? paneWindowBounds(win) : null;
  }
  const panel = floatingPanels.find((p) => p.id === ref.id);
  return panel ? panelBounds(panel) : null;
}

export function rectsIntersect(
  a: CanvasWindowBounds,
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function scaleGroupMembers(
  members: CanvasWindowRef[],
  origin: CanvasWindowBounds,
  next: CanvasWindowBounds,
  studios: StudioInstance[],
  paneWindows: PaneWindowInstance[],
  floatingPanels: PanelInstance[],
): {
  studioInstances: StudioInstance[];
  paneWindows: PaneWindowInstance[];
  floatingPanels: PanelInstance[];
} {
  const sx = origin.w > 0 ? next.w / origin.w : 1;
  const sy = origin.h > 0 ? next.h / origin.h : 1;

  const nextStudios = studios.map((studio) => {
    const ref = members.find((m) => m.kind === 'studio' && m.id === studio.id);
    if (!ref) return studio;
    const b = studioBounds(studio);
    return {
      ...studio,
      x: next.x + (b.x - origin.x) * sx,
      y: next.y + (b.y - origin.y) * sy,
      w: Math.max(260, b.w * sx),
      h: Math.max(studio.minimized ? 40 : 200, b.h * sy),
    };
  });

  const nextPaneWindows = paneWindows.map((win) => {
    const ref = members.find((m) => m.kind === 'pane-window' && m.id === win.id);
    if (!ref) return win;
    const b = paneWindowBounds(win);
    return {
      ...win,
      x: next.x + (b.x - origin.x) * sx,
      y: next.y + (b.y - origin.y) * sy,
      w: Math.max(260, b.w * sx),
      h: Math.max(win.minimized ? 40 : 200, b.h * sy),
    };
  });

  const nextFloatingPanels = floatingPanels.map((panel) => {
    const ref = members.find((m) => m.kind === 'floating-panel' && m.id === panel.id);
    if (!ref) return panel;
    const b = panelBounds(panel);
    return {
      ...panel,
      x: next.x + (b.x - origin.x) * sx,
      y: next.y + (b.y - origin.y) * sy,
      w: Math.max(320, b.w * sx),
      h: Math.max(panel.minimized ? 40 : 240, b.h * sy),
    };
  });

  return { studioInstances: nextStudios, paneWindows: nextPaneWindows, floatingPanels: nextFloatingPanels };
}

export function removeMemberFromGroups(groups: CanvasGroup[], ref: CanvasWindowRef): CanvasGroup[] {
  return groups
    .map((group) => ({
      ...group,
      members: group.members.filter((m) => !(m.kind === ref.kind && m.id === ref.id)),
    }))
    .filter((group) => group.members.length >= 2);
}

export function moveGroupByDelta(
  session: {
    studioInstances: StudioInstance[];
    paneWindows: PaneWindowInstance[];
    floatingPanels: PanelInstance[];
  },
  group: CanvasGroup,
  dx: number,
  dy: number,
): {
  studioInstances: StudioInstance[];
  paneWindows: PaneWindowInstance[];
  floatingPanels: PanelInstance[];
} {
  const memberKeys = new Set(group.members.map(canvasWindowKey));
  return {
    studioInstances: session.studioInstances.map((studio) =>
      memberKeys.has(canvasWindowKey({ kind: 'studio', id: studio.id }))
        ? { ...studio, x: studio.x + dx, y: studio.y + dy }
        : studio,
    ),
    paneWindows: session.paneWindows.map((win) =>
      memberKeys.has(canvasWindowKey({ kind: 'pane-window', id: win.id }))
        ? { ...win, x: win.x + dx, y: win.y + dy }
        : win,
    ),
    floatingPanels: session.floatingPanels.map((panel) =>
      memberKeys.has(canvasWindowKey({ kind: 'floating-panel', id: panel.id }))
        ? { ...panel, x: panel.x + dx, y: panel.y + dy }
        : panel,
    ),
  };
}

export function assignGroupId(
  session: {
    studioInstances: StudioInstance[];
    paneWindows: PaneWindowInstance[];
    floatingPanels: PanelInstance[];
  },
  members: CanvasWindowRef[],
  groupId: string,
): {
  studioInstances: StudioInstance[];
  paneWindows: PaneWindowInstance[];
  floatingPanels: PanelInstance[];
} {
  const memberKeys = new Set(members.map(canvasWindowKey));
  return {
    studioInstances: session.studioInstances.map((studio) =>
      memberKeys.has(canvasWindowKey({ kind: 'studio', id: studio.id }))
        ? { ...studio, groupId }
        : studio,
    ),
    paneWindows: session.paneWindows.map((win) =>
      memberKeys.has(canvasWindowKey({ kind: 'pane-window', id: win.id }))
        ? { ...win, groupId }
        : win,
    ),
    floatingPanels: session.floatingPanels.map((panel) =>
      memberKeys.has(canvasWindowKey({ kind: 'floating-panel', id: panel.id }))
        ? { ...panel, groupId }
        : panel,
    ),
  };
}

export function clearGroupIdFromWindows(
  groupId: string,
  studioInstances: StudioInstance[],
  paneWindows: PaneWindowInstance[],
  floatingPanels: PanelInstance[],
): {
  studioInstances: StudioInstance[];
  paneWindows: PaneWindowInstance[];
  floatingPanels: PanelInstance[];
} {
  return {
    studioInstances: studioInstances.map((s) => (s.groupId === groupId ? { ...s, groupId: undefined } : s)),
    paneWindows: paneWindows.map((w) => (w.groupId === groupId ? { ...w, groupId: undefined } : w)),
    floatingPanels: floatingPanels.map((p) => (p.groupId === groupId ? { ...p, groupId: undefined } : p)),
  };
}
