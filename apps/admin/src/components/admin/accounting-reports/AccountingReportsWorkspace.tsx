'use client';

import {
  BarChart3,
  Download,
  Loader2,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { PrintShell } from '@/components/admin/billing/PrintShell';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FORMAT_LABELS,
  REPORT_DEFINITIONS,
  type ReportDefinition,
} from '@/src/components/admin/accounting-reports/report-definitions';
import {
  ledgerDatePresetRange,
  REPORT_DATE_PRESETS,
  type LedgerDatePresetId,
} from '@/src/components/admin/ledger/ledger-date-presets';
import { defaultLedgerDateRange } from '@/src/components/admin/ledger/ledger-default-range';
import { useAdminMainPortalContainer } from '@/src/components/admin/useAdminMainPortalContainer';
import type { GeneratedAccountingReport } from '@/src/lib/accounting/reports/types';
import type { ReportFormat } from '@/src/lib/validation/accounting-report';

type GenerateResponse = GeneratedAccountingReport & {
  error?: string;
};

function downloadBlob(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AccountingReportsWorkspace(): React.ReactElement {
  const defaultRange = React.useMemo(() => defaultLedgerDateRange(), []);
  const adminMainPortal = useAdminMainPortalContainer();
  const [selectedReport, setSelectedReport] = React.useState<ReportDefinition | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [from, setFrom] = React.useState(defaultRange.from);
  const [to, setTo] = React.useState(defaultRange.to);
  const [format, setFormat] = React.useState<ReportFormat>('pdf');
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState<GenerateResponse | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  const openReport = React.useCallback((report: ReportDefinition) => {
    setSelectedReport(report);
    setFrom(defaultRange.from);
    setTo(defaultRange.to);
    setFormat(report.formats[0] ?? 'pdf');
    setGenerated(null);
    setDialogOpen(true);
  }, [defaultRange.from, defaultRange.to]);

  const applyPreset = React.useCallback((preset: LedgerDatePresetId) => {
    const range = ledgerDatePresetRange(preset);
    setFrom(range.from);
    setTo(range.to);
  }, []);

  const handleGenerate = React.useCallback(async () => {
    if (!selectedReport) return;
    if (from > to) {
      toast.error('Start date must be on or before end date.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/accounting-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: selectedReport.id,
          from,
          to,
          format,
        }),
      });
      const body = (await response.json()) as GenerateResponse;
      if (!response.ok) {
        throw new Error(body.error ?? 'Failed to generate report.');
      }
      setGenerated(body);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  }, [selectedReport, from, to, format]);

  const handleDownload = React.useCallback(() => {
    if (!generated) return;

    if (generated.format === 'pdf') {
      const printNode = printRef.current;
      if (!printNode) {
        toast.error('Preview is not ready to print.');
        return;
      }

      const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
      if (!printWindow) {
        toast.error('Allow pop-ups to download PDF via print.');
        return;
      }

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>${generated.title}</title>
            <style>
              body { margin: 0; background: #ffffff; color: #171717; }
              @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
          </head>
          <body>${generated.previewHtml}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      return;
    }

    downloadBlob(generated.downloadContent, generated.downloadMimeType, generated.downloadFilename);
  }, [generated]);

  const availableFormats = selectedReport?.formats ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <BarChart3 className="size-4" />
          <span>Accounting</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="max-w-3xl text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Generate trial balance, profit &amp; loss, balance sheet, and general ledger reports from posted journal entries.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {REPORT_DEFINITIONS.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              type="button"
              onClick={() => openReport(report)}
              className="group flex aspect-square flex-col items-start justify-between rounded-2xl border border-border bg-card p-5 text-left shadow-xs/10 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-md active:translate-y-0"
            >
              <div
                className="flex size-11 items-center justify-center rounded-xl"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 12%, var(--card) 88%)',
                  color: 'var(--primary)',
                }}
              >
                <Icon className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="font-medium">{report.name}</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {report.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogPopup
          className="max-w-4xl"
          portalContainer={dialogOpen ? adminMainPortal : null}
        >
          <DialogHeader>
            <DialogTitle>{selectedReport?.name ?? 'Generate report'}</DialogTitle>
            <DialogDescription>
              Choose a date range and export format, then generate a preview you can download.
            </DialogDescription>
          </DialogHeader>

          <DialogPanel className="space-y-5">
            <div className="space-y-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Date range
              </span>
              <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-[var(--card)] p-1">
                {REPORT_DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => applyPreset(preset.id)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="report-from">From</FieldLabel>
                <Input
                  id="report-from"
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="report-to">To</FieldLabel>
                <Input
                  id="report-to"
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>File type</FieldLabel>
                <Select
                  value={format}
                  onValueChange={(value) => setFormat(value as ReportFormat)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {availableFormats.map((option) => (
                      <SelectItem key={option} value={option}>
                        {FORMAT_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            </div>

            {generated ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{generated.title}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {generated.from} through {generated.to} · {FORMAT_LABELS[generated.format]}
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="size-4" />
                    Download
                  </Button>
                </div>
                <PrintShell ref={printRef}>
                  <div dangerouslySetInnerHTML={{ __html: generated.previewHtml }} />
                </PrintShell>
              </div>
            ) : null}
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Close</DialogClose>
            <Button type="button" onClick={handleGenerate} disabled={generating || !selectedReport}>
              {generating ? <Loader2 className="size-4 animate-spin" /> : null}
              Generate
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
