'use client';

import { useState } from 'react';
import { Layers, Users, Wallet, Boxes } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type CardTab = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

// @mock-start
const MOCK_TABS: CardTab[] = [
  {
    value: 'workspace',
    label: 'Workspace',
    description: 'Branding, defaults, locale',
    icon: Layers,
  },
  {
    value: 'members',
    label: 'Members',
    description: '12 people · 3 invitations',
    icon: Users,
  },
  {
    value: 'billing',
    label: 'Billing',
    description: 'Pro plan · renews May 30',
    icon: Wallet,
  },
  {
    value: 'integrations',
    label: 'Integrations',
    description: '6 connected · all healthy',
    icon: Boxes,
  },
];
const MOCK_DEFAULT_TAB = 'members';
// @mock-end

export interface TabCardsWithDescriptionProps {
  tabs?: ReadonlyArray<CardTab>;
  defaultTab?: string;
}

export function TabCardsWithDescription({
  tabs = MOCK_TABS,
  defaultTab = MOCK_DEFAULT_TAB,
}: TabCardsWithDescriptionProps) {
  const [active, setActive] = useState(defaultTab);

  return (
    <div className="px-6 py-6">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {tabs.map((t) => {
          const isActive = active === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setActive(t.value)}
              className="group flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition-all"
              style={{
                background: isActive ? 'var(--primary-soft)' : 'var(--card)',
                borderColor: isActive
                  ? 'color-mix(in srgb, var(--primary) 36%, var(--border))'
                  : 'var(--border)',
              }}
            >
              <div
                className="grid size-8 place-items-center rounded-lg"
                style={{
                  background: isActive
                    ? 'color-mix(in srgb, var(--primary) 16%, transparent)'
                    : 'var(--muted)',
                  color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
              >
                <t.icon className="size-4" />
              </div>
              <div className="leading-tight">
                <div
                  className="font-semibold tracking-tight text-sm"
                  style={{ color: isActive ? 'var(--primary)' : 'var(--foreground)' }}
                >
                  {t.label}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  {t.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="mt-4 rounded-lg border px-5 py-6 text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
      >
        {tabs.find((t) => t.value === active)?.label} settings panel
      </div>
    </div>
  );
}
