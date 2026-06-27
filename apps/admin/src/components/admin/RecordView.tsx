import Link from 'next/link';
import type { ReactNode } from 'react';

import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
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
    <div className="space-y-6 pb-6 admin-stagger">
      <AdminPageHeader
        title={title}
        meta={
          <>
            {subtitle ? <Badge variant="outline">{subtitle}</Badge> : null}
            {badge}
          </>
        }
        actions={
          <Button
            render={<Link href={backHref} />}
            variant="outline"
            size="sm"
          >
            {backLabel}
          </Button>
        }
      />

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
      <FrameHeader className="border-b border-border/40">
        <FrameTitle>{title}</FrameTitle>
        {description ? <FrameDescription>{description}</FrameDescription> : null}
      </FrameHeader>
      <div className="space-y-3 px-5 py-5">{children}</div>
    </FramePanel>
  );
}