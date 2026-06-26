'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, RefreshCw, ScrollText, Activity } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty';
import { Spinner } from '../../../components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Tabs, TabsList, TabsPanel, TabsTab } from '../../../components/ui/tabs';
import { maskIntegrationPayload } from '../../../src/lib/observability/mask-payload';

type SuccessFilter = 'all' | 'success' | 'fail';

interface BankSyncEntry {
  id: string;
  provider: string;
  operation: string;
  targetResourceId: string | null;
  responseStatus: number | null;
  durationMs: number | null;
  succeeded: boolean;
  errorMessage: string | null;
  createdAt: string;
}

interface IntegrationEntry {
  id: string;
  integrationId: string;
  integrationName: string;
  integrationProvider: string | null;
  logType: string;
  status: string;
  endpoint: string | null;
  requestPayload: Record<string, unknown> | null;
  responsePayload: Record<string, unknown> | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string | null;
}

const SUCCESS_FILTERS: SuccessFilter[] = ['all', 'success', 'fail'];
const PAGE_SIZE = 100;

function formatTimestamp(value: string | null) {
  if (!value) return { date: '—', time: '' };
  const parsed = new Date(value);
  return {
    date: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

function formatDuration(ms: number | null) {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function ResultBadge({ succeeded }: { succeeded: boolean }) {
  return succeeded ? (
    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Success</Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === 'success') {
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Success</Badge>;
  }
  if (normalized === 'failed') {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
  }
  if (normalized === 'warning') {
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Warning</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

function BankSyncTab() {
  const [entries, setEntries] = useState<BankSyncEntry[]>([]);
  const [operations, setOperations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successFilter, setSuccessFilter] = useState<SuccessFilter>('all');
  const [operationFilter, setOperationFilter] = useState('all');
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);

  const loadEntries = useCallback(async (opts?: { cursor?: string | null; resetStack?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('operations', '1');
      if (opts?.cursor) params.set('cursor', opts.cursor);
      if (successFilter === 'success') params.set('succeeded', 'true');
      if (successFilter === 'fail') params.set('succeeded', 'false');
      if (operationFilter !== 'all') params.set('operation', operationFilter);

      const response = await fetch(`/api/admin/observability/bank-sync?${params.toString()}`, { cache: 'no-store' });
      const payload = (await response.json()) as {
        items?: BankSyncEntry[];
        nextCursor?: string | null;
        operations?: string[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to load bank sync audit logs.');
      }

      setEntries(payload.items ?? []);
      setNextCursor(payload.nextCursor ?? null);
      if (payload.operations) setOperations(payload.operations);
      setCursor(opts?.cursor ?? null);
      if (opts?.resetStack) setCursorStack([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load bank sync audit logs.');
    } finally {
      setLoading(false);
    }
  }, [operationFilter, successFilter]);

  useEffect(() => {
    void loadEntries({ resetStack: true });
  }, [loadEntries]);

  const successCount = useMemo(() => entries.filter((entry) => entry.succeeded).length, [entries]);
  const failCount = useMemo(() => entries.filter((entry) => !entry.succeeded).length, [entries]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs text-[var(--muted-foreground)]">Entries on page</div>
          <div className="text-3xl font-semibold mt-1 tabular-nums">{entries.length.toLocaleString()}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Up to {PAGE_SIZE} per page</div>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Success (page)</div>
            <div className="text-2xl font-semibold text-emerald-600 tabular-nums mt-1">{successCount.toLocaleString()}</div>
          </div>
          <ScrollText className="w-8 h-8 text-emerald-600" />
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Failed (page)</div>
            <div className="text-2xl font-semibold text-red-600 tabular-nums mt-1">{failCount.toLocaleString()}</div>
          </div>
          <Activity className="w-8 h-8 text-red-600" />
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {SUCCESS_FILTERS.map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={successFilter === filter ? 'default' : 'secondary'}
              onClick={() => setSuccessFilter(filter)}
            >
              {filter === 'all' ? 'All' : filter === 'success' ? 'Success' : 'Failed'}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={operationFilter === 'all' ? 'default' : 'secondary'}
            onClick={() => setOperationFilter('all')}
          >
            All operations
          </Button>
          {operations.map((operation) => (
            <Button
              key={operation}
              size="sm"
              variant={operationFilter === operation ? 'default' : 'secondary'}
              onClick={() => setOperationFilter(operation)}
            >
              {operation}
            </Button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadEntries({ cursor, resetStack: true })}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            Bank Sync Audit
          </Badge>
          <div className="text-xs text-[var(--muted-foreground)]">{entries.length} entries</div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Time</TableHead>
              <TableHead className="w-24">Provider</TableHead>
              <TableHead className="w-36">Operation</TableHead>
              <TableHead className="w-24">Result</TableHead>
              <TableHead className="w-20">HTTP</TableHead>
              <TableHead className="w-24">Duration</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--muted-foreground)]">
                    <Spinner className="size-4" />
                    Loading bank sync logs...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>Unable to Load Logs</EmptyTitle>
                      <EmptyDescription>{error}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>No Bank Sync Logs</EmptyTitle>
                      <EmptyDescription>
                        Mercury sync attempts will appear here after the first sync or webhook event.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && entries.map((entry) => {
              const timestamp = formatTimestamp(entry.createdAt);
              return (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm text-[var(--muted-foreground)]">
                    <div>{timestamp.date}</div>
                    <div className="text-xs">{timestamp.time}</div>
                  </TableCell>
                  <TableCell>{entry.provider}</TableCell>
                  <TableCell>
                    <div className="font-medium">{entry.operation}</div>
                    {entry.targetResourceId ? (
                      <div className="text-xs text-[var(--muted-foreground)] line-clamp-1">{entry.targetResourceId}</div>
                    ) : null}
                  </TableCell>
                  <TableCell><ResultBadge succeeded={entry.succeeded} /></TableCell>
                  <TableCell className="font-mono text-sm">{entry.responseStatus ?? '—'}</TableCell>
                  <TableCell className="font-mono text-sm">{formatDuration(entry.durationMs)}</TableCell>
                  <TableCell className="text-xs text-[var(--muted-foreground)] max-w-xs truncate">
                    {entry.errorMessage ?? '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-6 py-4 border-t text-sm">
          <div className="text-[var(--muted-foreground)]">
            {entries.length === 0 ? 'Showing 0 entries' : `Showing ${entries.length} entries`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={cursorStack.length === 0 || loading}
              onClick={() => {
                const previous = cursorStack[cursorStack.length - 1] ?? null;
                setCursorStack((stack) => stack.slice(0, -1));
                void loadEntries({ cursor: previous });
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!nextCursor || loading}
              onClick={() => {
                setCursorStack((stack) => [...stack, cursor]);
                void loadEntries({ cursor: nextCursor });
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function IntegrationsTab() {
  const [entries, setEntries] = useState<IntegrationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);

  const loadEntries = useCallback(async (opts?: { cursor?: string | null; resetStack?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      if (opts?.cursor) params.set('cursor', opts.cursor);

      const response = await fetch(`/api/admin/observability/integrations?${params.toString()}`, { cache: 'no-store' });
      const payload = (await response.json()) as {
        items?: IntegrationEntry[];
        nextCursor?: string | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to load integration logs.');
      }

      setEntries(payload.items ?? []);
      setNextCursor(payload.nextCursor ?? null);
      setCursor(opts?.cursor ?? null);
      if (opts?.resetStack) setCursorStack([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load integration logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries({ resetStack: true });
  }, [loadEntries]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => void loadEntries({ cursor, resetStack: true })}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            Integration Logs
          </Badge>
          <div className="text-xs text-[var(--muted-foreground)]">{entries.length} entries</div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Time</TableHead>
              <TableHead className="w-40">Integration</TableHead>
              <TableHead className="w-24">Type</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-40">Endpoint</TableHead>
              <TableHead className="w-24">Duration</TableHead>
              <TableHead className="w-48">Request</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--muted-foreground)]">
                    <Spinner className="size-4" />
                    Loading integration logs...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>Unable to Load Logs</EmptyTitle>
                      <EmptyDescription>{error}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>No Integration Logs Yet</EmptyTitle>
                      <EmptyDescription>
                        Integration API events are logged on Mercury sync failures. Run a sync or trigger an error to populate this table.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && entries.map((entry) => {
              const timestamp = formatTimestamp(entry.createdAt);
              const integrationLabel = entry.integrationProvider
                ? `${entry.integrationName} (${entry.integrationProvider})`
                : entry.integrationName;
              return (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm text-[var(--muted-foreground)]">
                    <div>{timestamp.date}</div>
                    <div className="text-xs">{timestamp.time}</div>
                  </TableCell>
                  <TableCell className="text-sm">{integrationLabel}</TableCell>
                  <TableCell>{entry.logType}</TableCell>
                  <TableCell><StatusBadge status={entry.status} /></TableCell>
                  <TableCell className="text-xs font-mono truncate max-w-[10rem]">{entry.endpoint ?? '—'}</TableCell>
                  <TableCell className="font-mono text-sm">{formatDuration(entry.durationMs)}</TableCell>
                  <TableCell className="text-xs font-mono text-[var(--muted-foreground)] max-w-xs truncate">
                    {maskIntegrationPayload(entry.requestPayload)}
                  </TableCell>
                  <TableCell className="text-xs text-[var(--muted-foreground)] max-w-xs truncate">
                    {entry.errorMessage ?? '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-6 py-4 border-t text-sm">
          <div className="text-[var(--muted-foreground)]">
            {entries.length === 0 ? 'Showing 0 entries' : `Showing ${entries.length} entries`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={cursorStack.length === 0 || loading}
              onClick={() => {
                const previous = cursorStack[cursorStack.length - 1] ?? null;
                setCursorStack((stack) => stack.slice(0, -1));
                void loadEntries({ cursor: previous });
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!nextCursor || loading}
              onClick={() => {
                setCursorStack((stack) => [...stack, cursor]);
                void loadEntries({ cursor: nextCursor });
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function ObservabilityPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em]" style={{ borderColor: 'color-mix(in srgb, var(--border) 72%, #111111 28%)', background: 'color-mix(in srgb, var(--card) 84%, #f3efe7 16%)', color: 'var(--muted-foreground)' }}>
          Observability
        </div>
        <Link href="/admin/log" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline-offset-4 hover:underline">
          View activity log →
        </Link>
      </div>

      <Tabs defaultValue="bank-sync">
        <TabsList variant="underline">
          <TabsTab value="bank-sync">Bank sync</TabsTab>
          <TabsTab value="integrations">Integrations</TabsTab>
        </TabsList>

        <TabsPanel value="bank-sync" className="pt-6">
          <BankSyncTab />
        </TabsPanel>
        <TabsPanel value="integrations" className="pt-6">
          <IntegrationsTab />
        </TabsPanel>
      </Tabs>

      <div className="text-xs text-[var(--muted-foreground)]">
        Operational logs for bank sync and third-party integrations. Database change history lives on the{' '}
        <Link href="/admin/log" className="underline underline-offset-2">activity log</Link>.
      </div>
    </div>
  );
}
