'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../../../src/components/admin/StatusBadge';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty';
import { Input } from '../../../components/ui/input';
import { Spinner } from '../../../components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

type UserStatus = 'active' | 'blocked';
type UsersApiRow = {
  id: string;
  fullName: string;
  email: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
};

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  lastSeenLabel: string;
  createdAtLabel: string;
}

function formatRelativeOrNever(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  const ms = Date.now() - date.getTime();
  if (Number.isNaN(ms) || ms < 0) return 'Never';
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (ms < minute) return 'Just now';
  if (ms < hour) return `${Math.floor(ms / minute)}m ago`;
  if (ms < day) return `${Math.floor(ms / hour)}h ago`;
  return `${Math.floor(ms / day)}d ago`;
}

function formatCreatedDate(value: string | null) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function UsersPage() {
  const [rows, setRows] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      const payload = (await response.json()) as { users?: UsersApiRow[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to load users.');
      }
      const normalized = (payload.users ?? []).map((user) => ({
        id: user.id,
        name: user.fullName || user.email || user.id,
        email: user.email ?? 'No email',
        role: user.role,
        status: user.isActive ? 'active' : 'blocked',
        lastSeenLabel: formatRelativeOrNever(user.lastLoginAt),
        createdAtLabel: formatCreatedDate(user.createdAt),
      }));
      setRows(normalized);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(rows.map((row) => row.role).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
    return ['all', ...roles];
  }, [rows]);

  const filtered = rows
    .filter((row) => (roleFilter === 'all' ? true : row.role === roleFilter))
    .filter((row) => {
      const q = search.toLowerCase();
      return (
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      );
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em]" style={{ borderColor: 'color-mix(in srgb, var(--border) 72%, #111111 28%)', background: 'color-mix(in srgb, var(--card) 84%, #f3efe7 16%)', color: 'var(--muted-foreground)' }}>
          Users
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => toast('Export users list (coming soon)')}>Export</Button>
          <Button onClick={() => void loadUsers()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-[var(--muted-foreground)]" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>
        <div className="flex gap-2">
          {roleOptions.map((value) => (
            <Button
              key={value}
              onClick={() => setRoleFilter(value)}
              variant={roleFilter === value ? 'default' : 'secondary'}
              size="sm"
            >
              {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">All Records</Badge>
          <div className="text-xs text-[var(--muted-foreground)]">{filtered.length} users</div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="w-28">Role</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28">Last Seen</TableHead>
              <TableHead className="w-32">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--muted-foreground)]">
                    <Spinner className="size-4" />
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>Unable to Load Users</EmptyTitle>
                      <EmptyDescription>{error}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>No Users Found</EmptyTitle>
                      <EmptyDescription>No users match your filters.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {paginated.map((user) => (
              <TableRow key={user.id} className="hover:bg-[var(--muted)]/50 group">
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{user.email}</div>
                  <div className="text-[10px] font-mono text-[var(--muted-foreground)]">{user.id}</div>
                </TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell><StatusBadge status={user.status} /></TableCell>
                <TableCell className="text-sm text-[var(--muted-foreground)]">{user.lastSeenLabel}</TableCell>
                <TableCell className="text-xs text-[var(--muted-foreground)]">{user.createdAtLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-6 py-4 border-t text-sm">
          <div className="text-[var(--muted-foreground)]">
            Showing {filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="px-3 text-[var(--muted-foreground)]">Page {currentPage} of {totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </Card>

      <div className="text-xs text-[var(--muted-foreground)]">COSS UI CardFrame • role sync + invite controls ready</div>
    </div>
  );
}
