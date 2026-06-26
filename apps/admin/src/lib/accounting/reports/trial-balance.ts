import 'server-only';

import { filterTopLevelRows, loadCoaHierarchy } from '@/src/lib/accounting/chart-of-accounts';
import { sum, toAmountString, toDecimal } from '@/src/lib/accounting/money';
import { aggregateAccountsThroughDate } from '@/src/lib/accounting/reports/aggregates';
import type { TrialBalanceReport } from '@/src/lib/accounting/reports/types';

function trialBalanceColumns(balance: string): { debit: string; credit: string } {
  const amount = toDecimal(balance);
  if (amount.isZero()) {
    return { debit: '0.00', credit: '0.00' };
  }
  if (amount.isPositive()) {
    return { debit: toAmountString(amount), credit: '0.00' };
  }
  return { debit: '0.00', credit: toAmountString(amount.abs()) };
}

export async function buildTrialBalanceReport(from: string, to: string): Promise<TrialBalanceReport> {
  const [aggregates, hierarchy] = await Promise.all([
    aggregateAccountsThroughDate(to),
    loadCoaHierarchy(),
  ]);
  const topLevelAggregates = filterTopLevelRows(aggregates, hierarchy);
  const rows = topLevelAggregates.map((row) => {
    const columns = trialBalanceColumns(row.balance);
    return {
      code: row.code,
      name: row.name,
      type: row.type,
      debit: columns.debit,
      credit: columns.credit,
    };
  });

  const totalDebits = toAmountString(sum(rows.map((row) => row.debit)));
  const totalCredits = toAmountString(sum(rows.map((row) => row.credit)));

  return {
    reportType: 'trial-balance',
    title: 'Trial Balance',
    from,
    to,
    generatedAt: new Date().toISOString(),
    rows,
    totalDebits,
    totalCredits,
  };
}
