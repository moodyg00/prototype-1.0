import { formatAmount } from '@/src/lib/accounting/money';
import type {
  AccountingReportData,
  BalanceSheetReport,
  GeneralLedgerReport,
  ProfitLossReport,
  TrialBalanceReport,
} from '@/src/lib/accounting/reports/types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPeriod(from: string, to: string): string {
  return `${from} through ${to}`;
}

function reportHeaderHtml(title: string, from: string, to: string): string {
  return `
    <header style="margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;">${escapeHtml(title)}</h1>
      <p style="margin:0;font-size:13px;color:#525252;">Period: ${escapeHtml(formatPeriod(from, to))}</p>
    </header>
  `;
}

function tableStyles(): string {
  return 'width:100%;border-collapse:collapse;font-size:13px;';
}

function thStyles(): string {
  return 'padding:8px 10px;border-bottom:2px solid #171717;text-align:left;font-weight:600;';
}

function tdStyles(): string {
  return 'padding:8px 10px;border-bottom:1px solid #e5e5e5;vertical-align:top;';
}

function amountCell(value: string, align: 'left' | 'right' = 'right'): string {
  return `<td style="${tdStyles()}text-align:${align};font-variant-numeric:tabular-nums;">${escapeHtml(formatAmount(value))}</td>`;
}

function trialBalanceHtml(report: TrialBalanceReport): string {
  const rows = report.rows
    .map(
      (row) => `
        <tr>
          <td style="${tdStyles()}">${escapeHtml(row.code)}</td>
          <td style="${tdStyles()}">${escapeHtml(row.name)}</td>
          ${amountCell(row.debit)}
          ${amountCell(row.credit)}
        </tr>
      `,
    )
    .join('');

  return `
    ${reportHeaderHtml(report.title, report.from, report.to)}
    <table style="${tableStyles()}">
      <thead>
        <tr>
          <th style="${thStyles()}">Code</th>
          <th style="${thStyles()}">Account</th>
          <th style="${thStyles()}text-align:right;">Debit</th>
          <th style="${thStyles()}text-align:right;">Credit</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td style="${tdStyles()}font-weight:600;" colspan="2">Totals</td>
          ${amountCell(report.totalDebits)}
          ${amountCell(report.totalCredits)}
        </tr>
      </tbody>
    </table>
  `;
}

function accountSectionHtml(title: string, rows: BalanceSheetReport['assets'], totalLabel: string, total: string): string {
  const body = rows
    .map(
      (row) => `
        <tr>
          <td style="${tdStyles()}">${escapeHtml(row.code)}</td>
          <td style="${tdStyles()}">${escapeHtml(row.name)}</td>
          ${amountCell(row.balance)}
        </tr>
      `,
    )
    .join('');

  return `
    <section style="margin-bottom:24px;">
      <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;">${escapeHtml(title)}</h2>
      <table style="${tableStyles()}">
        <thead>
          <tr>
            <th style="${thStyles()}">Code</th>
            <th style="${thStyles()}">Account</th>
            <th style="${thStyles()}text-align:right;">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${body || `<tr><td style="${tdStyles()}" colspan="3">No activity.</td></tr>`}
          <tr>
            <td style="${tdStyles()}font-weight:600;" colspan="2">${escapeHtml(totalLabel)}</td>
            ${amountCell(total)}
          </tr>
        </tbody>
      </table>
    </section>
  `;
}

function balanceSheetHtml(report: BalanceSheetReport): string {
  return `
    ${reportHeaderHtml(report.title, report.from, report.to)}
    ${accountSectionHtml('Assets', report.assets, 'Total assets', report.totalAssets)}
    ${accountSectionHtml('Liabilities', report.liabilities, 'Total liabilities', report.totalLiabilities)}
    ${accountSectionHtml('Equity', report.equity, 'Total equity', report.totalEquity)}
    <p style="margin:0;font-size:13px;font-weight:600;">
      Total liabilities &amp; equity: ${escapeHtml(formatAmount(report.totalLiabilitiesAndEquity))}
    </p>
  `;
}

