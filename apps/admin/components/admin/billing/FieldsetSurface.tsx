import * as React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/src/lib/utils';

export interface FieldsetSurfaceProps {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned actions in the header bar (alias: `toolbar`). */
  actions?: React.ReactNode;
  /** Alias for `actions` to match the legacy callsites. */
  toolbar?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

/**
 * Generic card surface for editor fieldsets (Customer, DocumentMeta,
 * LineItems, Discount, etc.). Keeps padding consistent across the editor
 * and lets a fieldset opt out of the default content padding when it owns
 * its own table or grid.
 */
export function FieldsetSurface({
  eyebrow,
  title,
  description,
  actions,
  toolbar,
  className,
  contentClassName,
  children,
}: FieldsetSurfaceProps): React.ReactElement {
  const headerActions = actions ?? toolbar;
  return (
    <Card className={cn(className)}>
      {(eyebrow || title || description || headerActions) && (
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div className="space-y-0.5">
            {eyebrow ? (
              <div
                className="text-[11px] font-mono uppercase tracking-[0.22em]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {eyebrow}
              </div>
            ) : null}
            {title ? <CardTitle className="text-base">{title}</CardTitle> : null}
            {description ? (
              <CardDescription className="text-xs">{description}</CardDescription>
            ) : null}
          </div>
          {headerActions ? (
            <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
          ) : null}
        </CardHeader>
      )}
      <CardContent className={cn('pt-2', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
