'use client';

/**
 * Shared reducer + hook for the invoice and estimate editors.
 *
 * Both kinds drive their state through this one hook so the create and edit
 * flows look identical and the "estimate template apply" event lives in one
 * place. `derived` is a memoized totals snapshot computed from the line
 * items + discount + tax fields. `submit` posts the validated payload to
 * the right endpoint and surfaces the response back to the caller.
 */
import * as React from 'react';
import { toast } from 'sonner';

import {
  computeTotals,
  type BillingPreviewLineItem,
} from '@/components/admin/billing/BillingDocumentPreview';
import type { LineItemRow } from '@/components/admin/billing/LineItemsTable';
import { applyLineItemKindChange } from '@/components/admin/billing/line-item-picker-utils';
import {
  estimateCreateInputSchema,
  estimateUpdateInputSchema,
  invoiceCreateInputSchema,
  invoiceUpdateInputSchema,
  type EstimateCreateInput,
  type InvoiceCreateInput,
} from '@/src/lib/validation/billing-document';
import { toAmountString } from '@/src/lib/accounting/money';
import type { EstimateTemplateOption } from '@/src/lib/billing/billing-bootstrap';
import type { LineItemKind } from '@/src/lib/billing/line-item-kinds';

export type DocumentKind = 'invoice' | 'estimate';

export type BillingFormState = {
  kind: DocumentKind;
  /** Existing record id when in edit mode, otherwise null. */
  recordId?: string | null;
  /** Server-allocated number when editing, or the live preview when creating. */
  documentNumber: string;
  status?: string;
  /* customer */
  contactId: string | null;
  contactName: string;
  contactEmail: string | null;
  organizationId: string | null;
  organizationName: string;
  /* document */
  issueDate: string;
  /** Invoice → due date. Estimate → valid until. */
  dueDate: string;
  /** Estimate-only. */
  title: string;
  estimateTemplateId: string | null;
  estimateTemplateName?: string | null;
  estimateTemplateFooter?: string | null;
  /* terms / notes */
  paymentTerms: string;
  notes: string;
  internalNotes: string;
  /* totals */
  discountType: 'amount' | 'percent' | null;
  discountValue: string;
  taxRate: string;
  /* lines */
  lineItems: LineItemRow[];
};

export type BillingFormAction =
  | { type: 'set'; patch: Partial<BillingFormState> }
  | { type: 'add-line'; partial?: Partial<LineItemRow> }
  | { type: 'remove-line'; key: string }
  | { type: 'change-line'; key: string; patch: Partial<LineItemRow> }
  | { type: 'set-line-items'; lineItems: LineItemRow[] }
  | { type: 'reorder-lines'; sourceKey: string; targetKey: string }
  | { type: 'apply-template'; template: EstimateTemplateOption }
  | { type: 'replace'; next: BillingFormState };

function newKey() {
  return Math.random().toString(36).slice(2, 10);
}

export function blankLine(partial?: Partial<LineItemRow>): LineItemRow {
  return {
    key: newKey(),
    kind: 'custom',
    serviceId: null,
    productId: null,
    description: '',
    quantity: '1',
    unitPrice: '0',
    notes: '',
    isBillable: true,
    ...partial,
  };
}

export function emptyState(
  kind: DocumentKind,
  initialNumber: string,
  overrides?: Partial<BillingFormState>,
): BillingFormState {
  const today = new Date().toISOString().slice(0, 10);
  const defaultEnd = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (kind === 'invoice' ? 14 : 30));
    return d.toISOString().slice(0, 10);
  })();
  return {
    kind,
    recordId: null,
    documentNumber: initialNumber,
    status: 'draft',
    contactId: null,
    contactName: '',
    contactEmail: null,
    organizationId: null,
    organizationName: '',
    issueDate: today,
    dueDate: defaultEnd,
    title: '',
    estimateTemplateId: null,
    paymentTerms: '',
    notes: '',
    internalNotes: '',
    discountType: null,
    discountValue: '0',
    taxRate: '0',
    lineItems: [blankLine()],
    ...overrides,
  };
}

