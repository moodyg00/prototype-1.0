'use client';

import { useState } from 'react';

type TabItem = {
  value: string;
  label: string;
};

// @mock-start
const MOCK_TABS: TabItem[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Assigned to me' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'archived', label: 'Archived' },
];
const MOCK_DEFAULT_TAB = 'mine';
const MOCK_PANEL_TEXT = 'Minimalist text-only tabs with a moving dot indicator.';
// @mock-end

export interface TabMinimalDotProps {
  tabs?: ReadonlyArray<TabItem>;
  defaultTab?: string;
  panelText?: string;
}

export function TabMinimalDot({
  tabs = MOCK_TABS,
  defaultTab = MOCK_DEFAULT_TAB,
  panelText = MOCK_PANEL_TEXT,
}: TabMinimalDotProps) {
  const [active, setActive] = useState(defaultTab);

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-1" role="tablist">
        {tabs.map((t) => {
          const isActive = active === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.value)}
              className="relative h-8 px-3 text-sm transition-colors"
              style={{
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: isActive ? 500 : 400,
              }}
            >
              <span>{t.label}</span>
              <span
                aria-hidden
                className="absolute bottom-0 left-1/2 h-1 -translate-x-1/2 rounded-full transition-[width,opacity] duration-200"
                style={{
                  width: isActive ? '20px' : '0px',
                  opacity: isActive ? 1 : 0,
                  background: 'var(--primary)',
                }}
              />
            </button>
          );
        })}
      </div>

      <div
        className="mt-6 rounded-lg border px-4 py-6 text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
      >
        {panelText}
      </div>
    </div>
  );
}
