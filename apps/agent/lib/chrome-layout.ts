import { PANEL_CONTAINER_WIDTH, TOOLBAR_SIZE, type PinSide, type WorkspaceLayout } from './workspace-layout';

export interface ViewportInsets {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

function sideThickness(layout: WorkspaceLayout, side: PinSide, excludeBars = false, excludeContainers = false): number {
  let total = 0;
  if (!excludeBars) {
    total += layout.tooltipBars.filter((bar) => bar.side === side).length * TOOLBAR_SIZE;
  }
  if (!excludeContainers) {
    for (const container of layout.panelContainers) {
      if (container.side === side) total += container.width;
    }
  }
  return total;
}

export function computeInsets(layout: WorkspaceLayout, headerHeight: number): ViewportInsets {
  return {
    top: headerHeight + sideThickness(layout, 'top'),
    left: sideThickness(layout, 'left'),
    right: sideThickness(layout, 'right'),
    bottom: sideThickness(layout, 'bottom'),
  };
}

export function getBarRect(layout: WorkspaceLayout, headerHeight: number, side: PinSide) {
  const topContainers = layout.panelContainers
    .filter((container) => container.side === 'top')
    .reduce((sum, container) => sum + container.width, 0);
  const bottomContainers = layout.panelContainers
    .filter((container) => container.side === 'bottom')
    .reduce((sum, container) => sum + container.width, 0);
  const leftContainers = layout.panelContainers
    .filter((container) => container.side === 'left')
    .reduce((sum, container) => sum + container.width, 0);
  const rightContainers = layout.panelContainers
    .filter((container) => container.side === 'right')
    .reduce((sum, container) => sum + container.width, 0);

  const hasTopBar = layout.tooltipBars.some((bar) => bar.side === 'top');
  const hasBottomBar = layout.tooltipBars.some((bar) => bar.side === 'bottom');
  const hasLeftBar = layout.tooltipBars.some((bar) => bar.side === 'left');
  const hasRightBar = layout.tooltipBars.some((bar) => bar.side === 'right');

  if (side === 'top') {
    return {
      top: headerHeight + topContainers,
      left: (hasLeftBar ? TOOLBAR_SIZE : 0) + leftContainers,
      right: rightContainers + (hasRightBar ? TOOLBAR_SIZE : 0),
      height: TOOLBAR_SIZE,
    };
  }

  if (side === 'bottom') {
    return {
      bottom: bottomContainers + (hasBottomBar ? 0 : 0),
      left: (hasLeftBar ? TOOLBAR_SIZE : 0) + leftContainers,
      right: rightContainers + (hasRightBar ? TOOLBAR_SIZE : 0),
      height: TOOLBAR_SIZE,
    };
  }

  if (side === 'left') {
    return {
      top: headerHeight + topContainers + (hasTopBar ? TOOLBAR_SIZE : 0),
      left: leftContainers,
      bottom: bottomContainers + (hasBottomBar ? TOOLBAR_SIZE : 0),
      width: TOOLBAR_SIZE,
    };
  }

  return {
    top: headerHeight + topContainers + (hasTopBar ? TOOLBAR_SIZE : 0),
    right: rightContainers,
    bottom: bottomContainers + (hasBottomBar ? TOOLBAR_SIZE : 0),
    width: TOOLBAR_SIZE,
  };
}

export function getContainerRect(layout: WorkspaceLayout, headerHeight: number, containerId: string) {
  const container = layout.panelContainers.find((item) => item.id === containerId);
  if (!container) return null;

  const topContainersBefore = 0;
  const hasTopBar = layout.tooltipBars.some((bar) => bar.side === 'top');
  const hasBottomBar = layout.tooltipBars.some((bar) => bar.side === 'bottom');
  const hasLeftBar = layout.tooltipBars.some((bar) => bar.side === 'left');
  const hasRightBar = layout.tooltipBars.some((bar) => bar.side === 'right');

  const topStack =
    layout.panelContainers.filter((item) => item.side === 'top').reduce((sum, item) => sum + item.width, 0);
  const bottomStack =
    layout.panelContainers.filter((item) => item.side === 'bottom').reduce((sum, item) => sum + item.width, 0);
  const leftStack =
    layout.panelContainers.filter((item) => item.side === 'left').reduce((sum, item) => sum + item.width, 0);

  const width = container.width ?? PANEL_CONTAINER_WIDTH;

  if (container.side === 'right') {
    return {
      top: headerHeight + topStack + (hasTopBar ? TOOLBAR_SIZE : 0),
      right: 0,
      bottom: bottomStack + (hasBottomBar ? TOOLBAR_SIZE : 0),
      width,
    };
  }

  if (container.side === 'left') {
    return {
      top: headerHeight + topStack + (hasTopBar ? TOOLBAR_SIZE : 0),
      left: leftStack - width + (hasLeftBar ? TOOLBAR_SIZE : 0),
      bottom: bottomStack + (hasBottomBar ? TOOLBAR_SIZE : 0),
      width,
    };
  }

  if (container.side === 'top') {
    return {
      top: headerHeight + topContainersBefore,
      left: (hasLeftBar ? TOOLBAR_SIZE : 0) + leftStack,
      right: layout.panelContainers.filter((item) => item.side === 'right').reduce((sum, item) => sum + item.width, 0) + (hasRightBar ? TOOLBAR_SIZE : 0),
      height: width,
    };
  }

  return {
    bottom: bottomStack - width,
    left: (hasLeftBar ? TOOLBAR_SIZE : 0) + leftStack,
    right: layout.panelContainers.filter((item) => item.side === 'right').reduce((sum, item) => sum + item.width, 0) + (hasRightBar ? TOOLBAR_SIZE : 0),
    height: width,
  };
}

export function getDockedPanelRect(
  layout: WorkspaceLayout,
  headerHeight: number,
  barSide: PinSide,
) {
  const insets = computeInsets(layout, headerHeight);
  const hasTopBar = layout.tooltipBars.some((bar) => bar.side === 'top');
  const hasLeftBar = layout.tooltipBars.some((bar) => bar.side === 'left');

  if (barSide === 'left') {
    return {
      top: headerHeight + (hasTopBar ? TOOLBAR_SIZE : 0) + layout.panelContainers.filter((c) => c.side === 'top').reduce((s, c) => s + c.width, 0),
      left: (hasLeftBar ? TOOLBAR_SIZE : 0) + layout.panelContainers.filter((c) => c.side === 'left').reduce((s, c) => s + c.width, 0),
      bottom: insets.bottom,
      width: 320,
    };
  }

  if (barSide === 'right') {
    return {
      top: insets.top,
      right: insets.right,
      bottom: insets.bottom,
      width: 320,
    };
  }

  if (barSide === 'top') {
    return {
      top: insets.top,
      left: insets.left,
      right: insets.right,
      height: 320,
    };
  }

  return {
    bottom: insets.bottom + TOOLBAR_SIZE,
    left: insets.left,
    right: insets.right,
    height: 320,
  };
}