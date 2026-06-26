import type { ReportFormat, ReportType } from '@/src/lib/validation/accounting-report';

export type ReportAccountRow = {
  accountId: string;
  code: string;
  name: string;
  type: string;
  subType: string | null;
  debitTotal: string;
  creditTotal: string;
  balance: string;
};

export type TrialBalanceReport = {
  reportType: 'trial-balance';
  title: string;
  from: string;
  to: string;
  generatedAt: string;
  rows: Array<{
    code: string;
    name: string;
    type: string;
    debit: string;
    credit: string;
  }>;
  totalDebits: string;
  totalCredits: string;
};

export type ProfitLossReport = {
  reportType: 'profit-loss';
  title: string;
  from: string;
  to: string;
  generatedAt: string;
  income: ReportAccountRow[];
  expenses: ReportAccountRow[];
  totalIncome: string;
  totalExpenses: string;
  netIncome: string;
};

export type BalanceSheetReport = {
  reportType: 'balance-sheet';
  title: string;
  from: string;
  to: string;
  generatedAt: string;
  assets: ReportAccountRow[];
  liabilities: ReportAccountRow[];
  equity: ReportAccountRow[];
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  totalLiabilitiesAndEquity: string;
};

export type GeneralLedgerReport = {
  reportType: 'general-ledger';
  title: string;
  from: string;
  to: string;
  generatedAt: string;
  lines: Array<{
    entryDate: string;
    entryNumber: string;
    accountCode: string;
    accountName: string;
    description: string | null;
    reference: string | null;
    debit: string;
    credit: string;
  }>;
  totalDebits: string;
  totalCredits: string;
};

export type AccountingReportData =
  | TrialBalanceReport
  | ProfitLossReport
  | BalanceSheetReport
  | GeneralLedgerReport;

export type GeneratedAccountingReport = {
  reportType: ReportType;
  title: string;
  from: string;
  to: string;
  format: ReportFormat;
  previewHtml: string;
  downloadContent: string;
  downloadMimeType: string;
  downloadFilename: string;
};
