import 'server-only';

import { format, startOfMonth } from 'date-fns';

import { filterTopLevelRows, loadCoaHierarchy } from '@/src/lib/accounting/chart-of-accounts';
import type { FinanceKpis } from '@/src/lib/accounting/finance-kpi-types';
import { sum, toAmountString } from '@/src/lib/accounting/money';
import {
  aggregateAccountsForPeriod,
  aggregateAccountsThroughDate,
} from '@/src/lib/accounting/reports/aggregates';

function isoDate(value: Date): string {
  return format(value, 'yyyy-MM-dd');
}

function findBalanceByCode(
  rows: ReadonlyArray<{ code: string; balance: string }>,
  code: string,
): string {
  return rows.find((row) => row.code === code)?.balance ?? '0.00';
}

export async function getFinanceKpis(options?: {
  from?: string;
  to?: string;
}): Promise<FinanceKpis> {
  const today = new Date();
  const periodFrom = options?.from ?? isoDate(startOfMonth(today));
  const periodTo = options?.to ?? isoDate(today);

  const [periodAggregates, balanceAggregates, hierarchy] = await Promise.all([
    aggregateAccountsForPeriod(periodFrom, periodTo),
    aggregateAccountsThroughDate(periodTo),
    loadCoaHierarchy(),
  ]);

  const topLevelPeriod = filterTopLevelRows(periodAggregates, hierarchy);
  const expenseRows = topLevelPeriod.filter((row) => row.type === 'expense');

  return {
    periodFrom,
    periodTo,
    periodLabel: `${periodFrom} through ${periodTo}`,
    cashPosition: findBalanceByCode(balanceAggregates, '1000'),
    totalExpenses: toAmountString(sum(expenseRows.map((row) => row.balance))),
    cogs: toAmountString(
      sum(expenseRows.filter((row) => row.subType === 'cogs').map((row) => row.balance)),
    ),
    operatingExpenses: toAmountString(
      sum(
        expenseRows
          .filter((row) => row.subType === 'operating_expense')
          .map((row) => row.balance),
      ),
    ),
    ownerCapitalGrant: findBalanceByCode(balanceAggregates, '3010'),
    ownerCapitalJohn: findBalanceByCode(balanceAggregates, '3020'),
  };
}

export type { FinanceKpis };
