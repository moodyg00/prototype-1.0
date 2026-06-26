'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';

type TabItem = {
  value: string;
  label: string;
};

// @mock-start
const MOCK_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'documents', label: 'Documents' },
  { value: 'settings', label: 'Settings' },
];
const MOCK_DEFAULT_TAB = 'overview';
// @mock-end

export interface TabClassicUnderlineProps {
  tabs?: ReadonlyArray<TabItem>;
  defaultTab?: string;
}

export function TabClassicUnderline({
  tabs = MOCK_TABS,
  defaultTab = MOCK_DEFAULT_TAB,
}: TabClassicUnderlineProps) {
  return (
    <div className="px-6 py-6">
      <Tabs defaultValue={defaultTab}>
        <TabsList variant="underline" className="w-full justify-start border-b">
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
