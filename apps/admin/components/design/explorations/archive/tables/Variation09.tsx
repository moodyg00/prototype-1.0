import { Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Row = { name: string; type: string; size: string; modified: string };
type Group = { label: string; count: number; rows: Row[] };

// @mock-start
const MOCK_GROUPS: Group[] = [
  {
    label: 'Active workspaces',
    count: 3,
    rows: [
      { name: 'Operations', type: 'Workspace', size: '4.2 GB', modified: '2 min ago' },
      { name: 'Marketing', type: 'Workspace', size: '1.8 GB', modified: '12 min ago' },
      { name: 'Finance', type: 'Workspace', size: '3.1 GB', modified: '1 h ago' },
    ],
  },
  {
    label: 'Archived workspaces',
    count: 2,
    rows: [
      { name: 'Q4 2025 push', type: 'Workspace', size: '6.4 GB', modified: 'Jan 02' },
      { name: 'Legacy CRM', type: 'Workspace', size: '11.2 GB', modified: 'Oct 14' },
    ],
  },
  {
    label: 'Shared with me',
    count: 2,
    rows: [
      { name: 'Vendor onboarding', type: 'Workspace', size: '882 MB', modified: 'Yesterday' },
      { name: 'Annual audit 2026', type: 'Workspace', size: '512 MB', modified: '4 d ago' },
    ],
  },
];
// @mock-end

export interface TableZebraGroupedProps {
  groups?: ReadonlyArray<Group>;
}

export function TableZebraGrouped({ groups = MOCK_GROUPS }: TableZebraGroupedProps) {
  return (
    <div className="p-6">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="text-right">Modified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <Fragment key={g.label}>
                <TableRow className="hover:!bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="py-2"
                    style={{
                      background: 'var(--muted)',
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {g.label}
                      </span>
                      <Badge size="sm" variant="outline" className="font-normal">
                        {g.count}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
                {g.rows.map((r, idx) => (
                  <TableRow
                    key={`${g.label}-${r.name}`}
                    style={
                      idx % 2 === 1
                        ? {
                            background:
                              'color-mix(in srgb, var(--muted) 35%, var(--card) 65%)',
                          }
                        : undefined
                    }
                  >
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell style={{ color: 'var(--muted-foreground)' }}>{r.type}</TableCell>
                    <TableCell className="text-right tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                      {r.size}
                    </TableCell>
                    <TableCell className="text-right text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {r.modified}
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
