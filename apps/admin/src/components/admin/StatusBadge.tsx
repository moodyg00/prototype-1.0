import React from 'react';

type Props = {
  status: string;
  kind?: 'status' | 'priority';
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  blocked: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
  open: 'bg-blue-100 text-blue-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-700',
  paid: 'bg-emerald-100 text-emerald-800',
  sent: 'bg-violet-100 text-violet-800',
  draft: 'bg-gray-100 text-gray-700',
  ignored: 'bg-gray-100 text-gray-500',
  categorized: 'bg-emerald-100 text-emerald-800',
  create: 'bg-emerald-100 text-emerald-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  automation: 'bg-violet-100 text-violet-800',
};

export function StatusBadge({ status, kind = 'status' }: Props) {
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  const color = statusColors[normalized] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`status-badge ${color}`}>
      {status}
    </span>
  );
}
