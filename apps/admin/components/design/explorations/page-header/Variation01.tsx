import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// @mock-start
const MOCK_TITLE = 'Work Orders';
const MOCK_DESCRIPTION = 'Active jobs, scheduling, and post-job billing for the field team.';
const MOCK_ACTION_LABEL = 'New work order';
// @mock-end

export interface PageHeaderSimpleProps {
  title?: string;
  description?: string;
  actionLabel?: string;
}

export function PageHeaderSimple({
  title = MOCK_TITLE,
  description = MOCK_DESCRIPTION,
  actionLabel = MOCK_ACTION_LABEL,
}: PageHeaderSimpleProps) {
  return (
    <header className="px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {description}
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          {actionLabel}
        </Button>
      </div>
    </header>
  );
}
