export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Default ledger filter: from 30 days ago through today (UTC calendar dates). */
export function defaultLedgerDateRange(): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - 30);
  return { from: isoDate(from), to: isoDate(today) };
}
