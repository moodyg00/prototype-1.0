'use client';

import React, { Fragment } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { PaneHost } from '@/components/pane/PaneHost';
import type { PaneInstance, PanePlacement, SplitNode } from '@/lib/pane-types';

interface PaneLayoutHostProps {
  root: SplitNode | null;
  instances: Record<string, PaneInstance>;
  placement: PanePlacement;
  studioInstanceId?: string;
  scopeId?: string;
  emptyState?: React.ReactNode;
  onClosePane: (instanceId: string) => void;
  onDetachPane?: (instanceId: string, screenX: number, screenY: number) => void;
  onLayout?: (path: number[], sizes: number[]) => void;
  showChrome?: boolean;
}

function SplitNodeRenderer({
  node,
  path,
  ...rest
}: {
  node: SplitNode;
  path: number[];
} & Omit<PaneLayoutHostProps, 'root' | 'emptyState'>) {
  const { instances, placement, studioInstanceId, scopeId, onClosePane, onDetachPane, onLayout, showChrome } = rest;

  if (node.type === 'pane') {
    const instance = instances[node.instanceId];
    if (!instance) return null;
    return (
      <PaneHost
        instance={instance}
        placement={placement}
        studioInstanceId={studioInstanceId}
        scopeId={scopeId}
        showChrome={showChrome}
        onClose={() => onClosePane(node.instanceId)}
        onDetach={
          onDetachPane ? (x, y) => onDetachPane(node.instanceId, x, y) : undefined
        }
      />
    );
  }

  const direction = node.direction === 'col' ? 'vertical' : 'horizontal';
  const sizes = node.sizes ?? node.children.map(() => 100 / node.children.length);

  return (
    <PanelGroup
      direction={direction}
      onLayout={onLayout ? (nextSizes: number[]) => onLayout(path, nextSizes) : undefined}
    >
      {node.children.map((child, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <PanelResizeHandle
              className={
                direction === 'vertical'
                  ? 'h-[3px] shrink-0 bg-white/5 transition hover:bg-violet-500/50 data-[resize-handle-state=drag]:bg-violet-500/70'
                  : 'w-[3px] shrink-0 bg-white/5 transition hover:bg-violet-500/50 data-[resize-handle-state=drag]:bg-violet-500/70'
              }
            />
          ) : null}
          <Panel defaultSize={sizes[index]} minSize={10}>
            <SplitNodeRenderer node={child} path={[...path, index]} {...rest} />
          </Panel>
        </Fragment>
      ))}
    </PanelGroup>
  );
}

/** Renders a Pane split tree — used inside both Panel slots and Studio windows. */
export function PaneLayoutHost({ root, emptyState, ...rest }: PaneLayoutHostProps) {
  if (!root) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6 text-center text-xs text-zinc-600">
        {emptyState ?? 'Empty. Use + to add a pane.'}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <SplitNodeRenderer node={root} path={[]} {...rest} />
    </div>
  );
}
