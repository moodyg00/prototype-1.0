'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../../../src/components/admin/StatusBadge';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

type UserStatus = 'active' | 'pending' | 'blocked';
type UserRole = 'admin' | 'manager' | 'operator';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastSeen: string;
}

const mockUsers: UserRecord[] = [
  { id: 'usr_001', name: 'Jordan Diaz', email: 'jordan@proto2.app', role: 'admin', status: 'active', lastSeen: '2m ago' },
  { id: 'usr_002', name: 'Nina Tran', email: 'nina@proto2.app', role: 'manager', status: 'active', lastSeen: '19m ago' },
  { id: 'usr_003', name: 'Sam Ortega', email: 'sam@proto2.app', role: 'operator', status: 'pending', lastSeen: 'never' },
  { id: 'usr_004', name: 'Maya Chen', email: 'maya@proto2.app', role: 'manager', status: 'active', lastSeen: '1h ago' },
  { id: 'usr_005', name: 'Alex Reid', email: 'alex@proto2.app', role: 'operator', status: 'blocked', lastSeen: '4d ago' },
];

export default function UsersPage() {
  const router = useRouter();
  const [rows] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const filtered = rows
    .filter((row) => (roleFilter === 'all' ? true : row.role === roleFilter))
    .filter((row) => {
      const q = search.toLowerCase();
      return row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q);
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
          <Button variant="secondary" onClick={() => toast('Export users list (demo)')}>Export</Button>
          <Button onClick={() => toast.success('Invite link copied (demo)')}>Invite User</Button>
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
          {(['all', 'admin', 'manager', 'operator'] as const).map((value) => (
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
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
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
              <TableRow
                key={user.id}
                className="hover:bg-[var(--muted)]/50 group cursor-pointer"
                onClick={() => router.push(`/admin/users/${user.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/admin/users/${user.id}`);
                  }
                }}
                tabIndex={0}
              >
                <TableCell>
                  <div className="font-medium"><Link href={`/admin/users/${user.id}`} className="underline-offset-4 hover:underline">{user.name}</Link></div>
                  <div className="text-xs text-[var(--muted-foreground)]">{user.email}</div>
                </TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell><StatusBadge status={user.status} /></TableCell>
                <TableCell className="text-sm text-[var(--muted-foreground)]">{user.lastSeen}</TableCell>
                <TableCell className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/admin/users/${user.id}`}>
                    <Button variant="secondary" size="xs">View</Button>
                  </Link>
                </TableCell>
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
