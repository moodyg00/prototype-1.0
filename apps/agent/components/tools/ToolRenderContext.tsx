'use client';

import React, { createContext, useContext } from 'react';
import type { ToolRenderContext } from '@/lib/tool-surfaces';

const ToolRenderContextReact = createContext<ToolRenderContext | null>(null);

export function ToolRenderContextProvider({
  value,
  children,
}: {
  value: ToolRenderContext;
  children: React.ReactNode;
}) {
  return (
    <ToolRenderContextReact.Provider value={value}>{children}</ToolRenderContextReact.Provider>
  );
}

export function useToolRenderContext(): ToolRenderContext {
  const value = useContext(ToolRenderContextReact);
  if (!value) {
    throw new Error('useToolRenderContext must be used within ToolRenderContextProvider');
  }
  return value;
}