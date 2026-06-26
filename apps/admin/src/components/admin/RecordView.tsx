import Link from 'next/link';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/ui/frame';
type RecordViewProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  backHref: string;
  backLabel?: string;
  children: ReactNode;
};

export function RecordView({
  title,
  subtitle,
  badge,
  backHref,
  backLabel = 'Back to records',
  children,
}: RecordViewProps) {
  return (
    <div className="space-y-6 pb-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {subtitle ? <Badge variant="outline">{subtitle}</Badge> : null}
            {badge ? <div>{badge}</div> : null}
          </div>
        </div>

        <Button
          render={<Link href={backHref} />}
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          {backLabel}
        </Button>
      </header>

      <Frame>{children}</Frame>
    </div>
  );
}

type RecordPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function RecordPanel({ title, description, children }: RecordPanelProps) {
  return (
    <FramePanel className="mx-auto w-full overflow-hidden p-0" style={{ maxWidth: '600px', width: '100%' }}>
      <FrameHeader className="px-6 py-4">
        <FrameTitle>{title}</FrameTitle>
        {description ? <FrameDescription>{description}</FrameDescription> : null}
      </FrameHeader>
      <div className="space-y-3 px-6 py-6">{children}</div>
    </FramePanel>
  );
}
