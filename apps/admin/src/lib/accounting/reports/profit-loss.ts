import 'server-only';

import { sub, sum, toAmountString } from '@/src/lib/accounting/money';
import { aggregateAccountsForPeriod } from '@/src/lib/accounting/reports/aggregates';
import type { ProfitLossReport } from '@/src/lib/accounting/reports/types';

export async function buildProfitLossReport(from: string, to: string): Promise<ProfitLossReport> {
  const aggregates = await aggregateAccountsForPeriod(from, to);
  const income = aggregates.filter((row) => row.type === 'income');
  const expenses = aggregates.filter((row) => row.type === 'expense');

  const totalIncome = toAmountString(sum(income.map((row) => row.balance)));
  const totalExpenses = toAmountString(sum(expenses.map((row) => row.balance)));
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
