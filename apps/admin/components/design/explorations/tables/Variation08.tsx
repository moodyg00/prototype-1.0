type Row = {
  account: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  ytd: number;
  pipeline: number;
  region: string;
  owner: string;
};

// @mock-start
const MOCK_ROWS: Row[] = [
  { account: 'Vertex Labs', q1: 412, q2: 480, q3: 540, q4: 612, ytd: 2044, pipeline: 880, region: 'NA-West', owner: 'J. Doe' },
  { account: 'Northwind Co.', q1: 380, q2: 410, q3: 388, q4: 444, ytd: 1622, pipeline: 720, region: 'NA-West', owner: 'A. Park' },
  { account: 'Acme Holdings', q1: 612, q2: 580, q3: 640, q4: 702, ytd: 2534, pipeline: 1100, region: 'NA-East', owner: 'M. Liu' },
  { account: 'Pinecone PLC', q1: 240, q2: 280, q3: 320, q4: 360, ytd: 1200, pipeline: 480, region: 'EU', owner: 'R. Patel' },
  { account: 'Helio Group', q1: 184, q2: 220, q3: 248, q4: 290, ytd: 942, pipeline: 380, region: 'EU', owner: 'A. Park' },
  { account: 'Beacon Industrial', q1: 880, q2: 920, q3: 960, q4: 1012, ytd: 3772, pipeline: 1800, region: 'NA-East', owner: 'J. Doe' },
];
// @mock-end

function fmt(n: number) {
  return `$${n.toLocaleString()}k`;
}

export interface TableStickyFirstColumnProps {
  rows?: ReadonlyArray<Row>;
}

export function TableStickyFirstColumn({ rows = MOCK_ROWS }: TableStickyFirstColumnProps) {
  return (
    <div className="p-6">
      <div
        className="relative overflow-x-auto rounded-xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th
                className="sticky left-0 z-10 h-9 whitespace-nowrap px-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{
                  background: 'var(--card)',
                  borderRight: '1px solid var(--border)',
                  color: 'var(--muted-foreground)',
                }}
              >
                Account
              </th>
              {['Q1', 'Q2', 'Q3', 'Q4', 'YTD', 'Pipeline', 'Region', 'Owner'].map((h, i) => (
                <th
                  key={h}
                  className="h-9 whitespace-nowrap px-3 text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: 'var(--muted-foreground)',
                    textAlign: i < 6 ? 'right' : 'left',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.account} style={{ borderBottom: '1px solid var(--border)' }}>
                <td
                  className="sticky left-0 z-10 whitespace-nowrap px-3 py-2.5 font-medium"
                  style={{
                    background: 'var(--card)',
                    borderRight: '1px solid var(--border)',
                  }}
                >
                  {r.account}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{fmt(r.q1)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{fmt(r.q2)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{fmt(r.q3)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{fmt(r.q4)}</td>
                <td
                  className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums"
                  style={{ color: 'var(--primary)' }}
                >
                  {fmt(r.ytd)}
                </td>
                <td
                  className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {fmt(r.pipeline)}
                </td>
                <td
                  className="whitespace-nowrap px-3 py-2.5 font-mono text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {r.region}
                </td>
                <td
                  className="whitespace-nowrap px-3 py-2.5"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {r.owner}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Scroll horizontally — the account column stays anchored.
      </p>
    </div>
  );
}
