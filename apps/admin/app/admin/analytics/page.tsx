'use client';

import React from 'react';

import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';

const PANELS = [
  {
    title: 'Ads running now',
    items: ['8 active ads across 3 channels', '2 campaigns pacing above target', '1 creative flagged for refresh'],
  },
  {
    title: 'Campaign performance',
    items: ['Meta retargeting leads CTR at 4.8%', 'Local awareness spend is 18% under budget', 'Referral promo drove 14 assisted conversions'],
  },
  {
    title: 'Recent social activity',
    items: ['11 social posts in the last 14 days', 'Best recent post: before/after project reel', '2 scheduled posts pending review in Business Lab'],
  },
  {
    title: 'Attention items',
    items: ['One campaign ends in 48 hours', 'Budget cap hit on 2 ad sets', 'Analytics export due for weekly review'],
  },
];

const ACCENTS = ['#be185d', '#7c3aed', '#0891b2', '#d97706'];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 admin-stagger">
      <AdminPageHeader
        eyebrow="Marketing"
        title="Marketing Analytics"
        description="A quick reference view for current ads, campaign performance, and recent social output. Read-only by design."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {PANELS.map((panel, index) => (
          <section key={panel.title} className="admin-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: ACCENTS[index % ACCENTS.length] }}
                aria-hidden
              />
              <h2 className="font-display text-base font-medium tracking-tight">{panel.title}</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Reference-only summary for the human admin layer.
            </p>
            <ul className="space-y-3 border-t border-border/35 pt-4">
              {panel.items.map((item) => (
                <li key={item} className="text-sm leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}