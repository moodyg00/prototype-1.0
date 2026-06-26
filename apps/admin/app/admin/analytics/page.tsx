'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

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

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Marketing Analytics</h1>
        <p className="max-w-3xl text-sm" style={{ color: 'var(--muted-foreground)' }}>
          A quick reference view for current ads, campaign performance, and recent social output. Read-only by design.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {PANELS.map((panel, index) => (
          <Card key={panel.title} className="rounded-3xl border shadow-xs/10">
            <CardHeader>
              <div
                className="mb-3 h-1.5 w-16 rounded-full"
                style={{
                  background:
                    index % 4 === 0
                      ? '#be185d'
                      : index % 4 === 1
                        ? '#7c3aed'
                        : index % 4 === 2
                          ? '#0891b2'
                          : '#d97706',
                }}
              />
              <CardTitle>{panel.title}</CardTitle>
              <CardDescription>Reference-only summary for the human admin layer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {panel.items.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    background: 'color-mix(in srgb, var(--card) 88%, var(--background) 12%)',
                    borderColor: 'color-mix(in srgb, var(--border) 78%, transparent 22%)',
                  }}
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}