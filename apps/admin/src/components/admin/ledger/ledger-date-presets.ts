import { isoDate } from '@/src/components/admin/ledger/ledger-default-range';

export type LedgerDatePresetId = 'last7' | 'last30' | 'month' | 'quarter' | 'ytd' | 'lastYear';

export type LedgerDatePreset = LedgerDatePresetId | 'year' | 'all';

export function ledgerDatePresetRange(preset: LedgerDatePreset): { from: string; to: string } {
  const today = new Date();
  const to = isoDate(today);
  if (preset === 'all') return { from: '', to: '' };

  const start = new Date(today);
  if (preset === 'last7') {
    start.setUTCDate(start.getUTCDate() - 7);
    return { from: isoDate(start), to };
  }
  if (preset === 'last30') {
    start.setUTCDate(start.getUTCDate() - 30);
    return { from: isoDate(start), to };
  }
  if (preset === 'month') start.setUTCDate(1);
  if (preset === 'quarter') {
    const quarterStartMonth = Math.floor(start.getUTCMonth() / 3) * 3;
    start.setUTCMonth(quarterStartMonth, 1);
  }
  if (preset === 'lastYear') {
    const year = today.getUTCFullYear() - 1;
    return {
      from: isoDate(new Date(Date.UTC(year, 0, 1))),
      to: isoDate(new Date(Date.UTC(year, 11, 31))),
    };
  }
  if (preset === 'year' || preset === 'ytd') start.setUTCMonth(0, 1);
  return { from: isoDate(start), to };
}

export const REPORT_DATE_PRESETS: ReadonlyArray<{ id: LedgerDatePresetId; label: string }> = [
  { id: 'last7', label: 'Last 7 days' },
  { id: 'last30', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'quarter', label: 'This quarter' },
  { id: 'ytd', label: 'YTD' },
  { id: 'lastYear', label: 'Last year' },
];
