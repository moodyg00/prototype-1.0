import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Calendar, User, MapPin, MoreHorizontal } from 'lucide-react';

type MetaEntry = {
  icon: 'user' | 'calendar' | 'map-pin';
  label: string;
};

// @mock-start
const MOCK_TITLE = 'WO-1284';
const MOCK_STATUS_LABEL = 'In progress';
const MOCK_PRIORITY_LABEL = 'Priority: High';
const MOCK_META: MetaEntry[] = [
  { icon: 'user', label: 'Maria L.' },
  { icon: 'calendar', label: 'Due Fri, May 30' },
  { icon: 'map-pin', label: 'Stonebridge, OR' },
];
const MOCK_RECORD_ID = '#WO-1284';
// @mock-end

const META_ICON_BY_KEY = {
  user: User,
  calendar: Calendar,
  'map-pin': MapPin,
} as const;

export interface PageHeaderStatusMetaProps {
  title?: string;
  statusLabel?: string;
  priorityLabel?: string;
  meta?: ReadonlyArray<MetaEntry>;
  recordId?: string;
}

export function PageHeaderStatusMeta({
  title = MOCK_TITLE,
  statusLabel = MOCK_STATUS_LABEL,
  priorityLabel = MOCK_PRIORITY_LABEL,
  meta = MOCK_META,
  recordId = MOCK_RECORD_ID,
}: PageHeaderStatusMetaProps) {
  return (
    <header className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <Badge variant="info" size="sm" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-current" />
              {statusLabel}
            </Badge>
            <Badge variant="warning" size="sm">
              {priorityLabel}
            </Badge>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {meta.map((entry) => {
              const Icon = META_ICON_BY_KEY[entry.icon];
              return (
                <span key={`${entry.icon}-${entry.label}`} className="inline-flex items-center gap-1.5">
                  <Icon className="size-3" />
                  {entry.label}
                </span>
              );
            })}
            <span className="font-mono">{recordId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Mark complete
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
