import { ArrowUpRight, Clock, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type Row = {
  id: string;
  title: string;
  customer: string;
  initials: string;
  status: 'open' | 'in-progress' | 'closed';
  city: string;
  due: string;
  value: string;
};

// @mock-start
const MOCK_ROWS: Row[] = [
  { id: 'WO-4821', title: 'HVAC rooftop inspection', customer: 'Vertex Labs', initials: 'VL', status: 'open', city: 'Reno NV', due: 'Today', value: '$ 8,400' },
  { id: 'WO-4820', title: 'Plumbing emergency call-out', customer: 'Northwind Co.', initials: 'NW', status: 'in-progress', city: 'Sausalito CA', due: 'Today', value: '$ 12,300' },
  { id: 'WO-4819', title: 'Quarterly safety audit', customer: 'Acme Holdings', initials: 'AH', status: 'closed', city: 'Boulder CO', due: 'Yesterday', value: '$ 3,150' },
  { id: 'WO-4818', title: 'Electrical panel upgrade', customer: 'Pinecone PLC', initials: 'PP', status: 'open', city: 'Phoenix AZ', due: 'Jun 04', value: '$ 22,000' },
];
// @mock-end

const STATUS_VARIANT = { open: 'info', 'in-progress': 'warning', closed: 'success' } as const;

export interface TableCardRowsProps {
  rows?: ReadonlyArray<Row>;
}

export function TableCardRows({ rows = MOCK_ROWS }: TableCardRowsProps) {
  return (
    <div className="space-y-2 p-6">
      {rows.map((r) => (
        <div
          key={r.id}
          className="group flex items-center gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <Avatar className="size-10">
            <AvatarFallback style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              {r.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                {r.id}
              </span>
              <Badge size="sm" variant={STATUS_VARIANT[r.status]} className="capitalize">
                {r.status.replace('-', ' ')}
              </Badge>
            </div>
            <div className="mt-0.5 truncate font-semibold">{r.title}</div>
            <div
              className="mt-1 flex items-center gap-3 text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <span>{r.customer}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" /> {r.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {r.due}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold tabular-nums">{r.value}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Value
            </div>
          </div>
          <ArrowUpRight
            className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: 'var(--muted-foreground)' }}
          />
        </div>
      ))}
    </div>
  );
}
