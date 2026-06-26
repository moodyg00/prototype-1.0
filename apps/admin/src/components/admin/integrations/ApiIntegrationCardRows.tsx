'use client';

import { ArrowUpRight, Clock, Globe, KeyRound } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ApiAuthType, ApiEnvironment, ApiProvider, IntegrationStatus } from '@/src/lib/validation/api-integrations';

export type ApiIntegrationRow = {
  id: string;
  name: string;
  description: string | null;
  status: IntegrationStatus;
  provider: ApiProvider | string | null;
  environment: ApiEnvironment | string | null;
  baseUrl: string | null;
  authType: ApiAuthType | string | null;
  maskedApiKey: string;
  lastConnectedAt: string | null;
};

const STATUS_VARIANT: Record<IntegrationStatus, 'success' | 'secondary' | 'error'> = {
  active: 'success',
  inactive: 'secondary',
  error: 'error',
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'API'
  );
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

function formatWhen(value: string | null): string {
  if (!value) return 'Never connected';
  return new Date(value).toLocaleString();
}

export interface ApiIntegrationCardRowsProps {
  rows: ReadonlyArray<ApiIntegrationRow>;
  onEdit: (row: ApiIntegrationRow) => void;
}

export function ApiIntegrationCardRows({ rows, onEdit }: ApiIntegrationCardRowsProps) {
  const sorted = [...rows].sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === 'active') return -1;
      if (b.status === 'active') return 1;
    }
    return a.name.localeCompare(b.name);
  });

  if (sorted.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center text-sm text-muted-foreground"
        style={{ borderColor: 'var(--border)' }}
      >
        No API integrations yet. Add Mercury, Stripe, or other service connections here.
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
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                {shortId(row.id)}
              </span>
              <Badge size="sm" variant={STATUS_VARIANT[row.status as IntegrationStatus]} className="capitalize">
                {row.status}
              </Badge>
              {row.provider ? (
                <Badge size="sm" variant="outline" className="capitalize">
                  {row.provider}
                </Badge>
              ) : null}
              {row.environment ? (
                <Badge size="sm" variant="info" className="capitalize">
                  {row.environment}
                </Badge>
              ) : null}
            </div>
            <div className="mt-0.5 truncate font-semibold">{row.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {row.baseUrl ? (
                <span className="inline-flex max-w-[240px] items-center gap-1 truncate">
                  <Globe className="size-3 shrink-0" /> {row.baseUrl}
                </span>
              ) : (
                <span>{row.description ?? 'No base URL'}</span>
              )}
              <span className="inline-flex items-center gap-1 capitalize">
                <KeyRound className="size-3" /> {row.authType?.replace('_', ' ') ?? 'api key'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {formatWhen(row.lastConnectedAt)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">{row.maskedApiKey}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              API key
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
