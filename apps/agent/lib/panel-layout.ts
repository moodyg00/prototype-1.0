import {
  createInstanceId,
  paneSpanWeight,
  type PaneInstance,
  type PaneSpan,
  type SplitNode,
  type StudioSplitTemplate,
} from './pane-types';
import type { ToolId } from './tools';

/**
 * Split-tree helpers shared by Panel slots and Studio windows.
 *
 * Stack-below rule: adding a pane to an occupied host wraps the current root
 * and the new leaf in a vertical ('col') split. Weights come from
 * `paneSpanWeight` (third=1, half=2, full=3) and are only used to seed
 * initial percentage sizes — after that, user drags own the sizes array.
 */

export function weightsToSizes(weights: number[]): number[] {
  const total = weights.reduce((sum, w) => sum + w, 0) || 1;
  return weights.map((w) => (w / total) * 100);
}

const FULL_BASELINE_WEIGHT = 3;

export function insertPaneStackBelow(
  root: SplitNode | null,
  instanceId: string,
  span: PaneSpan,
): SplitNode {
  const leaf: SplitNode = { type: 'pane', instanceId };
  if (!root) return leaf;

  const newWeight = paneSpanWeight(span);

  if (root.type === 'split' && root.direction === 'col') {
    const existingSizes = root.sizes ?? weightsToSizes(root.children.map(() => FULL_BASELINE_WEIGHT));
    const newPercent = (newWeight / (newWeight + FULL_BASELINE_WEIGHT)) * 100;
    const scale = (100 - newPercent) / 100;
    const scaledSizes = existingSizes.map((size) => size * scale);
    return {
      ...root,
      children: [...root.children, leaf],
      sizes: [...scaledSizes, newPercent],
    };
  }

  const rootPercent = (FULL_BASELINE_WEIGHT / (FULL_BASELINE_WEIGHT + newWeight)) * 100;
  return {
    type: 'split',
    direction: 'col',
    children: [root, leaf],
    sizes: [rootPercent, 100 - rootPercent],
  };
}

/** Removes a pane leaf by instanceId; collapses any split left with a single child. */
export function removePaneFromTree(root: SplitNode | null, instanceId: string): SplitNode | null {
  if (!root) return null;
  if (root.type === 'pane') {
    return root.instanceId === instanceId ? null : root;
  }

  const nextChildren: SplitNode[] = [];
  const nextSizes: number[] = [];
  root.children.forEach((child, index) => {
    const next = removePaneFromTree(child, instanceId);
    if (next) {
      nextChildren.push(next);
      nextSizes.push(root.sizes?.[index] ?? 100 / root.children.length);
    }
  });

  if (nextChildren.length === 0) return null;
  if (nextChildren.length === 1) return nextChildren[0];
  return { ...root, children: nextChildren, sizes: weightsToSizes(nextSizes) };
}

export function listInstanceIds(root: SplitNode | null): string[] {
  if (!root) return [];
  if (root.type === 'pane') return [root.instanceId];
  return root.children.flatMap((child) => listInstanceIds(child));
}

export function updateSplitSizes(
  root: SplitNode | null,
  path: number[],
  sizes: number[],
): SplitNode | null {
  if (!root || root.type !== 'split') return root;
  if (path.length === 0) return { ...root, sizes };

  const [head, ...rest] = path;
  const nextChildren = root.children.map((child, index) =>
    index === head ? updateSplitSizes(child, rest, sizes) ?? child : child,
  );
  return { ...root, children: nextChildren };
}

export function isTreeEmpty(root: SplitNode | null): boolean {
  return root === null;
}

/** Mints fresh pane instances for every leaf in a Studio template, returning the live split tree + instance map. */
export function instantiateStudioTemplate(
  template: StudioSplitTemplate,
  featureId: ToolId,
): { root: SplitNode; paneInstances: Record<string, PaneInstance> } {
  const paneInstances: Record<string, PaneInstance> = {};

  function build(node: StudioSplitTemplate): SplitNode {
    if (node.type === 'pane') {
      const instanceId = createInstanceId(node.paneId);
      paneInstances[instanceId] = { instanceId, paneId: node.paneId, featureId };
      return { type: 'pane', instanceId };
    }
    return {
      type: 'split',
      direction: node.direction,
      sizes: node.sizes ? weightsToSizes(node.sizes) : undefined,
      children: node.children.map(build),
    };
  }

  return { root: build(template), paneInstances };
}
