import 'server-only';

import { filterTopLevelRows, loadCoaHierarchy } from '@/src/lib/accounting/chart-of-accounts';
import { sub, sum, toAmountString } from '@/src/lib/accounting/money';
import { aggregateAccountsForPeriod } from '@/src/lib/accounting/reports/aggregates';
import type { ProfitLossReport } from '@/src/lib/accounting/reports/types';

export async function buildProfitLossReport(from: string, to: string): Promise<ProfitLossReport> {
  const [aggregates, hierarchy] = await Promise.all([
    aggregateAccountsForPeriod(from, to),
    loadCoaHierarchy(),
  ]);
  const income = aggregates.filter((row) => row.type === 'income');
  const expenses = aggregates.filter((row) => row.type === 'expense');
  const topLevelIncome = filterTopLevelRows(income, hierarchy);
  const topLevelExpenses = filterTopLevelRows(expenses, hierarchy);

  const totalIncome = toAmountString(sum(topLevelIncome.map((row) => row.balance)));
  const totalExpenses = toAmountString(sum(topLevelExpenses.map((row) => row.balance)));
  const netIncome = toAmountString(sub(totalIncome, totalExpenses));

  return {
    reportType: 'profit-loss',
    title: 'Profit & Loss',
    from,
    to,
    generatedAt: new Date().toISOString(),
    income,
    expenses,
    totalIncome,
    totalExpenses,
    netIncome,
  };
}
