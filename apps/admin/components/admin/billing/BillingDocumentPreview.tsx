import { format } from 'date-fns';
import * as React from 'react';

import { Decimal, formatCurrency, sum, toDecimal } from '@/src/lib/accounting/money';
import { cn } from '@/src/lib/utils';

export type BillingPreviewLineItem = {
  id?: string | null;
  description: string | null;
  quantity: string;
  unitPrice: string;
  notes?: string | null;
  /** When false, line total is excluded from document totals. */
  isBillable?: boolean;
  /** Optional precomputed total override; if absent we compute qty × unit. */
  total?: string | null;
};

export type BillingPreviewKind = 'invoice' | 'estimate';

export interface BillingDocumentPreviewProps {
  kind: BillingPreviewKind;
  documentNumber: string;
  status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  title?: string | null;
  /** ISO date string (yyyy-mm-dd). */
  issueDate: string;
  /** ISO date — due date (invoice) or valid-until (estimate). */
  dueDate?: string | null;
  /** Deprecated alias for `dueDate`. */
  endDate?: string | null;
  /** Bill-to / contact summary. */
  contactName?: string | null;
  organizationName?: string | null;
  contactEmail?: string | null;
  /** Document business-name + address block (sender). */
  fromName?: string | null;
  fromAddressLines?: ReadonlyArray<string> | null;
  /** Line items to render in the body table. */
  lines?: ReadonlyArray<BillingPreviewLineItem>;
  /** Deprecated alias for `lines`. */
  lineItems?: ReadonlyArray<BillingPreviewLineItem>;
  /** Pre-computed subtotal (preferred). If omitted we compute from `lines`. */
  subtotal?: string | null;
  /** Document-level discount in absolute amount (already resolved). */
  discountAmount?: string | null;
  /** Friendly label for the discount line (e.g. "Discount (10%)"). */
  discountLabel?: string | null;
  /** Document-level tax amount (already resolved from rate × subtotal). */
  taxAmount?: string | null;
  /** Friendly label for the tax line. */
  taxLabel?: string | null;
  /** Pre-computed grand total (preferred). */
  total?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  className?: string;
}

const KIND_COPY: Record<
  BillingPreviewKind,
  { eyebrow: string; endLabel: string; thanks: string }
> = {
  invoice: {
    eyebrow: 'Invoice',
    endLabel: 'Due',
    thanks: 'Thank you for your business.',
  },
  estimate: {
    eyebrow: 'Estimate',
    endLabel: 'Valid until',
    thanks: 'We look forward to working with you.',
  },
};

function formatIso(value?: string | null): string {
  if (!value) return '—';
  try {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) return value;
    return format(parsed, 'MMM d, yyyy');
  } catch {
    return value;
  }
}

function lineTotal(line: BillingPreviewLineItem) {
  if (line.isBillable === false) return toDecimal(0);
  return toDecimal(line.quantity).mul(toDecimal(line.unitPrice));
}

function billableLines(items: ReadonlyArray<BillingPreviewLineItem>) {
  return items.filter((line) => line.isBillable !== false);
}

