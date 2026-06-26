'use client';

import { ArrowUpRight, Globe, UserRound } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export type CredentialRow = {
  id: string;
  name: string;
  siteUrl: string | null;
  username: string;
  maskedPassword: string;
  isActive: boolean;
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'CR'
  );
}

export interface CredentialCardRowsProps {
  rows: ReadonlyArray<CredentialRow>;
  onEdit: (row: CredentialRow) => void;
}

export function CredentialCardRows({ rows, onEdit }: CredentialCardRowsProps) {
  const sorted = [...rows].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (sorted.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center text-sm text-muted-foreground"
        style={{ borderColor: 'var(--border)' }}
      >
        No saved logins yet. Add website credentials for dashboards and vendor portals.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((row) => (
        <div
          key={row.id}
          role="button"
          tabIndex={0}
          className="group flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)',
            opacity: row.isActive ? 1 : 0.65,
          }}
          onClick={() => onEdit(row)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onEdit(row);
            }
          }}
        >
          <Avatar className="size-10">
            <AvatarFallback style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              {initials(row.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {!row.isActive ? (
                <Badge size="sm" variant="secondary">
                  Inactive
                </Badge>
              ) : null}
            </div>
            <div className="mt-0.5 truncate font-semibold">{row.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span className="inline-flex items-center gap-1">
                <UserRound className="size-3" /> {row.username}
              </span>
              {row.siteUrl ? (
                <span className="inline-flex max-w-[260px] items-center gap-1 truncate">
                  <Globe className="size-3 shrink-0" /> {row.siteUrl}
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">{row.maskedPassword}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Password
            </div>
          </div>
          <ArrowUpRight
            className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: 'var(--muted-foreground)' }}
          />
        </div>
      ))}
    </div>
  );
}
