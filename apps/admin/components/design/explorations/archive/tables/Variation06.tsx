'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Row = { id: string; name: string; email: string; role: string; seats: number };

// @mock-start
const MOCK_INITIAL_ROWS: Row[] = [
  { id: 'u1', name: 'Janet Doe', email: 'janet@vertex.io', role: 'Owner', seats: 5 },
  { id: 'u2', name: 'Aiden Park', email: 'aiden@vertex.io', role: 'Admin', seats: 5 },
  { id: 'u3', name: 'Maya Liu', email: 'maya@vertex.io', role: 'Member', seats: 3 },
  { id: 'u4', name: 'Reza Patel', email: 'reza@vertex.io', role: 'Member', seats: 3 },
];
// @mock-end

export interface TableInlineEditableProps {
  initialRows?: ReadonlyArray<Row>;
}

export function TableInlineEditable({ initialRows = MOCK_INITIAL_ROWS }: TableInlineEditableProps) {
  const [rows, setRows] = useState<Row[]>(() => initialRows.map((r) => ({ ...r })));
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Row | null>(null);

  function startEdit(row: Row) {
    setEditing(row.id);
    setDraft({ ...row });
  }

  function commit() {
    if (!draft) return;
    setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
    setEditing(null);
    setDraft(null);
  }

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
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Seats</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const isEditing = editing === r.id && draft;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        size="sm"
                        value={draft!.name}
                        onChange={(e) => setDraft({ ...draft!, name: e.target.value })}
                      />
                    ) : (
                      <span className="font-medium">{r.name}</span>
                    )}
                  </TableCell>
                  <TableCell style={{ color: 'var(--muted-foreground)' }}>
                    {isEditing ? (
                      <Input
                        size="sm"
                        value={draft!.email}
                        onChange={(e) => setDraft({ ...draft!, email: e.target.value })}
                      />
                    ) : (
                      r.email
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        size="sm"
                        value={draft!.role}
                        onChange={(e) => setDraft({ ...draft!, role: e.target.value })}
                      />
                    ) : (
                      r.role
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {isEditing ? (
                      <Input
                        size="sm"
                        type="number"
                        value={String(draft!.seats)}
                        onChange={(e) => setDraft({ ...draft!, seats: Number(e.target.value) || 0 })}
                        className="text-right"
                      />
                    ) : (
                      r.seats
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label="Save" onClick={commit}>
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Cancel"
                          onClick={() => {
                            setEditing(null);
                            setDraft(null);
                          }}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => startEdit(r)}>
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Click the pencil to edit any row inline.
      </p>
    </div>
  );
}
