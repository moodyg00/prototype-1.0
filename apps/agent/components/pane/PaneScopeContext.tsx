'use client';

import React, { createContext, useContext, useMemo } from 'react';

import type { PanePlacement } from '@/lib/pane-types';
import type { ToolId } from '@/lib/tools';

export interface PaneScopeValue {
  scopeId: string;
  studioInstanceId?: string;
  featureId: ToolId;
  paneId: string;
  instanceId: string;
  placement: PanePlacement;
}

const PaneScopeContext = createContext<PaneScopeValue | null>(null);

export function PaneScopeProvider({
  value,
  children,
}: {
  value: PaneScopeValue;
  children: React.ReactNode;
}) {
  const memo = useMemo(() => value, [value]);
  return <PaneScopeContext.Provider value={memo}>{children}</PaneScopeContext.Provider>;
}

export function usePaneScope(): PaneScopeValue {
  const ctx = useContext(PaneScopeContext);
  if (!ctx) throw new Error('usePaneScope must be used within PaneScopeProvider');
  return ctx;
}

export function usePaneScopeOptional(): PaneScopeValue | null {
  return useContext(PaneScopeContext);
}

/** Build a stable scope id for panes not inside a studio window. */
export function standalonePaneScopeId(instanceId: string, placement: PanePlacement): string {
  if (placement === 'window') return `pane-window:${instanceId}`;
  return `panel-pane:${instanceId}`;
}
