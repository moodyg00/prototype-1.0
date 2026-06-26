import 'server-only';

import { sum, toAmountString } from '@/src/lib/accounting/money';
import { aggregateAccountsThroughDate } from '@/src/lib/accounting/reports/aggregates';
import type { BalanceSheetReport } from '@/src/lib/accounting/reports/types';

export async function buildBalanceSheetReport(from: string, to: string): Promise<BalanceSheetReport> {
  const aggregates = await aggregateAccountsThroughDate(to);
  const assets = aggregates.filter((row) => row.type === 'asset');
  const liabilities = aggregates.filter((row) => row.type === 'liability');
  const equity = aggregates.filter((row) => row.type === 'equity');

  const totalAssets = toAmountString(sum(assets.map((row) => row.balance)));
  const totalLiabilities = toAmountString(sum(liabilities.map((row) => row.balance)));
  const totalEquity = toAmountString(sum(equity.map((row) => row.balance)));
  const totalLiabilitiesAndEquity = toAmountString(sum([totalLiabilities, totalEquity]));

  return {
    reportType: 'balance-sheet',
    title: 'Balance Sheet',
    from,
    to,
    generatedAt: new Date().toISOString(),
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity,
  };
}
