'use client';

import React from 'react';

import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import type { AdminDashboardKpis } from '@/src/lib/admin/dashboard-kpi-types';

type Props = {
  dashboardKpis: AdminDashboardKpis;
};

export function AdminDashboard({ dashboardKpis }: Props): React.ReactElement {
  return (
    <div className="space-y-8 admin-stagger">
      <AdminPageHeader
        eyebrow="Admin Home"
        title="Quick reference across the business"
        description="Business Lab is where human admins will spend most of their time. This page stays lightweight and useful at a glance."
      />

      <section className="admin-surface overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-border/40 md:grid-cols-3 md:divide-x md:divide-y-0 2xl:grid-cols-5 2xl:divide-x">
          {dashboardKpis.groups.map((group) => (
            <div key={group.name} className="flex flex-col p-5">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: group.color }}
                  aria-hidden
                />
                <h2 className="font-display text-base font-medium tracking-tight">{group.name}</h2>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{group.description}</p>

              <div className="mt-auto space-y-4">
                {group.metrics.map((metric, index) => (
                  <div
                    key={metric.label}
                    className={index > 0 ? 'border-t border-border/35 pt-4' : undefined}
                  >
                    <div className="admin-meta-label">{metric.label}</div>
                    <div className="mt-1.5 font-display text-2xl font-medium leading-none tabular-nums">
                      {metric.value}
                    </div>
                    <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{metric.note}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}