import {
  BookOpen,
  FileSpreadsheet,
  Landmark,
  Scale,
  type LucideIcon,
} from 'lucide-react';

import type { ReportFormat, ReportType } from '@/src/lib/validation/accounting-report';

export type ReportDefinition = {
  id: ReportType;
  name: string;
  description: string;
  icon: LucideIcon;
  formats: ReportFormat[];
};

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'trial-balance',
    name: 'Trial Balance',
    description: 'Debit and credit balances for all accounts as of the end date.',
    icon: Scale,
    formats: ['pdf', 'markdown', 'csv'],
  },
  {
    id: 'profit-loss',
    name: 'Profit & Loss',
    description: 'Income and expense activity for the selected period.',
    icon: FileSpreadsheet,
    formats: ['pdf', 'markdown', 'csv'],
  },
  {
    id: 'balance-sheet',
    name: 'Balance Sheet',
    description: 'Assets, liabilities, and equity as of the end date.',
    icon: Landmark,
    formats: ['pdf', 'markdown'],
  },
  {
    id: 'general-ledger',
    name: 'General Ledger',
    description: 'Posted journal lines for the selected period.',
    icon: BookOpen,
    formats: ['pdf', 'markdown', 'csv'],
  },
];

export function getReportDefinition(id: ReportType): ReportDefinition {
  const definition = REPORT_DEFINITIONS.find((report) => report.id === id);
  if (!definition) {
    throw new Error(`Unknown report type: ${id}`);
  }
  return definition;
}

export const FORMAT_LABELS: Record<ReportFormat, string> = {
  pdf: 'PDF',
  markdown: 'Markdown',
  csv: 'CSV',
};
