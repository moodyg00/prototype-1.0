'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, RefreshCw, ScrollText, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty';
import { Input } from '../../../components/ui/input';
import { Spinner } from '../../../components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '../../../components/ui/dialog';
import { StatusBadge } from '../../../src/components/admin/StatusBadge';
import { changesSummary, formatAuditChangesJson } from '../../../src/lib/change-log-format';

interface LogUser {
  id: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  userType: string;
}

interface LogEntry {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  createdAt: string | null;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  user: LogUser | null;
}

type ActionFilter = 'all' | 'create' | 'update' | 'delete' | 'automation';

const ACTION_FILTERS: ActionFilter[] = ['all', 'create', 'update', 'delete', 'automation'];

const ACTION_VERBS: Record<string, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  automation: 'ran automation on',
};

function humanizeTableName(tableName: string) {
  return tableName
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function userInitials(user: LogUser | null) {
  if (!user) return 'SY';
  const parts = user.fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SY';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function entrySummary(entry: LogEntry) {
  const verb = ACTION_VERBS[entry.action] ?? entry.action;
  const recordTitle = typeof entry.metadata?.recordTitle === 'string' ? entry.metadata.recordTitle : null;
  const target = humanizeTableName(entry.tableName);
  return recordTitle ? `${verb} ${target} • ${recordTitle}` : `${verb} ${target}`;
}

function formatTimestamp(value: string | null) {
  if (!value) return { date: '—', time: '' };
  const parsed = new Date(value);
  return {
    date: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function LogPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActionFilter>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const pageSize = 50;

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/log', { cache: 'no-store' });
      const payload = (await response.json()) as { entries?: LogEntry[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to load the activity log.');
      }
      setEntries(payload.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the activity log.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries
      .filter((entry) => (filter === 'all' ? true : entry.action === filter))
      .filter((entry) => {
        if (!query) return true;
        const haystack = [
          entry.user?.fullName ?? '',
          entry.user?.email ?? '',
          entry.tableName,
          entry.recordId,
          entry.action,
          entrySummary(entry),
          entry.changes ? JSON.stringify(entry.changes) : '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
  }, [entries, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  const totalCreates = filtered.filter((entry) => entry.action === 'create').length;
  const contributorCount = new Set(filtered.map((entry) => entry.user?.id ?? 'system')).size;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em]" style={{ borderColor: 'color-mix(in srgb, var(--border) 72%, #111111 28%)', background: 'color-mix(in srgb, var(--card) 84%, #f3efe7 16%)', color: 'var(--muted-foreground)' }}>
          Activity Log
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => toast('Export CSV (demo)')}>Export</Button>
          <Button onClick={() => void loadEntries()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs text-[var(--muted-foreground)]">Actions logged</div>
          <div className="text-3xl font-semibold mt-1 tabular-nums">{filtered.length.toLocaleString()}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Most recent 500 entries</div>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Creates</div>
            <div className="text-2xl font-semibold text-emerald-600 tabular-nums mt-1">{totalCreates.toLocaleString()}</div>
          </div>
          <ScrollText className="w-8 h-8 text-emerald-600" />
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Contributors</div>
            <div className="text-2xl font-semibold tabular-nums mt-1">{contributorCount.toLocaleString()}</div>
          </div>
          <Users className="w-8 h-8 text-[var(--muted-foreground)]" />
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-[var(--muted-foreground)]" />
          <Input type="text" placeholder="Search users, records, or actions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
        </div>
        <div className="flex gap-2">
          {ACTION_FILTERS.map((f) => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'secondary'} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</Button>
          ))}
        </div>
      </div>

      {/* COSS UI CardFrame with card-style table */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">All Activity</Badge>
          <div className="text-xs text-[var(--muted-foreground)]">{filtered.length} actions</div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Time</TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="w-44">Record</TableHead>
              <TableHead className="w-40">Changes</TableHead>
              <TableHead className="w-32">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--muted-foreground)]">
                    <Spinner className="size-4" />
                    Loading activity...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>Unable to Load Log</EmptyTitle>
                      <EmptyDescription>{error}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>No Activity Found</EmptyTitle>
                      <EmptyDescription>No logged actions match your filters.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && paginated.map((entry) => {
              const timestamp = formatTimestamp(entry.createdAt);
              const userName = entry.user?.fullName ?? 'System';
              return (
                <TableRow
                  key={entry.id}
                  className="cursor-pointer hover:bg-[var(--muted)]/50"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <TableCell className="font-mono text-sm text-[var(--muted-foreground)]">
                    <div>{timestamp.date}</div>
                    <div className="text-xs">{timestamp.time}</div>
                  </TableCell>
                  <TableCell>
                    <Avatar className="bg-[var(--primary-soft)] text-[var(--primary)]">
                      {entry.user?.avatarUrl ? <AvatarImage src={entry.user.avatarUrl} alt={userName} /> : null}
                      <AvatarFallback className="bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">{userInitials(entry.user)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{userName}</div>
                    <div className="text-xs text-[var(--muted-foreground)] line-clamp-1">{entrySummary(entry)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{humanizeTableName(entry.tableName)}</div>
                    <div className="text-xs font-mono text-[var(--muted-foreground)] line-clamp-1">{entry.recordId.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--muted-foreground)]">
                    {changesSummary(entry.changes, entry.action)}
                  </TableCell>
                  <TableCell><StatusBadge status={entry.action} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-6 py-4 border-t text-sm">
          <div className="text-[var(--muted-foreground)]">
            {filtered.length === 0 ? 'Showing 0 of 0' : `Showing ${startIndex + 1}–${Math.min(startIndex + pageSize, filtered.length)} of ${filtered.length}`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="px-3 text-[var(--muted-foreground)]">Page {currentPage} of {totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </Card>

      <div className="text-xs text-[var(--muted-foreground)]">
        Every database create, update, and delete is recorded with original/new field snapshots. Click a row for full JSON.
      </div>

      <Dialog open={selectedEntry !== null} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogPopup className="max-w-3xl">
          {selectedEntry ? (
            <>
              <DialogHeader>
                <DialogTitle>Audit detail</DialogTitle>
                <DialogDescription>
                  {entrySummary(selectedEntry)} — {selectedEntry.user?.fullName ?? 'System'}
                </DialogDescription>
              </DialogHeader>
              <DialogPanel className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Table</div>
                    <div>{humanizeTableName(selectedEntry.tableName)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Record ID</div>
                    <div className="font-mono text-xs">{selectedEntry.recordId}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Changes JSON
                  </div>
                  <pre className="max-h-[50vh] overflow-auto rounded-lg border p-4 text-xs font-mono whitespace-pre-wrap break-all" style={{ borderColor: 'var(--border)' }}>
                    {formatAuditChangesJson(selectedEntry.changes)}
                  </pre>
                </div>
              </DialogPanel>
            </>
          ) : null}
        </DialogPopup>
      </Dialog>
    </div>
  );
}
