'use client';

import { useState } from 'react';

type TabItem = {
  value: string;
  label: string;
};

// @mock-start
const MOCK_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'team', label: 'Team' },
  { value: 'billing', label: 'Billing' },
  { value: 'audit', label: 'Audit log' },
];
const MOCK_DEFAULT_TAB = 'overview';
const MOCK_PANEL_TEXT =
  'Connected card-tab style — the active tab feels like the same surface as the panel below.';
// @mock-end

export interface TabConnectedCardsProps {
  tabs?: ReadonlyArray<TabItem>;
  defaultTab?: string;
  panelText?: string;
}

export function TabConnectedCards({
  tabs = MOCK_TABS,
  defaultTab = MOCK_DEFAULT_TAB,
  panelText = MOCK_PANEL_TEXT,
}: TabConnectedCardsProps) {
  const [active, setActive] = useState(defaultTab);

  return (
    <div className="px-6 pt-6">
      <div className="flex items-end gap-1">
        {tabs.map((t) => {
          const isActive = active === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setActive(t.value)}
              className="relative -mb-px flex h-9 items-center rounded-t-lg border px-4 text-sm transition-colors"
              style={{
                background: isActive ? 'var(--card)' : 'transparent',
                borderColor: isActive ? 'var(--border)' : 'transparent',
                borderBottomColor: isActive ? 'var(--card)' : 'transparent',
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div
        className="rounded-b-lg rounded-tr-lg border px-5 py-6 text-sm"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          color: 'var(--muted-foreground)',
        }}
      >
        {panelText}
      </div>
    </div>
  );
}
