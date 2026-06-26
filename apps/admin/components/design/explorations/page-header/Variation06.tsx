import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Plus, Pencil } from 'lucide-react';

// @mock-start
const MOCK_TITLE = 'WO-1284 — Stonebridge boiler install';
const MOCK_STATUS_LABEL = 'In progress';
const MOCK_LAST_EDITED = 'Edited 2m ago';
// @mock-end

export interface PageHeaderStickyCompactProps {
  title?: string;
  statusLabel?: string;
  lastEdited?: string;
}

export function PageHeaderStickyCompact({
  title = MOCK_TITLE,
  statusLabel = MOCK_STATUS_LABEL,
  lastEdited = MOCK_LAST_EDITED,
}: PageHeaderStickyCompactProps) {
  return (
    <header
      className="sticky top-0 z-10 flex h-12 items-center gap-3 px-4 backdrop-blur"
      style={{
        background: 'color-mix(in srgb, var(--card) 88%, transparent)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <Button variant="ghost" size="icon-sm" aria-label="Back">
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-semibold tracking-tight text-sm">
          {title}
        </span>
        <Badge variant="info" size="sm" className="hidden sm:inline-flex">
          {statusLabel}
        </Badge>
      </div>

      <div
        className="ms-2 hidden text-[11px] sm:inline"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {lastEdited}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="gap-1.5 hidden sm:inline-flex">
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Add note
        </Button>
      </div>
    </header>
  );
}
