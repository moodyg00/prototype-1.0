'use client';

import { useState } from 'react';
import { Archive, Trash2, Tag, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Row = {
  id: string;
  subject: string;
  contact: string;
  status: 'new' | 'replied' | 'snoozed';
  received: string;
};

// @mock-start
const MOCK_ROWS: Row[] = [
  { id: '1', subject: 'Quarterly hosting renewal', contact: 'billing@vertex.io', status: 'new', received: '08:14' },
  { id: '2', subject: 'Re: Onboarding kit shipment', contact: 'ops@northwind.co', status: 'replied', received: '07:50' },
  { id: '3', subject: 'New lead from website form', contact: 'hello@acmeholdings.com', status: 'new', received: 'Yesterday' },
  { id: '4', subject: 'Payment failed — please retry', contact: 'pay@stripe.com', status: 'snoozed', received: 'Yesterday' },
  { id: '5', subject: 'Contract: Helio Group', contact: 'legal@helio.group', status: 'replied', received: 'Mon' },
  { id: '6', subject: 'Vendor invoice #INV-883', contact: 'accounts@pinecone.io', status: 'new', received: 'Sun' },
];
const MOCK_INITIAL_SELECTED: readonly string[] = ['1', '3'];
// @mock-end

export interface TableSelectionBulkActionsProps {
  rows?: ReadonlyArray<Row>;
  initialSelected?: ReadonlyArray<string>;
}

export function TableSelectionBulkActions({
  rows = MOCK_ROWS,
  initialSelected = MOCK_INITIAL_SELECTED,
}: TableSelectionBulkActionsProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));
  const allSelected = selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-6">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {selected.size > 0 && (
          <div
            className="flex items-center gap-2 border-b px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--primary-soft)',
              color: 'var(--primary)',
            }}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear selection"
              onClick={() => setSelected(new Set())}
            >
              <X className="size-3.5" />
            </Button>
            <span className="font-medium">{selected.size} selected</span>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Tag className="size-3.5" /> Label
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Archive className="size-3.5" /> Archive
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive">
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={(checked) => {
                    setSelected(checked ? new Set(rows.map((r) => r.id)) : new Set());
                  }}
                />
              </TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const isSel = selected.has(r.id);
              return (
                <TableRow key={r.id} data-state={isSel ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      aria-label={`Select ${r.subject}`}
                      checked={isSel}
                      onCheckedChange={() => toggle(r.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{r.subject}</TableCell>
                  <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {r.contact}
                  </TableCell>
                  <TableCell>
                    <Badge
                      size="sm"
                      variant={r.status === 'new' ? 'info' : r.status === 'replied' ? 'success' : 'outline'}
                      className="capitalize"
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                    {r.received}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
