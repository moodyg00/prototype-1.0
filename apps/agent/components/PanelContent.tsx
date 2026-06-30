'use client';

import { BrowserPanel } from '@/components/panels/BrowserPanel';
import { PlaceholderPanel } from '@/components/panels/PlaceholderPanel';
import { RunnerPanel } from '@/components/panels/RunnerPanel';
import { RunsPanel } from '@/components/panels/RunsPanel';
import { TeamPanel } from '@/components/panels/TeamPanel';
import { WorkflowPanel } from '@/components/panels/WorkflowPanel';
import { getRegisteredToolView } from '@/lib/tool-views';
import type { ToolRenderContext } from '@/lib/tool-surfaces';
import { getTool, type ToolId } from '@/lib/tools';

function LegacyToolView({ toolId }: { toolId: ToolId }) {
  if (toolId === 'team') return <TeamPanel />;
  if (toolId === 'workflow') return <WorkflowPanel />;
  if (toolId === 'runner') return <RunnerPanel />;
  if (toolId === 'runs') return <RunsPanel />;
  if (toolId === 'browser') return <BrowserPanel defaultMode="visual" />;
  if (toolId === 'pure-browser') return <BrowserPanel defaultMode="headless" />;
  if (toolId === 'visual-browser') return <BrowserPanel defaultMode="visual" />;
  const tool = getTool(toolId);
  return <PlaceholderPanel tool={tool} />;
}

export function ToolView({
  toolId,
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const RegisteredView = getRegisteredToolView(toolId, context.surface);
  if (RegisteredView) {
    return <RegisteredView toolId={toolId} context={context} />;
  }
  return <LegacyToolView toolId={toolId} />;
}

/** @deprecated Use ToolView with ToolViewHost instead */
export function PanelContent({ toolId }: { toolId: ToolId }) {
  return (
    <ToolView
      toolId={toolId}
      context={{
        surface: 'container',
        toolId,
        bounds: { width: 0, height: 0 },
      }}
    />
  );
}