function reducer(state: BillingFormState, action: BillingFormAction): BillingFormState {
  switch (action.type) {
    case 'set':
      return { ...state, ...action.patch };
    case 'add-line':
      return {
        ...state,
        lineItems: [...state.lineItems, blankLine(action.partial)],
      };
    case 'remove-line': {
      if (state.lineItems.length <= 1) return state;
      const next = state.lineItems.filter(
        (line) => line.key !== action.key && line.bomSourceKey !== action.key,
      );
      return {
        ...state,
        lineItems: next.length === 0 ? [blankLine()] : next,
      };
    }
    case 'set-line-items':
      return {
        ...state,
        lineItems: action.lineItems.length > 0 ? action.lineItems : [blankLine()],
      };
    case 'change-line': {
      const current = state.lineItems.find((line) => line.key === action.key);
      const nextPatch =
        current && action.patch.kind
          ? applyLineItemKindChange(current, action.patch)
          : action.patch;
      return {
        ...state,
        lineItems: state.lineItems.map((line) =>
          line.key === action.key ? { ...line, ...nextPatch } : line,
        ),
      };
    }
    case 'reorder-lines': {
      const from = state.lineItems.findIndex((line) => line.key === action.sourceKey);
      const to = state.lineItems.findIndex((line) => line.key === action.targetKey);
      if (from < 0 || to < 0 || from === to) return state;
      const next = state.lineItems.slice();
      const [moved] = next.splice(from, 1);
      if (!moved) return state;
      next.splice(to, 0, moved);
      return { ...state, lineItems: next };
    }
    case 'apply-template': {
      const lines = action.template.lineItems.map((item) =>
        blankLine({
          kind: (item.kind as LineItemRow['kind']) ?? 'custom',
          description: typeof item.description === 'string' ? item.description : '',
          quantity:
            item.quantity !== null && item.quantity !== undefined
              ? String(item.quantity)
              : '1',
          unitPrice:
            item.unitPrice !== null && item.unitPrice !== undefined
              ? String(item.unitPrice)
              : '0',
        }),
      );
      return {
        ...state,
        estimateTemplateId: action.template.id,
        lineItems: lines.length > 0 ? lines : [blankLine()],
        paymentTerms: action.template.paymentTerms ?? state.paymentTerms,
        notes: action.template.footerText ?? state.notes,
      };
    }
    case 'replace':
      return action.next;
    default:
      return state;
  }
}

export type DerivedTotals = {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  /** Per-line total keyed by `LineItemRow.key`. */
  lineTotals: Map<string, string>;
  /** Friendly label for the discount line in the totals footer. */
  discountLabel: string | null;
  /** Friendly label for the tax line in the totals footer. */
  taxLabel: string | null;
};

export type SubmitResult = {
  ok: boolean;
  /** Saved record id (mode=create) or unchanged record id (mode=edit). */
  id?: string;
  /** Allocated/saved document number. */
  documentNumber?: string;
  /** Saved total. */
  total?: string;
  /** Error message when `ok` is false. */
  message?: string;
  /** Field-level error map when validation fails. */
  fieldErrors?: Record<string, string>;
};

export type UseBillingDocumentFormReturn = {
  state: BillingFormState;
  derived: DerivedTotals;
  previewLineItems: BillingPreviewLineItem[];
  errors: Record<string, string>;
  dispatch: React.Dispatch<BillingFormAction>;
  submit: (mode?: 'create' | 'edit') => Promise<SubmitResult>;
  submitting: boolean;
  resetErrors: () => void;
};

export type UseBillingDocumentFormArgs = {
  initialState: BillingFormState;
  /** Override default mode (auto-detected from `recordId` presence). */
  mode?: 'create' | 'edit';
};

