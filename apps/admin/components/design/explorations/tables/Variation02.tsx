import { ArrowUpRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Row = { name: string; team: string; progress: number; due: string };

// @mock-start
const MOCK_ROWS: Row[] = [
  { name: 'Onboarding revamp', team: 'Growth', progress: 78, due: 'Jun 14' },
  { name: 'Billing migration', team: 'Platform', progress: 42, due: 'Jun 22' },
  { name: 'Agent inbox v2', team: 'AI', progress: 91, due: 'Jul 02' },
  { name: 'Vendor consolidation', team: 'Ops', progress: 23, due: 'Jul 18' },
  { name: 'Mobile login flow', team: 'Mobile', progress: 55, due: 'Aug 04' },
  { name: 'Analytics warehouse', team: 'Data', progress: 12, due: 'Aug 28' },
];
// @mock-end

export interface TableMinimalHoverLanesProps {
  rows?: ReadonlyArray<Row>;
}

export function TableMinimalHoverLanes({ rows = MOCK_ROWS }: TableMinimalHoverLanesProps) {
  return (
    <div className="px-6 py-8">
      <Table>
        <TableHeader>
          <TableRow className="border-b-0">
            <TableHead className="text-[10px] uppercase tracking-[0.18em]">Initiative</TableHead>
            <TableHead className="text-[10px] uppercase tracking-[0.18em]">Team</TableHead>
            <TableHead className="text-[10px] uppercase tracking-[0.18em]">Progress</TableHead>
            <TableHead className="text-right text-[10px] uppercase tracking-[0.18em]">Due</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.name} className="group border-b-0">
              <TableCell className="py-3 font-medium">{r.name}</TableCell>
              <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {r.team}
              </TableCell>
              <TableCell className="w-72">
                <div className="flex items-center gap-3">
                  <div
                    className="h-1 flex-1 overflow-hidden rounded-full"
                    style={{ background: 'var(--muted)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ background: 'var(--primary)', width: `${r.progress}%` }}
                    />
                  </div>
                  <span
                    className="w-9 text-right font-mono text-[11px] tabular-nums"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {r.progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">{r.due}</TableCell>
              <TableCell>
                <ArrowUpRight
                  className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: 'var(--muted-foreground)' }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
