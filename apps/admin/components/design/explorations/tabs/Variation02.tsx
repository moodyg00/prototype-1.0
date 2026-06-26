'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';

type TabItem = {
  value: string;
  label: string;
};

// @mock-start
const MOCK_TABS: TabItem[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
];
const MOCK_DEFAULT_TAB = 'week';
// @mock-end

export interface TabPillSegmentedProps {
  tabs?: ReadonlyArray<TabItem>;
  defaultTab?: string;
}

export function TabPillSegmented({
  tabs = MOCK_TABS,
  defaultTab = MOCK_DEFAULT_TAB,
}: TabPillSegmentedProps) {
  return (
    <div className="px-6 py-6">
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTab key={t.value} value={t.value}>
              {t.label}
            </TabsTab>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsPanel key={t.value} value={t.value} className="pt-4">
            <div
              className="rounded-lg border px-4 py-6 text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {t.label} panel content
            </div>
          </TabsPanel>
        ))}
      </Tabs>
    </div>
  );
}
