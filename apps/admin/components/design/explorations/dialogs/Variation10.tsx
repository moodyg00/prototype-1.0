import { Plus, FileText, User, Calendar, Sparkles, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';

type Action = { icon: LucideIcon; label: string; shortcut: string };

// @mock-start
const MOCK_ACTIONS: Action[] = [
  { icon: FileText, label: 'New work order', shortcut: 'W' },
  { icon: User, label: 'Add contact', shortcut: 'C' },
  { icon: Calendar, label: 'Schedule visit', shortcut: 'V' },
  { icon: Sparkles, label: 'Ask agent to draft...', shortcut: 'A' },
];
// @mock-end

export interface DialogCompactPopoverProps {
  actions?: ReadonlyArray<Action>;
}

export function DialogCompactPopover({ actions = MOCK_ACTIONS }: DialogCompactPopoverProps) {
  return (
    <div
      className="relative flex h-[360px] flex-col px-8 py-10"
      style={{ background: 'var(--background)' }}
    >
      <div className="flex items-start gap-3">
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Create new
          <ChevronDown className="size-3.5 opacity-72" />
        </Button>
      </div>

      <div
        className="mt-2 ms-0 w-72 overflow-hidden rounded-lg border shadow-lg"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div
          className="px-3 py-2 text-[10px] uppercase tracking-[0.18em]"
          style={{
            color: 'var(--muted-foreground)',
            background: 'color-mix(in srgb, var(--muted) 60%, var(--card) 40%)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          Quick actions
        </div>
        <ul className="p-1">
          {actions.map(({ icon: Icon, label, shortcut }, i) => (
            <li
              key={label}
              className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm"
              style={{
                background: i === 0 ? 'var(--primary-soft)' : 'transparent',
                color: i === 0 ? 'var(--primary)' : 'var(--foreground)',
              }}
            >
              <Icon className="size-4 opacity-80" />
              <span className="flex-1">{label}</span>
              <Kbd>{shortcut}</Kbd>
            </li>
          ))}
        </ul>
        <div
          className="flex items-center justify-between border-t px-3 py-2 text-[11px]"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <span>Workspace shortcuts</span>
          <span>
            <Kbd>⌘</Kbd>
            <span className="mx-1">+</span>
            <Kbd>N</Kbd>
          </span>
        </div>
      </div>

      <div
        className="mt-auto pt-6 text-xs"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Anchored to the &ldquo;Create new&rdquo; trigger above &mdash; reads as a popover, behaves
        like a small dialog.
      </div>
    </div>
  );
}