function profitLossHtml(report: ProfitLossReport): string {
  return `
    ${reportHeaderHtml(report.title, report.from, report.to)}
    ${accountSectionHtml('Income', report.income, 'Total income', report.totalIncome)}
    ${accountSectionHtml('Expenses', report.expenses, 'Total expenses', report.totalExpenses)}
    <p style="margin:0;font-size:14px;font-weight:600;">
      Net income: ${escapeHtml(formatAmount(report.netIncome))}
    </p>
  `;
}

function generalLedgerHtml(report: GeneralLedgerReport): string {
  const rows = report.lines
    .map(
      (line) => `
        <tr>
          <td style="${tdStyles()}">${escapeHtml(line.entryDate)}</td>
          <td style="${tdStyles()}">${escapeHtml(line.entryNumber)}</td>
          <td style="${tdStyles()}">${escapeHtml(line.accountCode)}</td>
          <td style="${tdStyles()}">${escapeHtml(line.accountName)}</td>
          <td style="${tdStyles()}">${escapeHtml(line.description ?? '—')}</td>
          ${amountCell(line.debit)}
          ${amountCell(line.credit)}
        </tr>
      `,
    )
    .join('');

  return `
    ${reportHeaderHtml(report.title, report.from, report.to)}
    <table style="${tableStyles()}">
      <thead>
        <tr>
          <th style="${thStyles()}">Date</th>
          <th style="${thStyles()}">Entry</th>
          <th style="${thStyles()}">Code</th>
          <th style="${thStyles()}">Account</th>
          <th style="${thStyles()}">Description</th>
          <th style="${thStyles()}text-align:right;">Debit</th>
          <th style="${thStyles()}text-align:right;">Credit</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td style="${tdStyles()}" colspan="7">No lines in this period.</td></tr>`}
        <tr>
          <td style="${tdStyles()}font-weight:600;" colspan="5">Totals</td>
          ${amountCell(report.totalDebits)}
          ${amountCell(report.totalCredits)}
        </tr>
      </tbody>
    </table>
  `;
}

export function formatReportHtml(report: AccountingReportData): string {
  const body =
    report.reportType === 'trial-balance'
      ? trialBalanceHtml(report)
      : report.reportType === 'profit-loss'
        ? profitLossHtml(report)
        : report.reportType === 'balance-sheet'
          ? balanceSheetHtml(report)
          : generalLedgerHtml(report);

  return `<div style="padding:32px;font-family:ui-sans-serif,system-ui,sans-serif;color:#171717;background:#ffffff;">${body}</div>`;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvLine(values: string[]): string {
  return `${values.map(csvEscape).join(',')}\n`;
}

export function formatReportCsv(report: AccountingReportData): string {
  if (report.reportType === 'trial-balance') {
    let content = csvLine(['Code', 'Account', 'Type', 'Debit', 'Credit']);
    for (const row of report.rows) {
      content += csvLine([row.code, row.name, row.type, row.debit, row.credit]);
    }
    content += csvLine(['', 'Totals', '', report.totalDebits, report.totalCredits]);
    return content;
  }

  if (report.reportType === 'profit-loss') {
    let content = csvLine(['Section', 'Code', 'Account', 'Amount']);
    for (const row of report.income) {
      content += csvLine(['Income', row.code, row.name, row.balance]);
    }
    for (const row of report.expenses) {
      content += csvLine(['Expense', row.code, row.name, row.balance]);
    }
    content += csvLine(['Summary', '', 'Total income', report.totalIncome]);
    content += csvLine(['Summary', '', 'Total expenses', report.totalExpenses]);
    content += csvLine(['Summary', '', 'Net income', report.netIncome]);
    return content;
  }

  if (report.reportType === 'general-ledger') {
    let content = csvLine(['Date', 'Entry', 'Account Code', 'Account Name', 'Description', 'Reference', 'Debit', 'Credit']);
    for (const line of report.lines) {
      content += csvLine([
        line.entryDate,
        line.entryNumber,
        line.accountCode,
        line.accountName,
        line.description ?? '',
        line.reference ?? '',
        line.debit,
        line.credit,
      ]);
    }
    content += csvLine(['', '', '', '', 'Totals', '', report.totalDebits, report.totalCredits]);
    return content;
  }

  return '';
}

export function formatReportMarkdown(report: AccountingReportData): string {
  const header = `# ${report.title}\n\nPeriod: ${formatPeriod(report.from, report.to)}\n\n`;

  if (report.reportType === 'trial-balance') {
    const rows = report.rows
      .map(
        (row) =>
          `| ${row.code} | ${row.name} | ${formatAmount(row.debit)} | ${formatAmount(row.credit)} |`,
      )
      .join('\n');
    return `${header}| Code | Account | Debit | Credit |\n| --- | --- | ---: | ---: |\n${rows}\n\n**Totals:** ${formatAmount(report.totalDebits)} / ${formatAmount(report.totalCredits)}\n`;
  }

  if (report.reportType === 'profit-loss') {
    const incomeRows = report.income
      .map((row) => `| ${row.code} | ${row.name} | ${formatAmount(row.balance)} |`)
      .join('\n');
    const expenseRows = report.expenses
      .map((row) => `| ${row.code} | ${row.name} | ${formatAmount(row.balance)} |`)
      .join('\n');
    return `${header}## Income\n\n| Code | Account | Amount |\n| --- | --- | ---: |\n${incomeRows || '| — | — | 0.00 |'}\n\n**Total income:** ${formatAmount(report.totalIncome)}\n\n## Expenses\n\n| Code | Account | Amount |\n| --- | --- | ---: |\n${expenseRows || '| — | — | 0.00 |'}\n\n**Total expenses:** ${formatAmount(report.totalExpenses)}\n\n**Net income:** ${formatAmount(report.netIncome)}\n`;
  }

  if (report.reportType === 'balance-sheet') {
    const section = (title: string, rows: BalanceSheetReport['assets'], total: string) => {
      const body = rows
        .map((row) => `| ${row.code} | ${row.name} | ${formatAmount(row.balance)} |`)
        .join('\n');
      return `## ${title}\n\n| Code | Account | Balance |\n| --- | --- | ---: |\n${body || '| — | — | 0.00 |'}\n\n**Total ${title.toLowerCase()}:** ${formatAmount(total)}\n`;
    };
    return `${header}${section('Assets', report.assets, report.totalAssets)}\n${section('Liabilities', report.liabilities, report.totalLiabilities)}\n${section('Equity', report.equity, report.totalEquity)}\n**Total liabilities & equity:** ${formatAmount(report.totalLiabilitiesAndEquity)}\n`;
  }

  const rows = report.lines
    .map(
      (line) =>
        `| ${line.entryDate} | ${line.entryNumber} | ${line.accountCode} | ${line.accountName} | ${(line.description ?? '').replace(/\|/g, '\\|')} | ${formatAmount(line.debit)} | ${formatAmount(line.credit)} |`,
    )
    .join('\n');
  return `${header}| Date | Entry | Code | Account | Description | Debit | Credit |\n| --- | --- | --- | --- | --- | ---: | ---: |\n${rows || '| — | — | — | — | — | 0.00 | 0.00 |'}\n\n**Totals:** ${formatAmount(report.totalDebits)} / ${formatAmount(report.totalCredits)}\n`;
}

export function buildDownloadFilename(
  reportType: AccountingReportData['reportType'],
  from: string,
  to: string,
  extension: string,
): string {
  return `${reportType}-${from}-to-${to}.${extension}`;
}
