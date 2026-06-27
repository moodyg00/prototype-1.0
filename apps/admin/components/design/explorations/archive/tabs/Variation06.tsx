'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

type RouteTab = {
  value: string;
  label: string;
  meta: string;
};

// @mock-start
const MOCK_TABS: RouteTab[] = [
  { value: 'general', label: 'General', meta: '/settings' },
  { value: 'team', label: 'Team', meta: '/settings/team' },
  { value: 'billing', label: 'Billing', meta: '/settings/billing' },
  { value: 'api', label: 'API & Webhooks', meta: '/settings/api' },
  { value: 'audit', label: 'Audit log', meta: '/settings/audit' },
];
const MOCK_DEFAULT_TAB = 'team';
const MOCK_PANEL_TEXT = 'Tabs that route — each one is a real subpage';
// @mock-end

export interface TabRouteStyleProps {
  tabs?: ReadonlyArray<RouteTab>;
  defaultTab?: string;
  panelText?: string;
}

export function TabRouteStyle({
  tabs = MOCK_TABS,
  defaultTab = MOCK_DEFAULT_TAB,
  panelText = MOCK_PANEL_TEXT,
}: TabRouteStyleProps) {
  const [active, setActive] = useState(defaultTab);

  return (
    <div className="px-6 py-6">
      <div className="flex flex-wrap items-center gap-1" role="tablist">
        {tabs.map((t) => {
          const isActive = active === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.value)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm transition-colors"
              style={{
                background: isActive ? 'var(--card)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: isActive ? 500 : 400,
              }}
            >
              <span>{t.label}</span>
              <ChevronRight
                className="size-3"
                style={{
                  color: isActive ? 'var(--muted-foreground)' : 'color-mix(in srgb, var(--muted-foreground) 50%, transparent)',
                }}
              />
            </button>
          );
        })}
      </div>

      <div
        className="mt-4 flex items-center justify-between rounded-lg border px-4 py-6 text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
      >
        <span>{panelText}</span>
        <span className="font-mono text-xs">{tabs.find((t) => t.value === active)?.meta}</span>
      </div>
    </div>
  );
}
