'use client';

import { Fragment, useState } from 'react';
import { ChevronRight, MapPin, User, Wrench, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Row = {
  id: string;
  customer: string;
  service: string;
  tech: string;
  date: string;
  status: 'scheduled' | 'dispatched' | 'complete';
  address: string;
  notes: string;
  parts: string[];
};

// @mock-start
const MOCK_ROWS: Row[] = [
  {
    id: 'JOB-2204',
    customer: 'Vertex Labs',
    service: 'HVAC inspection',
    tech: 'M. Liu',
    date: 'Today, 13:00',
    status: 'dispatched',
    address: '4218 Industrial Way, Reno NV',
    notes: 'Customer reports intermittent fan noise on rooftop unit 2. Loading dock access only.',
    parts: ['Filter pack 20x25', 'Belt #B-441'],
  },
  {
    id: 'JOB-2203',
    customer: 'Northwind Co.',
    service: 'Plumbing repair',
    tech: 'R. Patel',
    date: 'Today, 15:30',
    status: 'scheduled',
    address: '88 Harbor Blvd, Sausalito CA',
    notes: 'Replace shutoff valve under kitchen sink. Tenants notified for 3pm window.',
    parts: ['1/2" angle stop', 'PTFE tape'],
  },
  {
    id: 'JOB-2202',
    customer: 'Acme Holdings',
    service: 'Electrical',
    tech: 'A. Park',
    date: 'Tomorrow, 09:00',
    status: 'scheduled',
    address: '11 Granite Cir, Boulder CO',
    notes: 'Install 240V circuit for new dryer. Permit on file.',
    parts: ['30A breaker', '#10 AWG copper'],
  },
];
const MOCK_INITIAL_EXPANDED_ID: string | null = 'JOB-2204';
// @mock-end

export interface TableExpandableDetailProps {
  rows?: ReadonlyArray<Row>;
  initialExpandedId?: string | null;
}

export function TableExpandableDetail({
  rows = MOCK_ROWS,
  initialExpandedId = MOCK_INITIAL_EXPANDED_ID,
}: TableExpandableDetailProps) {
  const [open, setOpen] = useState<string | null>(initialExpandedId);

  return (
    <div className="p-6">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Job</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Tech</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const isOpen = open === r.id;
              return (
                <Fragment key={r.id}>
                  <TableRow>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : r.id)}
                        aria-label={isOpen ? 'Collapse row' : 'Expand row'}
                        className="grid size-6 place-items-center rounded transition-colors hover:bg-[var(--muted)]"
                      >
                        <ChevronRight
                          className="size-3.5 transition-transform"
                          style={{
                            color: 'var(--muted-foreground)',
                            transform: isOpen ? 'rotate(90deg)' : 'none',
                          }}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-medium">{r.customer}</TableCell>
                    <TableCell>{r.service}</TableCell>
                    <TableCell style={{ color: 'var(--muted-foreground)' }}>{r.tech}</TableCell>
                    <TableCell className="text-sm">{r.date}</TableCell>
                    <TableCell>
                      <Badge
                        size="sm"
                        variant={r.status === 'complete' ? 'success' : r.status === 'dispatched' ? 'warning' : 'info'}
                        className="capitalize"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="hover:!bg-transparent">
                      <TableCell />
                      <TableCell colSpan={6} className="whitespace-normal py-4">
                        <div
                          className="grid gap-4 rounded-lg border p-4 md:grid-cols-3"
                          style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
                        >
                          <div className="space-y-1.5">
                            <div
                              className="flex items-center gap-2 text-[10px] uppercase tracking-wider"
                              style={{ color: 'var(--muted-foreground)' }}
                            >
                              <MapPin className="size-3" /> Address
                            </div>
                            <div className="text-sm">{r.address}</div>
                          </div>
                          <div className="space-y-1.5">
                            <div
                              className="flex items-center gap-2 text-[10px] uppercase tracking-wider"
                              style={{ color: 'var(--muted-foreground)' }}
                            >
                              <User className="size-3" /> Notes
                            </div>
                            <div className="text-sm">{r.notes}</div>
                          </div>
                          <div className="space-y-1.5">
                            <div
                              className="flex items-center gap-2 text-[10px] uppercase tracking-wider"
                              style={{ color: 'var(--muted-foreground)' }}
                            >
                              <Wrench className="size-3" /> Parts
                            </div>
                            <ul className="space-y-0.5 text-sm">
                              {r.parts.map((p) => (
                                <li key={p} className="flex items-center gap-2">
                                  <span
                                    className="size-1 rounded-full"
                                    style={{ background: 'var(--muted-foreground)' }}
                                  />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div
                            className="col-span-full inline-flex items-center gap-1.5 text-[11px]"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            <Clock className="size-3" /> Last updated 14 minutes ago
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
