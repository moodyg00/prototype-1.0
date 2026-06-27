import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';

/**
 * PagePlaceholder
 *
 * Lightweight scaffold used by every page placeholder that's been ported from
 * Proto-1 but not yet hooked up to data. Renders a coss-style page header
 * (title + lede), the source Laravel controller it maps to, and an empty
 * body so the route exists in the new app.
 *
 * Once the matching Prisma query + COSS list/table is wired, replace the
 * <PagePlaceholder/> call with a real page.
 */
interface Props {
  title: string;
  description?: string;
  /** Proto-1 Filament resource / page class this page replaces. */
  source?: string;
  /** Optional secondary tag rendered next to the title. */
  group?: string;
  /** Custom body content. If omitted, an empty-state hint is shown. */
  children?: React.ReactNode;
}

export function PagePlaceholder({ title, description, source, group, children }: Props) {
  return (
    <div className="space-y-6 admin-stagger">
      <AdminPageHeader
        title={title}
        description={description}
        meta={
          <>
            {group ? <Badge variant="outline">{group}</Badge> : null}
            <Badge variant="info">placeholder</Badge>
          </>
        }
      />

      <div className="admin-surface px-5 py-6">
        {children ?? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Coming soon</div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This route was ported from Proto-1. The page shell exists so the navigation contract
              is intact; the data table and forms are being migrated incrementally.
            </p>
            {source ? (
              <p className="pt-2 font-mono text-xs text-muted-foreground">
                Source (Proto-1): <code>{source}</code>
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}