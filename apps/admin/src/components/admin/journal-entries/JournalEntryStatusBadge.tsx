import * as React from 'react';

import { Badge } from '@/components/ui/badge';

type Status = 'Draft' | 'Posted' | 'Reversed';

const VARIANTS: Record<Status, React.ComponentProps<typeof Badge>['variant']> = {
  Draft: 'outline',
  Posted: 'success',
  Reversed: 'warning',
};

export function JournalEntryStatusBadge({ status }: { status: Status }): React.ReactElement {
  return (
    <Badge variant={VARIANTS[status]} size="sm" className="uppercase tracking-[0.16em]">
      {status}
    </Badge>
  );
}
