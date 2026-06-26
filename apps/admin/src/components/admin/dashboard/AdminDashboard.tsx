'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminDashboardKpis } from '@/src/lib/admin/dashboard-kpi-types';

type Props = {
  dashboardKpis: AdminDashboardKpis;
};

export function AdminDashboard({ dashboardKpis }: Props): React.ReactElement {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2 max-w-3xl">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.22em]"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 22%, var(--border) 78%)',
              color: 'var(--muted-foreground)',
              background: 'color-mix(in srgb, var(--card) 86%, var(--primary-soft) 14%)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Admin Home
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Quick reference across the business</h1>
          <p className="max-w-2xl text-sm sm:text-base" style={{ color: 'var(--muted-foreground)' }}>
            Business Lab is where human admins will spend most of their time. This page stays lightweight and useful at a glance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" className="min-w-[220px] justify-between rounded-2xl px-4">
            <span>Enter Business Lab</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 2xl:grid-cols-5">
        {dashboardKpis.groups.map((group) => (
          <Card
            key={group.name}
            className="overflow-hidden border shadow-xs/10"
            style={{
              background: 'color-mix(in srgb, var(--card) 94%, white 6%)',
              borderColor: 'color-mix(in srgb, var(--border) 82%, transparent 18%)',
            }}
          >
            <CardHeader className="pb-4">
              <div
                className="mb-3 h-1.5 w-14 rounded-full"
                style={{ background: `color-mix(in srgb, ${group.color} 76%, white 24%)` }}
              />
              <CardTitle className="text-lg">{group.name}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {group.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border px-4 py-3"
                  style={{
                    background: 'color-mix(in srgb, var(--card) 88%, var(--background) 12%)',
                    borderColor: 'color-mix(in srgb, var(--border) 72%, transparent 28%)',
                  }}
                >
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--muted-foreground)' }}>
                    {metric.label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold leading-none">{metric.value}</div>
                  <div className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {metric.note}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="rounded-3xl border shadow-xs/10">
          <CardHeader>
            <CardTitle>What this admin is for now</CardTitle>
            <CardDescription>
              Operations, CRM, accounting, banking, marketing reference, integrations, and administration stay here. Business Lab handles deeper creative and agentic flows.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {['Operations', 'Customer Relations', 'Accounting', 'Banking', 'Marketing & Ads', 'Integrations', 'Administration'].map((label) => (
              <div
                key={label}
                className="rounded-2xl border px-4 py-3 text-sm"
                style={{
                  background: 'color-mix(in srgb, var(--card) 86%, var(--background) 14%)',
                  borderColor: 'color-mix(in srgb, var(--border) 78%, transparent 22%)',
                }}
              >
                {label}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border shadow-xs/10">
          <CardHeader>
            <CardTitle>Business Lab handoff</CardTitle>
            <CardDescription>
              Creative assets, content workflows, AI-heavy tooling, and media management now enter through the companion app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <p>Use the Business Lab entry when you need asset generation, campaign building, publishing workflows, or deeper cross-app orchestration.</p>
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
              This is a shell for now. The destination link will be wired once the companion app route is finalized.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
