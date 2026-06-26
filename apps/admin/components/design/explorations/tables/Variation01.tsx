import { ChevronsUpDown, ChevronUp, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Row = {
  id: string;
  client: string;
  status: 'open' | 'in-progress' | 'closed';
  owner: string;
  amount: string;
  updated: string;
};

// @mock-start
const MOCK_ROWS: Row[] = [
  { id: 'WO-4821', client: 'Vertex Labs', status: 'open', owner: 'J. Doe', amount: '$ 8,400', updated: '2h ago' },
  { id: 'WO-4820', client: 'Northwind Co.', status: 'in-progress', owner: 'A. Park', amount: '$ 12,300', updated: '5h ago' },
  { id: 'WO-4819', client: 'Acme Holdings', status: 'closed', owner: 'M. Liu', amount: '$ 3,150', updated: '1d ago' },
  { id: 'WO-4818', client: 'Pinecone PLC', status: 'open', owner: 'J. Doe', amount: '$ 22,000', updated: '2d ago' },
  { id: 'WO-4817', client: 'Helio Group', status: 'in-progress', owner: 'R. Patel', amount: '$ 6,725', updated: '3d ago' },
];
const MOCK_TOTAL_RECORDS = 127;
const MOCK_PAGE = 1;
const MOCK_PAGE_COUNT = 26;
// @mock-end

const STATUS_VARIANT = {
  open: 'info',
  'in-progress': 'warning',
  closed: 'success',
} as const;

export interface TableClassicBorderedProps {
  rows?: ReadonlyArray<Row>;
  totalRecords?: number;
  page?: number;
  pageCount?: number;
}

export function TableClassicBordered({
  rows = MOCK_ROWS,
  totalRecords = MOCK_TOTAL_RECORDS,
  page = MOCK_PAGE,
  pageCount = MOCK_PAGE_COUNT,
}: TableClassicBorderedProps) {
  return (
    <div className="p-6">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button type="button" className="inline-flex items-center gap-1.5 font-medium">
                  ID <ChevronUp className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="inline-flex items-center gap-1.5 font-medium">
                  Client <ChevronsUpDown className="size-3.5 opacity-50" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <button type="button" className="inline-flex items-center gap-1.5 font-medium">
                  Owner <ChevronsUpDown className="size-3.5 opacity-50" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button type="button" className="inline-flex items-center gap-1.5 font-medium">
                  Amount <ChevronsUpDown className="size-3.5 opacity-50" />
                </button>
              </TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell className="font-medium">{r.client}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[r.status]} size="sm" className="capitalize">
                    {r.status.replace('-', ' ')}
                  </Badge>
                </TableCell>
                <TableCell style={{ color: 'var(--muted-foreground)' }}>{r.owner}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{r.amount}</TableCell>
                <TableCell className="text-right text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {r.updated}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div
          className="flex items-center justify-between border-t px-3 py-2 text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <span>{rows.length} of {totalRecords} records</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Previous">
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="px-2 font-mono">{page} / {pageCount}</span>
            <Button variant="ghost" size="icon-sm" aria-label="Next">
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
