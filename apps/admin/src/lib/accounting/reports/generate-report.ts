import 'server-only';

import { buildBalanceSheetReport } from '@/src/lib/accounting/reports/balance-sheet';
import {
  buildDownloadFilename,
  formatReportCsv,
  formatReportHtml,
  formatReportMarkdown,
} from '@/src/lib/accounting/reports/format-report';
import { buildGeneralLedgerReport } from '@/src/lib/accounting/reports/general-ledger';
import { buildProfitLossReport } from '@/src/lib/accounting/reports/profit-loss';
import { buildTrialBalanceReport } from '@/src/lib/accounting/reports/trial-balance';
import type { AccountingReportData, GeneratedAccountingReport } from '@/src/lib/accounting/reports/types';
import type { AccountingReportGenerateInput } from '@/src/lib/validation/accounting-report';

async function buildReportData(input: AccountingReportGenerateInput): Promise<AccountingReportData> {
  switch (input.reportType) {
    case 'trial-balance':
      return buildTrialBalanceReport(input.from, input.to);
    case 'profit-loss':
      return buildProfitLossReport(input.from, input.to);
    case 'balance-sheet':
      return buildBalanceSheetReport(input.from, input.to);
    case 'general-ledger':
      return buildGeneralLedgerReport(input.from, input.to);
    default:
      throw new Error(`Unsupported report type: ${input.reportType satisfies never}`);
  }
}

function assertCsvSupported(report: AccountingReportData): void {
  if (report.reportType === 'balance-sheet') {
    throw new Error('CSV export is not available for balance sheet reports.');
  }
}

export async function generateAccountingReport(
  input: AccountingReportGenerateInput,
): Promise<GeneratedAccountingReport> {
  const report = await buildReportData(input);
  const previewHtml = formatReportHtml(report);

  if (input.format === 'csv') {
    assertCsvSupported(report);
    const downloadContent = formatReportCsv(report);
    return {
      reportType: input.reportType,
      title: report.title,
      from: input.from,
      to: input.to,
      format: input.format,
      previewHtml,
      downloadContent,
      downloadMimeType: 'text/csv;charset=utf-8',
      downloadFilename: buildDownloadFilename(report.reportType, input.from, input.to, 'csv'),
    };
  }

  if (input.format === 'markdown') {
    const downloadContent = formatReportMarkdown(report);
    return {
      reportType: input.reportType,
      title: report.title,
      from: input.from,
      to: input.to,
      format: input.format,
      previewHtml,
      downloadContent,
      downloadMimeType: 'text/markdown;charset=utf-8',
      downloadFilename: buildDownloadFilename(report.reportType, input.from, input.to, 'md'),
    };
  }

  return {
    reportType: input.reportType,
    title: report.title,
    from: input.from,
    to: input.to,
    format: input.format,
    previewHtml,
    downloadContent: previewHtml,
    downloadMimeType: 'text/html;charset=utf-8',
    downloadFilename: buildDownloadFilename(report.reportType, input.from, input.to, 'html'),
  };
}
