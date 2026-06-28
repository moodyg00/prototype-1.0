'use client';

import { AgentHeader } from '@/components/shell/AgentHeader';
import { ViewportShell } from '@/components/workspace/ViewportShell';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';

export function AgentShell() {
  return (
    <WorkspaceProvider headerHeight={56}>
      <div className="app-shell">
        <AgentHeader />
        <ViewportShell />
      </div>
    </WorkspaceProvider>
  );
}