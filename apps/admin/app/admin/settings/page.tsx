'use client';

/**
 * Settings page - now uses stacked COSS-style accordions for all screen sizes (mobile friendly, no left frame).
 */

import React, { useState } from 'react';
import { ThemingPanel } from '../../../src/components/settings/ThemingPanel';
import { SettingsCategoryPanel } from '../../../src/components/settings/SettingsCategoryPanel';
import { EmailProviderPanel } from '../../../src/components/settings/EmailProviderPanel';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

type TabId = 'theming' | 'business' | 'operations' | 'customer_relations' | 'user_preferences' | 'email' | 'advanced';

interface Tab {
  id: TabId;
  label: string;
  description: string;
  modules?: string[];
}

const TABS: Tab[] = [
  {
    id: 'theming',
    label: 'Theming',
    description: 'Main color scheme and pill / badge palettes.',
  },
  {
    id: 'business',
    label: 'Business',
    description: 'Brand, payment terms, document defaults, accounting defaults.',
    modules: ['business', 'accounting'],
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Scheduling, dispatch, work-order defaults.',
    modules: ['operations'],
  },
  {
    id: 'customer_relations',
    label: 'Customer Relations',
    description: 'CRM and customer-facing defaults.',
    modules: ['crm', 'customer_relations'],
  },
  {
    id: 'user_preferences',
    label: 'User Preferences',
    description: 'Per-user UI preferences (rows per page, default filters, etc).',
    modules: ['ui_preferences', 'user_preferences'],
  },
  {
    id: 'email',
    label: 'Email Provider',
    description: 'Outbound mail provider, sender identity, and credentials.',
    modules: ['email'],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Raw key/value editor for every settings row, mirroring Proto-1.',
  },
];

export default function SettingsPage() {
  const [active, setActive] = useState<TabId | null>('theming');

  const toggleTab = (id: TabId) => {
    setActive(active === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <Badge variant="outline">Administration</Badge>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Configure brand, modules, and theming. Mirrors Proto-1 Filament <code>SettingResource</code>.
        </p>
      </header>

      <div className="space-y-3">
        {TABS.map((tab) => {
          const isOpen = active === tab.id;
          return (
            <Card key={tab.id} className="overflow-hidden">
              <Button
                onClick={() => toggleTab(tab.id)}
                variant="ghost"
                className="h-auto w-full justify-between rounded-none px-5 py-4 text-left"
                style={{
                  background: isOpen ? 'var(--primary-soft)' : 'var(--card)',
                  color: isOpen ? 'var(--primary)' : 'var(--foreground)',
                }}
              >
                <div>
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{tab.description}</div>
                </div>
                <div className="text-xl font-light">{isOpen ? '−' : '+'}</div>
              </Button>

              {isOpen && (
                <div className="p-6 border-t" style={{ borderColor: 'var(--border)' }}>
                  {tab.id === 'theming' && <ThemingPanel />}
                  {tab.id === 'email' && <EmailProviderPanel />}
                  {tab.id !== 'theming' && tab.id !== 'email' && tab.id !== 'advanced' && (
                    <SettingsCategoryPanel
                      title={tab.label}
                      description={tab.description}
                      modules={tab.modules ?? []}
                    />
                  )}
                  {tab.id === 'advanced' && (
                    <SettingsCategoryPanel
                      title="Advanced (all settings)"
                      description="Raw module/key/value editor. Equivalent to Proto-1's SettingResource list view."
                      modules={['business', 'accounting', 'operations', 'crm', 'customer_relations', 'ui_preferences', 'user_preferences', 'email', 'system']}
                    />
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
