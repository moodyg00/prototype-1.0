import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Row = {
  sku: string;
  name: string;
  stock: number;
  reserved: number;
  loc: string;
  last: string;
};

// @mock-start
const MOCK_ROWS: Row[] = [
  { sku: 'SKU-001-AL', name: 'Aluminum brackets, 1/4"', stock: 1280, reserved: 60, loc: 'A-12', last: '2026-05-29 14:02' },
  { sku: 'SKU-001-CU', name: 'Copper brackets, 1/4"', stock: 920, reserved: 24, loc: 'A-13', last: '2026-05-29 13:51' },
  { sku: 'SKU-002-AL', name: 'Aluminum brackets, 1/2"', stock: 410, reserved: 88, loc: 'A-14', last: '2026-05-29 12:18' },
  { sku: 'SKU-002-CU', name: 'Copper brackets, 1/2"', stock: 92, reserved: 12, loc: 'A-15', last: '2026-05-29 11:44' },
  { sku: 'SKU-100-PV', name: 'PVC conduit, 10 ft', stock: 540, reserved: 0, loc: 'B-04', last: '2026-05-29 10:28' },
  { sku: 'SKU-101-PV', name: 'PVC conduit, 20 ft', stock: 220, reserved: 18, loc: 'B-05', last: '2026-05-29 09:11' },
  { sku: 'SKU-200-FX', name: 'Hex fixings, M6', stock: 11240, reserved: 1200, loc: 'C-01', last: '2026-05-29 08:55' },
  { sku: 'SKU-201-FX', name: 'Hex fixings, M8', stock: 8612, reserved: 800, loc: 'C-02', last: '2026-05-29 08:40' },
  { sku: 'SKU-202-FX', name: 'Hex fixings, M10', stock: 4204, reserved: 200, loc: 'C-03', last: '2026-05-28 19:02' },
  { sku: 'SKU-300-CA', name: 'Cable, 14 AWG', stock: 612, reserved: 50, loc: 'D-08', last: '2026-05-28 17:30' },
];
// @mock-end

export interface TableDensePowerProps {
  rows?: ReadonlyArray<Row>;
}

export function TableDensePower({ rows = MOCK_ROWS }: TableDensePowerProps) {
  return (
    <div className="p-4">
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="h-7 text-[10px] uppercase tracking-wider">SKU</TableHead>
            <TableHead className="h-7 text-[10px] uppercase tracking-wider">Name</TableHead>
            <TableHead className="h-7 text-right text-[10px] uppercase tracking-wider">Stock</TableHead>
            <TableHead className="h-7 text-right text-[10px] uppercase tracking-wider">Reserved</TableHead>
            <TableHead className="h-7 text-[10px] uppercase tracking-wider">Loc</TableHead>
            <TableHead className="h-7 text-right text-[10px] uppercase tracking-wider">Last move</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.sku} className="h-8">
              <TableCell className="py-1 font-mono text-[11px]">{r.sku}</TableCell>
              <TableCell className="py-1">{r.name}</TableCell>
              <TableCell className="py-1 text-right tabular-nums">{r.stock.toLocaleString()}</TableCell>
              <TableCell className="py-1 text-right tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                {r.reserved.toLocaleString()}
              </TableCell>
              <TableCell className="py-1 font-mono text-[11px]">{r.loc}</TableCell>
              <TableCell
                className="py-1 text-right font-mono text-[10px] tabular-nums"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {r.last}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