export function BillingDocumentPreview({
  kind,
  documentNumber,
  status = 'draft',
  title,
  issueDate,
  dueDate,
  endDate,
  contactName,
  organizationName,
  contactEmail,
  fromName,
  fromAddressLines,
  lines,
  lineItems,
  subtotal: subtotalOverride,
  discountAmount,
  discountLabel,
  taxAmount,
  taxLabel,
  total: totalOverride,
  paymentTerms,
  notes,
  className,
}: BillingDocumentPreviewProps): React.ReactElement {
  const copy = KIND_COPY[kind];
  const items = lines ?? lineItems ?? [];
  const endDateValue = dueDate ?? endDate ?? null;
  const subtotal = subtotalOverride
    ? toDecimal(subtotalOverride)
    : sum(billableLines(items).map(lineTotal));
  const discountValue = toDecimal(discountAmount ?? '0');
  const taxValue = toDecimal(taxAmount ?? '0');
  const total = totalOverride
    ? toDecimal(totalOverride)
    : subtotal.sub(discountValue).add(taxValue);

  return (
    <div
      className={cn('flex flex-col gap-6 px-6 py-7 text-sm', className)}
      style={{ backgroundColor: '#ffffff', color: '#171717' }}
    >
      {/* Header band */}
      <header
        className="flex flex-wrap items-start justify-between gap-4 border-b pb-5"
        style={{ borderColor: '#e7e3da' }}
      >
        <div className="space-y-1.5">
          <div
            className="text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ color: '#71717a' }}
          >
            {copy.eyebrow}
          </div>
          <div className="font-mono text-lg tracking-tight" style={{ color: '#171717' }}>
            {documentNumber}
          </div>
          {title ? (
            <div className="max-w-md text-base font-medium" style={{ color: '#171717' }}>
              {title}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {fromName ? (
            <div className="text-base font-semibold" style={{ color: '#171717' }}>
              {fromName}
            </div>
          ) : null}
          {(fromAddressLines ?? []).map((line, idx) => (
            <div key={`${line}-${idx}`} className="text-xs" style={{ color: '#71717a' }}>
              {line}
            </div>
          ))}
          <span
            className="mt-1 inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em]"
            style={{
              borderColor: status === 'draft' ? '#d4d4d8' : '#bfdbfe',
              backgroundColor: status === 'draft' ? '#ffffff' : '#eff6ff',
              color: status === 'draft' ? '#52525b' : '#1d4ed8',
            }}
          >
            {status}
          </span>
        </div>
      </header>

      {/* Bill-to + dates band */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <div
            className="text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ color: '#71717a' }}
          >
            Bill to
          </div>
          {organizationName ? (
            <div className="font-medium" style={{ color: '#171717' }}>
              {organizationName}
            </div>
          ) : null}
          {contactName ? <div style={{ color: '#404040' }}>{contactName}</div> : null}
          {contactEmail ? (
            <div className="text-xs" style={{ color: '#71717a' }}>
              {contactEmail}
            </div>
          ) : null}
          {!organizationName && !contactName ? (
            <div className="text-xs" style={{ color: '#a1a1aa' }}>
              No customer selected
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div
              className="text-[11px] font-mono uppercase tracking-[0.22em]"
              style={{ color: '#71717a' }}
            >
              Issued
            </div>
            <div className="font-medium" style={{ color: '#171717' }}>
              {formatIso(issueDate)}
            </div>
          </div>
          <div>
            <div
              className="text-[11px] font-mono uppercase tracking-[0.22em]"
              style={{ color: '#71717a' }}
            >
              {copy.endLabel}
            </div>
            <div className="font-medium" style={{ color: '#171717' }}>
              {formatIso(endDateValue)}
            </div>
          </div>
        </div>
      </section>

      {/* Line items table */}
      <section className="overflow-hidden rounded-md border" style={{ borderColor: '#e7e3da' }}>
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col />
            <col className="w-20" />
            <col className="w-28" />
            <col className="w-28" />
          </colgroup>
          <thead
            className="text-[11px] font-mono uppercase tracking-[0.18em]"
            style={{ backgroundColor: '#fafafa', color: '#71717a' }}
          >
            <tr>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-2 py-2 text-right">Qty</th>
              <th className="px-2 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs" style={{ color: '#a1a1aa' }}>
                  Add line items on the left to see them here.
                </td>
              </tr>
            ) : (
              items.map((line, idx) => {
                const billable = line.isBillable !== false;
                const total = billable
                  ? line.total
                    ? toDecimal(line.total)
                    : lineTotal(line)
                  : toDecimal(0);
                return (
                  <tr
                    key={line.id ?? idx}
                    className={cn('border-t align-top', !billable && 'opacity-60')}
                    style={{ borderColor: '#f1ede4' }}
                  >
                    <td className="px-4 py-3">
                      <div style={{ color: billable ? '#171717' : '#71717a' }}>
                        {line.description?.trim() || `Item ${idx + 1}`}
                        {!billable ? (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-[#a1a1aa]">
                            (not charged)
                          </span>
                        ) : null}
                      </div>
                      {line.notes ? (
                        <div className="mt-1 text-xs" style={{ color: '#71717a' }}>
                          {line.notes}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums" style={{ color: '#171717' }}>
                      {Number(line.quantity).toLocaleString('en-US')}
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums" style={{ color: '#171717' }}>
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-medium tabular-nums',
                        !billable && 'text-[#a1a1aa] line-through',
                      )}
                      style={{ color: billable ? '#171717' : undefined }}
                    >
                      {formatCurrency(total)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* Totals band */}
      <section className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
        <Row label="Subtotal" value={formatCurrency(subtotal)} />
        <Row
          label={discountLabel ?? 'Discount'}
          value={`-${formatCurrency(discountValue)}`}
          dim
          hidden={discountValue.isZero()}
        />
        <Row
          label={taxLabel ?? 'Tax'}
          value={formatCurrency(taxValue)}
          dim
          hidden={taxValue.isZero()}
        />
        <div className="mt-2 border-t pt-2" style={{ borderColor: '#e7e3da' }}>
          <Row label="Total" value={formatCurrency(total)} bold />
        </div>
      </section>

      {(notes || paymentTerms) && (
        <section className="space-y-3 border-t pt-5" style={{ borderColor: '#e7e3da' }}>
          {paymentTerms ? (
            <div>
              <div
                className="text-[11px] font-mono uppercase tracking-[0.22em]"
                style={{ color: '#71717a' }}
              >
                Payment terms
              </div>
              <div className="text-sm" style={{ color: '#404040' }}>
                {paymentTerms}
              </div>
            </div>
          ) : null}
          {notes ? (
            <div>
              <div
                className="text-[11px] font-mono uppercase tracking-[0.22em]"
                style={{ color: '#71717a' }}
              >
                Notes
              </div>
              <div className="whitespace-pre-line text-sm" style={{ color: '#404040' }}>
                {notes}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <footer
        className="border-t pt-4 text-xs"
        style={{ borderColor: '#e7e3da', color: '#71717a' }}
      >
        {copy.thanks}
      </footer>
    </div>
  );
}

type RowProps = {
  label: string;
  value: string;
  dim?: boolean;
  bold?: boolean;
  hidden?: boolean;
};

function Row({ label, value, dim, bold, hidden }: RowProps): React.ReactElement | null {
  if (hidden) return null;
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: dim ? '#a1a1aa' : '#71717a' }}>{label}</span>
      <span
        className={cn('font-medium tabular-nums', bold && 'text-base font-semibold')}
        style={{ color: dim ? '#71717a' : '#171717' }}
      >
        {value}
      </span>
    </div>
  );
}

/** Compute the subtotal/discount/tax/total summary for the editor footer. */
export function computeTotals(
  lineItems: ReadonlyArray<BillingPreviewLineItem>,
  discount: { type: 'amount' | 'percent' | null; value: string },
  taxRatePercent: string,
): {
  subtotal: Decimal;
  discountAmount: Decimal;
  taxAmount: Decimal;
  total: Decimal;
} {
  const subtotal = sum(billableLines(lineItems).map(lineTotal));
  const discountAmount =
    discount.type === 'percent'
      ? subtotal.mul(toDecimal(discount.value)).div(100)
      : discount.type === 'amount'
        ? toDecimal(discount.value)
        : toDecimal(0);
  const taxableBase = subtotal.sub(discountAmount);
  const taxAmount = taxableBase.mul(toDecimal(taxRatePercent)).div(100);
  const total = taxableBase.add(taxAmount);
  return { subtotal, discountAmount, taxAmount, total };
}