export function useBillingDocumentForm(
  args: UseBillingDocumentFormArgs,
): UseBillingDocumentFormReturn {
  const { initialState, mode: modeOverride } = args;
  const [state, rawDispatch] = React.useReducer(reducer, initialState);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const dispatch = React.useCallback((action: BillingFormAction) => {
    rawDispatch(action);
    setErrors((prev) => (Object.keys(prev).length > 0 ? {} : prev));
  }, []);

  const previewLineItems = React.useMemo<BillingPreviewLineItem[]>(
    () =>
      state.lineItems.map((line) => ({
        id: line.key,
        description: line.description,
        quantity: line.quantity || '0',
        unitPrice: line.unitPrice || '0',
        notes: line.notes ? line.notes : null,
        isBillable: line.isBillable !== false,
      })),
    [state.lineItems],
  );

  const derived = React.useMemo<DerivedTotals>(() => {
    const totals = computeTotals(
      previewLineItems,
      { type: state.discountType, value: state.discountValue },
      state.taxRate,
    );
    const lineTotals = new Map<string, string>();
    for (const line of state.lineItems) {
      const qty = Number(line.quantity || '0') || 0;
      const unit = Number(line.unitPrice || '0') || 0;
      const raw = toAmountString(qty * unit);
      lineTotals.set(line.key, line.isBillable === false ? '0' : raw);
    }
    const discountLabel =
      state.discountType === 'percent'
        ? `Discount (${state.discountValue || '0'}%)`
        : state.discountType === 'amount' && Number(state.discountValue || '0') > 0
          ? 'Discount'
          : null;
    const taxLabel =
      Number(state.taxRate || '0') > 0 ? `Tax (${state.taxRate || '0'}%)` : null;
    return {
      subtotal: toAmountString(totals.subtotal),
      discountAmount: toAmountString(totals.discountAmount),
      taxAmount: toAmountString(totals.taxAmount),
      total: toAmountString(totals.total),
      lineTotals,
      discountLabel,
      taxLabel,
    };
  }, [
    previewLineItems,
    state.discountType,
    state.discountValue,
    state.taxRate,
    state.lineItems,
  ]);

  const resetErrors = React.useCallback(() => setErrors({}), []);

  const submit = React.useCallback(
    async (modeArg?: 'create' | 'edit'): Promise<SubmitResult> => {
      const mode = modeArg ?? modeOverride ?? (state.recordId ? 'edit' : 'create');
      setSubmitting(true);
      setErrors({});
      try {
        const payload = buildPayload(state);
        const schema =
          state.kind === 'invoice'
            ? mode === 'create'
              ? invoiceCreateInputSchema
              : invoiceUpdateInputSchema
            : mode === 'create'
              ? estimateCreateInputSchema
              : estimateUpdateInputSchema;
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path.join('.');
            fieldErrors[key] = issue.message;
          }
          setErrors(fieldErrors);
          const firstMessage = Object.values(fieldErrors)[0];
          return {
            ok: false,
            message: firstMessage ?? 'Please correct the highlighted fields.',
            fieldErrors,
          };
        }

        const url =
          mode === 'create'
            ? state.kind === 'invoice'
              ? '/api/admin/invoices'
              : '/api/admin/estimates'
            : state.kind === 'invoice'
              ? `/api/admin/invoices/${state.recordId}`
              : `/api/admin/estimates/${state.recordId}`;
        const method = mode === 'create' ? 'POST' : 'PATCH';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        });
        const body = (await response.json()) as {
          id?: string;
          invoiceNumber?: string;
          estimateNumber?: string;
          totalAmount?: string;
          error?: string;
          details?: { fieldErrors?: Record<string, string[]> };
        };
        if (!response.ok) {
          if (body.details?.fieldErrors) {
            const next: Record<string, string> = {};
            Object.entries(body.details.fieldErrors).forEach(([key, messages]) => {
              if (messages?.[0]) next[key] = messages[0];
            });
            setErrors(next);
          }
          const apiFieldMessages = body.details?.fieldErrors
            ? Object.values(body.details.fieldErrors).flatMap((messages) => messages ?? [])
            : [];
          return {
            ok: false,
            message: apiFieldMessages[0] ?? body.error ?? 'Failed to save.',
          };
        }
        const documentNumber = body.invoiceNumber ?? body.estimateNumber ?? '';
        return {
          ok: true,
          id: body.id ?? state.recordId ?? '',
          documentNumber,
          total: body.totalAmount ?? derived.total,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save.';
        toast.error(message);
        return { ok: false, message };
      } finally {
        setSubmitting(false);
      }
    },
    [state, derived.total, modeOverride],
  );

  return { state, derived, previewLineItems, errors, dispatch, submit, submitting, resetErrors };
}

function buildPayload(state: BillingFormState): InvoiceCreateInput | EstimateCreateInput {
  const baseLineItems = state.lineItems.map((line) => ({
    kind: line.kind,
    serviceId: line.serviceId,
    productId: line.productId,
    description: line.description.trim() || null,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    notes: line.notes ? line.notes : null,
    isBillable: line.isBillable !== false,
  }));

  const baseFields = {
    contactId: state.contactId,
    contactName: state.contactName.trim() || null,
    organizationId: state.organizationId,
    organizationName: state.organizationName.trim() || null,
    notes: state.notes.trim() || null,
    paymentTerms: state.paymentTerms.trim() || null,
    discountType: state.discountType ?? null,
    discountValue: state.discountValue,
    taxRate: state.taxRate,
    internalNotes: state.internalNotes.trim() || null,
    lineItems: baseLineItems,
  };

  if (state.kind === 'invoice') {
    return {
      ...baseFields,
      issueDate: state.issueDate,
      dueDate: state.dueDate,
      status: 'draft',
    } as InvoiceCreateInput;
  }
  return {
    ...baseFields,
    title: state.title.trim() || `Estimate ${state.issueDate}`,
    issueDate: state.issueDate,
    validUntil: state.dueDate || null,
    estimateTemplateId: state.estimateTemplateId,
    status: 'draft',
  } as EstimateCreateInput;
}

