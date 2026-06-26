'use client';

import { Copy, Link2, Mail, Pencil, Power } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BookingLinkKind } from '@/src/lib/validation/scheduling';

export type BookingLinkRow = {
  id: string;
  name: string;
  slug: string;
  publicToken: string;
  linkKind: BookingLinkKind;
  isActive: boolean;
  bookingsCount: number;
  lastUsedAt?: string | null;
  contactEmail?: string | null;
};

const KIND_VARIANT: Record<BookingLinkKind, 'info' | 'warning' | 'success'> = {
  standard: 'info',
  personalized: 'warning',
  confirmation: 'success',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'BL';
}

export interface BookingLinkCardRowsProps {
  rows: ReadonlyArray<BookingLinkRow>;
  onCopy: (row: BookingLinkRow) => void;
  onEmail: (row: BookingLinkRow) => void;
  onEdit: (row: BookingLinkRow) => void;
  onToggleActive: (row: BookingLinkRow) => void;
  emailingId?: string | null;
}

export function BookingLinkCardRows({
  rows,
  onCopy,
  onEmail,
  onEdit,
  onToggleActive,
  emailingId,
}: BookingLinkCardRowsProps) {
  // Sort active links first, then by name.
  const sorted = [...rows].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground" style={{ borderColor: 'var(--border)' }}>
        No booking links yet. Create one to start collecting bookings.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((r) => (
        <div
          key={r.id}
          className="group flex items-center gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', opacity: r.isActive ? 1 : 0.6 }}
        >
          <Avatar className="size-10">
            <AvatarFallback style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              {initials(r.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge size="sm" variant={KIND_VARIANT[r.linkKind]} className="capitalize">
                {r.linkKind}
              </Badge>
              {!r.isActive && (
                <Badge size="sm" variant="secondary">
                  Inactive
                </Badge>
              )}
            </div>
            <div className="mt-0.5 truncate font-semibold">{r.name}</div>
            <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span className="inline-flex items-center gap-1">
                <Link2 className="size-3" /> /book/{r.slug}
              </span>
              <span className="tabular-nums">{r.bookingsCount} bookings</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => onCopy(r)}>
              <Copy className="h-4 w-4" />
              Copy URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={emailingId === r.id}
              onClick={() => onEmail(r)}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(r)} aria-label="Edit link">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onToggleActive(r)}
              aria-label={r.isActive ? 'Deactivate link' : 'Activate link'}
            >
              <Power className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
