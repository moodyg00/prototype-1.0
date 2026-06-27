'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs';

type TabItem = {
  value: string;
  label: string;
};

// @mock-start
const MOCK_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'documents', label: 'Documents' },
  { value: 'activity', label: 'Activity' },
];
const MOCK_TITLE = 'Stonebridge Plumbing Co.';
const MOCK_META = 'Customer record · 14 jobs · $48,200 lifetime value';
const MOCK_ACTION_LABEL = 'New job';
const MOCK_DEFAULT_TAB = 'overview';
// @mock-end

export interface PageHeaderWithTabsProps {
  tabs?: ReadonlyArray<TabItem>;
  title?: string;
  meta?: string;
  actionLabel?: string;
  defaultTab?: string;
}

export function PageHeaderWithTabs({
  tabs = MOCK_TABS,
  title = MOCK_TITLE,
  meta = MOCK_META,
  actionLabel = MOCK_ACTION_LABEL,
  defaultTab = MOCK_DEFAULT_TAB,
}: PageHeaderWithTabsProps) {
  return (
    <header className="flex flex-col" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-end justify-between gap-3 px-6 pt-6 pb-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {meta}
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          {actionLabel}
        </Button>
      </div>

      <div className="px-4">
        <Tabs defaultValue={defaultTab}>
          <TabsList variant="underline">
            {tabs.map((t) => (
              <TabsTab key={t.value} value={t.value}>
                {t.label}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}
