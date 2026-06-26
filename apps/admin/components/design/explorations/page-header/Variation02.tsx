import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Share2, MoreHorizontal } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

type Crumb = {
  label: string;
  href?: string;
  current?: boolean;
};

// @mock-start
const MOCK_CRUMBS: Crumb[] = [
  { label: 'Operations', href: '#' },
  { label: 'Work Orders', href: '#' },
  { label: 'WO-1284', current: true },
];
const MOCK_TITLE = 'WO-1284 — Stonebridge boiler install';
const MOCK_META = 'Last updated 2 hours ago by Maria L.';
// @mock-end

export interface PageHeaderBreadcrumbDetailProps {
  crumbs?: ReadonlyArray<Crumb>;
  title?: string;
  meta?: string;
}

export function PageHeaderBreadcrumbDetail({
  crumbs = MOCK_CRUMBS,
  title = MOCK_TITLE,
  meta = MOCK_META,
}: PageHeaderBreadcrumbDetailProps) {
  return (
    <header className="space-y-3 px-6 pt-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <React.Fragment key={`${crumb.label}-${idx}`}>
                <BreadcrumbItem>
                  {crumb.current ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href ?? '#'}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {meta}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="size-3.5" />
            Share
          </Button>
          <Button size="sm" className="gap-1.5">
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="More actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