function inferDiscountValue(
  discountType: 'amount' | 'percent' | null,
  subtotal: string,
  discountAmount: string,
): string {
  const sub = Number(subtotal) || 0;
  const disc = Number(discountAmount) || 0;
  if (!discountType || disc === 0) return '0';
  if (discountType === 'amount') return discountAmount;
  if (sub <= 0) return '0';
  return ((disc / sub) * 100).toFixed(2);
}

function inferTaxRate(subtotal: string, discountAmount: string, taxAmount: string): string {
  const base = (Number(subtotal) || 0) - (Number(discountAmount) || 0);
  const tax = Number(taxAmount) || 0;
  if (base <= 0 || tax === 0) return '0';
  return ((tax / base) * 100).toFixed(2);
}

export function invoiceDetailToFormState(
  detail: {
    id: string;
    invoiceNumber: string;
    status: string;
    issueDate: string;
    dueDate: string;
    contactId: string | null;
    contactName: string | null;
    contactEmail: string | null;
    organizationId: string | null;
    organizationName: string | null;
    paymentTerms: string | null;
    notes: string | null;
    internalNotes: string | null;
    subtotal: string;
    discountType: 'amount' | 'percent' | null;
    discountAmount: string;
    taxAmount: string;
    lineItems: Array<{
      id: string;
      kind: LineItemKind;
      serviceId: string | null;
      productId: string | null;
      description: string | null;
      quantity: string;
      unitPrice: string;
      notes?: string | null;
      isBillable?: boolean;
    }>;
  },
): BillingFormState {
  return {
    kind: 'invoice',
    recordId: detail.id,
    documentNumber: detail.invoiceNumber,
    status: detail.status,
    contactId: detail.contactId,
    contactName: detail.contactName ?? '',
    contactEmail: detail.contactEmail,
    organizationId: detail.organizationId,
    organizationName: detail.organizationName ?? '',
    issueDate: detail.issueDate,
    dueDate: detail.dueDate,
    title: '',
    estimateTemplateId: null,
    paymentTerms: detail.paymentTerms ?? '',
    notes: detail.notes ?? '',
    internalNotes: detail.internalNotes ?? '',
    discountType: detail.discountType,
    discountValue: inferDiscountValue(
      detail.discountType,
      detail.subtotal,
      detail.discountAmount,
    ),
    taxRate: inferTaxRate(detail.subtotal, detail.discountAmount, detail.taxAmount),
    lineItems: detail.lineItems.map((item) =>
      blankLine({
        key: item.id,
        kind: item.kind,
        serviceId: item.serviceId,
        productId: item.productId,
        description: item.description ?? '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes ?? '',
        isBillable: item.isBillable !== false,
      }),
    ),
  };
}

export function estimateDetailToFormState(
  detail: {
    id: string;
    estimateNumber: string;
    status: string;
    title: string;
    issueDate: string;
    validUntil: string | null;
    contactId: string | null;
    contactName: string | null;
    contactEmail: string | null;
    organizationId: string | null;
    organizationName: string | null;
    estimateTemplateId: string | null;
    paymentTerms: string | null;
    notes: string | null;
    internalNotes: string | null;
    subtotal: string;
    discountType: 'amount' | 'percent' | null;
    discountAmount: string;
    taxAmount: string;
    lineItems: Array<{
      id: string;
      kind: LineItemKind;
      serviceId: string | null;
      productId: string | null;
      description: string | null;
      quantity: string;
      unitPrice: string;
      notes: string | null;
      isBillable?: boolean;
    }>;
  },
): BillingFormState {
  return {
    kind: 'estimate',
    recordId: detail.id,
    documentNumber: detail.estimateNumber,
    status: detail.status,
    contactId: detail.contactId,
    contactName: detail.contactName ?? '',
    contactEmail: detail.contactEmail,
    organizationId: detail.organizationId,
    organizationName: detail.organizationName ?? '',
    issueDate: detail.issueDate,
    dueDate: detail.validUntil ?? '',
    title: detail.title,
    estimateTemplateId: detail.estimateTemplateId,
    paymentTerms: detail.paymentTerms ?? '',
    notes: detail.notes ?? '',
    internalNotes: detail.internalNotes ?? '',
    discountType: detail.discountType,
    discountValue: inferDiscountValue(
      detail.discountType,
      detail.subtotal,
      detail.discountAmount,
    ),
    taxRate: inferTaxRate(detail.subtotal, detail.discountAmount, detail.taxAmount),
    lineItems: detail.lineItems.map((item) =>
      blankLine({
        key: item.id,
        kind: item.kind,
        serviceId: item.serviceId,
        productId: item.productId,
        description: item.description ?? '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes ?? '',
        isBillable: item.isBillable !== false,
      }),
    ),
  };
}
