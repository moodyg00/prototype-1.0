import type { ReactNode } from 'react';

import { cn } from '@/src/lib/utils';

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4 border-b border-border/50 pb-5', className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {(meta || actions) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {meta}
          {actions}
        </div>
      )}
    </header>
  );
}