'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import { Search, ListFilter, ArrowUpDown, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

type CountedTab = {
  value: string;
  label: string;
  count: number;
};

// @mock-start
const MOCK_TABS: CountedTab[] = [
  { value: 'open', label: 'Open', count: 18 },
  { value: 'in-progress', label: 'In progress', count: 7 },
  { value: 'review', label: 'In review', count: 3 },
  { value: 'closed', label: 'Closed', count: 124 },
];
const MOCK_DEFAULT_TAB = 'open';
const MOCK_SEARCH_PLACEHOLDER = 'Search records...';
// @mock-end

export interface TabWithToolbarProps {
  tabs?: ReadonlyArray<CountedTab>;
  defaultTab?: string;
  searchPlaceholder?: string;
}

export function TabWithToolbar({
  tabs = MOCK_TABS,
  defaultTab = MOCK_DEFAULT_TAB,
  searchPlaceholder = MOCK_SEARCH_PLACEHOLDER,
}: TabWithToolbarProps) {
  return (
    <div className="px-4 pt-4">
      <Tabs defaultValue={defaultTab}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList variant="underline">
            {tabs.map((t) => (
              <TabsTab key={t.value} value={t.value}>
                <span>{t.label}</span>
                <span
                  className="ms-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-medium tabular-nums"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  {t.count}
                </span>
              </TabsTab>
            ))}
          </TabsList>

          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-3.5" />
              New
            </Button>
          </div>
        </div>

        <div
          className="mt-2 flex flex-wrap items-center gap-2 py-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="w-56">
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput placeholder={searchPlaceholder} />
            </InputGroup>
          </div>

          <Separator orientation="vertical" className="h-5" />

          <Button variant="ghost" size="sm" className="gap-1.5">
            <ListFilter className="size-3.5" />
            Filter
            <ChevronDown className="size-3 opacity-60" />
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowUpDown className="size-3.5" />
            Sort
            <ChevronDown className="size-3 opacity-60" />
          </Button>
        </div>

        {tabs.map((t) => (
          <TabsPanel key={t.value} value={t.value} className="pt-2 pb-4">
            <div
              className="rounded-lg border px-4 py-6 text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {t.count} {t.label.toLowerCase()} records
            </div>
          </TabsPanel>
        ))}
      </Tabs>
    </div>
  );
}
