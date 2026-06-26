'use client';

import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

type ToolbarItem = { icon: LucideIcon; label: string; shortcut?: string };

// @mock-start
const MOCK_ROW_ONE: ToolbarItem[] = [
  { icon: Bold, label: 'Bold', shortcut: '⌘B' },
  { icon: Italic, label: 'Italic', shortcut: '⌘I' },
  { icon: Underline, label: 'Underline', shortcut: '⌘U' },
  { icon: Strikethrough, label: 'Strikethrough', shortcut: '⌘⇧S' },
  { icon: Code, label: 'Code', shortcut: '⌘E' },
  { icon: LinkIcon, label: 'Insert link', shortcut: '⌘K' },
];

const MOCK_ROW_TWO: ToolbarItem[] = [
  { icon: AlignLeft, label: 'Align left' },
  { icon: AlignCenter, label: 'Align center' },
  { icon: AlignRight, label: 'Align right' },
];
// @mock-end

export interface ButtonIconOnlyTooltipProps {
  rowOne?: ReadonlyArray<ToolbarItem>;
  rowTwo?: ReadonlyArray<ToolbarItem>;
}

export function ButtonIconOnlyTooltip({
  rowOne = MOCK_ROW_ONE,
  rowTwo = MOCK_ROW_TWO,
}: ButtonIconOnlyTooltipProps = {}) {
  return (
    <TooltipProvider delay={150} closeDelay={50}>
      <div className="flex flex-col gap-6 px-8 py-10">
        <div className="space-y-3">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Inline editor controls
          </div>
          <div
            className="inline-flex items-center gap-1 rounded-lg border bg-[var(--card)] p-1"
            style={{ borderColor: 'var(--border)' }}
          >
            {rowOne.map(({ icon: Icon, label, shortcut }) => (
              <Tooltip key={label}>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label={label}>
                      <Icon />
                    </Button>
                  }
                />
                <TooltipPopup>
                  <span className="font-medium">{label}</span>
                  <span
                    className="ms-2 font-mono text-[10px]"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {shortcut}
                  </span>
                </TooltipPopup>
              </Tooltip>
            ))}
            <Separator orientation="vertical" className="mx-1 h-5" />
            {rowTwo.map(({ icon: Icon, label }) => (
              <Tooltip key={label}>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label={label}>
                      <Icon />
                    </Button>
                  }
                />
                <TooltipPopup>{label}</TooltipPopup>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Stand-alone icon buttons (hover for tooltip)
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {rowOne.slice(0, 4).map(({ icon: Icon, label }) => (
              <Tooltip key={label}>
                <TooltipTrigger
                  render={
                    <Button variant="outline" size="icon" aria-label={label}>
                      <Icon />
                    </Button>
                  }
                />
                <TooltipPopup>{label}</TooltipPopup>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
