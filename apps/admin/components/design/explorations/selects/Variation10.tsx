'use client';

import {
  Search,
  Plus,
  Users,
  Briefcase,
  CreditCard,
  Settings,
  Sparkles,
  CornerDownLeft,
  ArrowDown,
  ArrowUp,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';

type CommandItem = { label: string; icon: LucideIcon; shortcut?: string };
type CommandRow = { group: string; items: CommandItem[] };

// @mock-start
const MOCK_ROWS: CommandRow[] = [
  {
    group: 'Quick actions',
    items: [
      { label: 'Create work order', icon: Plus, shortcut: '⌘N' },
      { label: 'Add contact', icon: Users },
      { label: 'New invoice', icon: CreditCard },
    ],
  },
  {
    group: 'Navigate',
    items: [
      { label: 'Operations', icon: Briefcase, shortcut: 'G then O' },
      { label: 'Clients', icon: Users, shortcut: 'G then C' },
      { label: 'Settings', icon: Settings, shortcut: 'G then S' },
    ],
  },
  {
    group: 'Ask the agent',
    items: [
      { label: 'Summarize today\u2019s work orders', icon: Sparkles },
      { label: 'Find overdue invoices', icon: Sparkles },
    ],
  },
];
// @mock-end

export interface SelectCommandPaletteProps {
  rows?: ReadonlyArray<CommandRow>;
}

export function SelectCommandPalette({
  rows = MOCK_ROWS,
}: SelectCommandPaletteProps = {}) {
  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <Field>
        <FieldLabel>Trigger</FieldLabel>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <span className="flex items-center gap-2">
            <Search className="size-4" />
            Run a command…
          </span>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
        <FieldDescription>
          A trigger that opens a command-palette dialog combobox.
        </FieldDescription>
      </Field>

      <div className="space-y-2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Open dialog preview
        </div>
        <div
          className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border bg-popover not-dark:bg-clip-padding shadow-lg/5"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center gap-2 border-b px-4 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <Search
              className="size-4"
              style={{ color: 'var(--muted-foreground)' }}
            />
            <input
              defaultValue=""
              placeholder="Type a command or search…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--muted-foreground)]"
              aria-label="Search"
            />
            <Kbd>esc</Kbd>
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {rows.map((row) => (
              <div key={row.group} className="mb-1">
                <div
                  className="px-2 py-1.5 font-medium text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {row.group}
                </div>
                {row.items.map((item, idx) => {
                  const Icon = item.icon;
                  const active =
                    row.group === 'Quick actions' && idx === 0;
                  return (
                    <div
                      key={item.label}
                      className="flex min-h-9 items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                      style={{
                        background: active ? 'var(--muted)' : undefined,
                      }}
                    >
                      <Icon
                        className="size-4 opacity-80"
                        style={{ color: 'var(--muted-foreground)' }}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <span
                          className="font-mono text-[11px]"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div
            className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-xs"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Kbd>
                  <ArrowUp className="size-3" />
                </Kbd>
                <Kbd>
                  <ArrowDown className="size-3" />
                </Kbd>
                Navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>
                  <CornerDownLeft className="size-3" />
                </Kbd>
                Open
              </span>
            </div>
            <span>
              Press
              <Kbd className="mx-1.5">⌘</Kbd>
              <Kbd>K</Kbd>
              to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
