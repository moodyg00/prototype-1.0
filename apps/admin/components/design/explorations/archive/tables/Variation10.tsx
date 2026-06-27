import { GripVertical } from 'lucide-react';

type Cell = string | number;
type Row = Cell[];

// @mock-start
const MOCK_HEADERS: string[] = ['A · Date', 'B · Description', 'C · Account', 'D · Debit', 'E · Credit', 'F · Balance'];
const MOCK_ROWS: Row[] = [
  ['2026-05-29', 'Invoice INV-1042', '4000 · Revenue', 0, 8400, 8400],
  ['2026-05-29', 'Card auth — AWS', '5200 · Hosting', 1240, 0, 7160],
  ['2026-05-28', 'Wire — Vertex Labs', '1100 · A/R', 0, 12300, 19460],
  ['2026-05-28', 'Payroll — May', '6100 · Salaries', 18800, 0, 660],
  ['2026-05-27', 'Office supplies', '6500 · G&A', 184, 0, 476],
  ['2026-05-27', 'Refund — Customer', '4000 · Revenue', 240, 0, 236],
  ['2026-05-26', 'Stripe payout', '1000 · Cash', 0, 4220, 4456],
  ['2026-05-26', 'Software — Linear', '6300 · SaaS', 96, 0, 4360],
];
// @mock-end

export interface TableSpreadsheetGridProps {
  headers?: ReadonlyArray<string>;
  rows?: ReadonlyArray<Row>;
}

export function TableSpreadsheetGrid({
  headers = MOCK_HEADERS,
  rows = MOCK_ROWS,
}: TableSpreadsheetGridProps) {
  return (
    <div className="p-6">
      <div
        className="overflow-x-auto rounded-md border font-mono text-[12px]"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                className="w-10 text-right"
                style={{
                  background: 'var(--muted)',
                  borderBottom: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  color: 'var(--muted-foreground)',
                  padding: '4px 6px',
                  fontWeight: 500,
                }}
              />
              {headers.map((h) => (
                <th
                  key={h}
                  className="relative whitespace-nowrap text-left"
                  style={{
                    background: 'var(--muted)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--muted-foreground)',
                    padding: '4px 8px',
                    fontWeight: 500,
                  }}
                >
                  <span className="text-[10px] uppercase tracking-wider">{h}</span>
                  <span
                    className="absolute -right-1.5 top-0 flex h-full w-3 cursor-col-resize items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <GripVertical className="size-3" style={{ color: 'var(--muted-foreground)' }} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td
                  className="w-10 text-right tabular-nums"
                  style={{
                    background: 'var(--muted)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--muted-foreground)',
                    padding: '4px 6px',
                    fontSize: 11,
                  }}
                >
                  {i + 1}
                </td>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="whitespace-nowrap tabular-nums"
                    style={{
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      padding: '4px 8px',
                      textAlign: typeof cell === 'number' ? 'right' : 'left',
                      color: typeof cell === 'number' && cell === 0 ? 'var(--muted-foreground)' : undefined,
                    }}
                  >
                    {typeof cell === 'number' ? (cell === 0 ? '—' : cell.toLocaleString()) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Spreadsheet-style with row/column headers and resize affordances.
      </p>
    </div>
  );
}
