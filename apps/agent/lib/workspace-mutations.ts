import {
  PANEL_CONTAINER_WIDTH,
  type PanelContainerConfig,
  type PinSide,
  type TooltipBarConfig,
  type WorkspaceLayout,
} from './workspace-layout';

export function createTooltipBar(side: PinSide): TooltipBarConfig {
  return {
    id: `bar-${side}-${Date.now().toString(36)}`,
    side,
    tools: [],
  };
}

export function createPanelContainer(side: PinSide): PanelContainerConfig {
  return {
    id: `container-${side}-${Date.now().toString(36)}`,
    side,
    width: PANEL_CONTAINER_WIDTH,
    panels: [],
  };
}

export function reorderChromeOnSide<T extends { id: string; side: PinSide }>(
  items: T[],
  itemId: string,
  delta: -1 | 1,
): T[] {
  const index = items.findIndex((item) => item.id === itemId);
  if (index < 0) return items;

  const side = items[index].side;
  const sideIndices = items
    .map((item, itemIndex) => ({ item, itemIndex }))
    .filter(({ item }) => item.side === side)
    .map(({ itemIndex }) => itemIndex);

  const sidePosition = sideIndices.indexOf(index);
  const targetSidePosition = sidePosition + delta;
  if (targetSidePosition < 0 || targetSidePosition >= sideIndices.length) {
    return items;
  }

  const targetIndex = sideIndices[targetSidePosition];
  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function moveChromeToSide<T extends { id: string; side: PinSide }>(
  items: T[],
  itemId: string,
  newSide: PinSide,
): T[] {
  const index = items.findIndex((item) => item.id === itemId);
  if (index < 0) return items;

  const item = { ...items[index], side: newSide };
  const without = items.filter((entry) => entry.id !== itemId);
  const lastOnSide = without
    .map((entry, entryIndex) => ({ entry, entryIndex }))
    .filter(({ entry }) => entry.side === newSide)
    .at(-1)?.entryIndex;

  const insertAt = lastOnSide === undefined ? without.length : lastOnSide + 1;
  const next = [...without];
  next.splice(insertAt, 0, item);
  return next;
}

export function addTooltipBarToLayout(layout: WorkspaceLayout, side: PinSide): WorkspaceLayout {
  return {
    ...layout,
    tooltipBars: [...layout.tooltipBars, createTooltipBar(side)],
  };
}

export function removeTooltipBarFromLayout(layout: WorkspaceLayout, barId: string): WorkspaceLayout {
  return {
    ...layout,
    tooltipBars: layout.tooltipBars.filter((bar) => bar.id !== barId),
  };
}

export function addPanelContainerToLayout(layout: WorkspaceLayout, side: PinSide): WorkspaceLayout {
  return {
    ...layout,
    panelContainers: [...layout.panelContainers, createPanelContainer(side)],
  };
}

export function removePanelContainerFromLayout(
  layout: WorkspaceLayout,
  containerId: string,
): WorkspaceLayout {
  return {
    ...layout,
    panelContainers: layout.panelContainers.filter((container) => container.id !== containerId),
  };
}

export const PIN_SIDES: PinSide[] = ['top', 'left', 'right', 'bottom'];

export function sideLabel(side: PinSide): string {
  return side.charAt(0).toUpperCase() + side.slice(1);
}

export function isVerticalSide(side: PinSide): boolean {
  return side === 'left' || side === 'right';
}