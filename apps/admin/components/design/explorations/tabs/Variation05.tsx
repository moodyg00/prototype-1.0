'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import { Inbox, AlertCircle, CheckCircle2, Archive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type IconCountTab = {
  value: string;
  label: string;
  icon: LucideIcon;
  count?: number;
};

// @mock-start
const MOCK_TABS: IconCountTab[] = [
  { value: 'all', label: 'All', icon: Inbox, count: 124 },
  { value: 'open', label: 'Open', icon: AlertCircle, count: 18 },
  { value: 'resolved', label: 'Resolved', icon: CheckCircle2, count: 92 },
  { value: 'archived', label: 'Archived', icon: Archive },
];
const MOCK_DEFAULT_TAB = 'open';
// @mock-end

export interface TabIconCountProps {
  tabs?: ReadonlyArray<IconCountTab>;
  defaultTab?: string;
}

export function TabIconCount({
  tabs = MOCK_TABS,
  defaultTab = MOCK_DEFAULT_TAB,
}: TabIconCountProps) {
  return (
    <div className="px-6 py-6">
      <Tabs defaultValue={defaultTab}>
        <TabsList variant="underline">
          {tabs.map((t) => (
            <TabsTab key={t.value} value={t.value}>
              <t.icon />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className="ms-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-medium tabular-nums"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  {t.count}
                </span>
              )}
            </TabsTab>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsPanel key={t.value} value={t.value} className="pt-4">
            <div
              className="rounded-lg border px-4 py-6 text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {t.label} list
            </div>
          </TabsPanel>
        ))}
      </Tabs>
    </div>
  );
}
