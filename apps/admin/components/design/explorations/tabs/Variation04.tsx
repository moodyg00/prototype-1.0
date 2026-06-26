'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import { User, Lock, Bell, CreditCard, Plug } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type VerticalTab = {
  value: string;
  label: string;
  icon: LucideIcon;
  hint: string;
};

// @mock-start
const MOCK_TABS: VerticalTab[] = [
  { value: 'profile', label: 'Profile', icon: User, hint: 'Your personal info' },
  { value: 'security', label: 'Security', icon: Lock, hint: 'Password, 2FA, sessions' },
  { value: 'notifications', label: 'Notifications', icon: Bell, hint: 'Email, push, digest' },
  { value: 'billing', label: 'Billing', icon: CreditCard, hint: 'Plan, invoices, cards' },
  { value: 'integrations', label: 'Integrations', icon: Plug, hint: 'Connected apps' },
];
const MOCK_DEFAULT_TAB = 'security';
// @mock-end

export interface TabVerticalStackProps {
  tabs?: ReadonlyArray<VerticalTab>;
  defaultTab?: string;
}

export function TabVerticalStack({
  tabs = MOCK_TABS,
  defaultTab = MOCK_DEFAULT_TAB,
}: TabVerticalStackProps) {
  return (
    <div className="px-6 py-6">
      <Tabs orientation="vertical" defaultValue={defaultTab} className="gap-6">
        <TabsList variant="underline" className="w-56 shrink-0">
          {tabs.map((t) => (
            <TabsTab key={t.value} value={t.value} className="h-auto py-2 text-start">
              <div className="flex items-start gap-2.5">
                <t.icon className="mt-0.5 size-4" />
                <div className="leading-tight">
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    {t.hint}
                  </div>
                </div>
              </div>
            </TabsTab>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsPanel key={t.value} value={t.value}>
            <div
              className="min-h-48 rounded-lg border px-5 py-6 text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {t.label} settings panel
            </div>
          </TabsPanel>
        ))}
      </Tabs>
    </div>
  );
}
