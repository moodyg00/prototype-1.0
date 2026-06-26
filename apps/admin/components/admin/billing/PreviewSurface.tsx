import * as React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/src/lib/utils';

export interface PreviewSurfaceProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

/**
 * Surface card used to wrap the live preview pane. Mirrors the basic-surface
 * card variant but tightens the body padding so the preview document can run
 * to the edge while the header still has breathing room.
 */
export function PreviewSurface({
  title,
  description,
  toolbar,
  className,
  contentClassName,
  children,
}: PreviewSurfaceProps): React.ReactElement {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {(title || description || toolbar) && (
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-0.5">
            {title ? <CardTitle className="text-sm">{title}</CardTitle> : null}
            {description ? (
              <CardDescription className="text-xs">{description}</CardDescription>
            ) : null}
          </div>
          {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}
        </CardHeader>
      )}
      <CardContent className={cn('p-0', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
