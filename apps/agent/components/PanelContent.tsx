'use client';

import { BrowserPanel } from '@/components/panels/BrowserPanel';
import { LangSmithPanel } from '@/components/panels/LangSmithPanel';
import { PlaceholderPanel } from '@/components/panels/PlaceholderPanel';
import { PureBrowserPanel } from '@/components/panels/PureBrowserPanel';
import { TeamPanel } from '@/components/panels/TeamPanel';
import { WorkflowPanel } from '@/components/panels/WorkflowPanel';
import { getTool, type ToolId } from '@/lib/tools';

export function PanelContent({ toolId }: { toolId: ToolId }) {
  if (toolId === 'team') return <TeamPanel />;
  if (toolId === 'workflow') return <WorkflowPanel />;
  if (toolId === 'langsmith') return <LangSmithPanel />;
  if (toolId === 'pure-browser') return <PureBrowserPanel />;
  if (toolId === 'visual-browser') return <BrowserPanel />;
  const tool = getTool(toolId);
  return <PlaceholderPanel tool={tool} />;
}