'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
const MOCK_HINT = 'Resize the preview to ~mobile width to see the dropdown variant.';
// @mock-end

export interface TabResponsiveDropdownProps {
  tabs?: ReadonlyArray<TabItem>;
  defaultTab?: string;
  hint?: string;
}

export function TabResponsiveDropdown({
  tabs = MOCK_TABS,
  defaultTab = MOCK_DEFAULT_TAB,
  hint = MOCK_HINT,
}: TabResponsiveDropdownProps) {
  const [value, setValue] = useState(defaultTab);

  return (
    <div className="px-6 py-6">
      <div className="block sm:hidden">
        <Select value={value} onValueChange={(v) => setValue(v as string)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {tabs.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      <div className="hidden sm:block">
        <Tabs value={value} onValueChange={(v) => setValue(v as string)}>
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

      <div
        className="mt-3 text-[11px]"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {hint}
      </div>
    </div>
  );
}
