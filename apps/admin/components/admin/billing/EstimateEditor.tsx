'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerFieldset } from '@/components/admin/billing/fieldsets/CustomerFieldset';
import { DiscountFieldset } from '@/components/admin/billing/fieldsets/DiscountFieldset';
import { DocumentMetaFieldset } from '@/components/admin/billing/fieldsets/DocumentMetaFieldset';
import { LineItemsFieldset } from '@/components/admin/billing/fieldsets/LineItemsFieldset';
import { PaymentTermsFieldset } from '@/components/admin/billing/fieldsets/PaymentTermsFieldset';
import { ValidityFieldset } from '@/components/admin/billing/fieldsets/ValidityFieldset';
import type {
  ContactOption,
  EstimateTemplateOption,
  OrganizationOption,
  OfferingOption,
  ProductOption,
} from '@/src/lib/billing/billing-bootstrap';
import type {
  BillingFormAction,
  BillingFormState,
} from '@/src/hooks/admin/useBillingDocumentForm';
import { renderLineItemPicker } from '@/components/admin/billing/line-item-picker-utils';
import { useEstimateLineChange } from '@/components/admin/billing/useEstimateLineChange';

export interface EstimateEditorProps {
  state: BillingFormState;
  dispatch: React.Dispatch<BillingFormAction>;
  contacts: ReadonlyArray<ContactOption>;
  organizations: ReadonlyArray<OrganizationOption>;
  templates: ReadonlyArray<EstimateTemplateOption>;
  offerings: ReadonlyArray<OfferingOption>;
  products: ReadonlyArray<ProductOption>;
  materials: ReadonlyArray<ProductOption>;
  refreshing: boolean;
  disabled: boolean;
  errors?: Record<string, string>;
  onRefreshNumber: () => void;
}

export function EstimateEditor({
  state,
  dispatch,
  contacts,
  organizations,
  templates,
  offerings,
  products,
  materials,
  refreshing,
  disabled,
  errors,
  onRefreshNumber,
}: EstimateEditorProps): React.ReactElement {
  const selectedTemplate = templates.find((tpl) => tpl.id === state.estimateTemplateId) ?? null;

  const handleLineChange = useEstimateLineChange(state.lineItems, dispatch);

  const renderPicker = React.useMemo(
    () => renderLineItemPicker({ offerings, products, materials }, disabled, handleLineChange),
    [offerings, products, materials, disabled, handleLineChange],
  );

  return (
    <div className="space-y-6">
      <DocumentMetaFieldset
        kind="estimate"
        documentNumber={state.documentNumber}
        issueDate={state.issueDate}
        dueDate={state.dueDate}
        title={state.title}
        refreshing={refreshing}
        disabled={disabled}
        errors={errors}
        onTitleChange={(value) => dispatch({ type: 'set', patch: { title: value } })}
        onIssueDateChange={(value) => dispatch({ type: 'set', patch: { issueDate: value } })}
        onDueDateChange={(value) => dispatch({ type: 'set', patch: { dueDate: value } })}
        onRefreshNumber={onRefreshNumber}
      />

      {templates.length > 0 ? (
        <div className="rounded-lg border bg-[var(--card)] p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Template
              </div>
              <p className="text-sm">
                Apply a saved template to prefill the line items, payment terms, and footer copy.
                Existing line items will be replaced.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={state.estimateTemplateId ?? 'none'}
                onValueChange={(next) => {
                  if (next === 'none' || !next) {
                    dispatch({ type: 'set', patch: { estimateTemplateId: null } });
                    return;
                  }
                  const template = templates.find((tpl) => tpl.id === next);
                  if (!template) return;
                  dispatch({ type: 'apply-template', template });
                }}
                disabled={disabled}
              >
                <SelectTrigger size="sm" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              {selectedTemplate ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => dispatch({ type: 'apply-template', template: selectedTemplate })}
                >
                  Reapply
                </Button>
              ) : null}
            </div>
          </div>
          {selectedTemplate?.description ? (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              {selectedTemplate.description}
            </p>
          ) : null}
        </div>
      ) : null}

      <CustomerFieldset
        contacts={contacts}
        organizations={organizations}
        contactId={state.contactId}
        organizationId={state.organizationId}
        contactName={state.contactName}
        organizationName={state.organizationName}
        contactEmail={state.contactEmail}
        disabled={disabled}
        onSelectContact={(contact) =>
          dispatch({
            type: 'set',
            patch: {
              contactId: contact?.id ?? null,
              contactName: contact?.name ?? '',
              contactEmail: contact?.email ?? null,
              organizationId: contact?.organizationId ?? state.organizationId,
              organizationName: contact?.organizationName ?? state.organizationName,
            },
          })
        }
        onSelectOrganization={(org) =>
          dispatch({
            type: 'set',
            patch: {
              organizationId: org?.id ?? null,
              organizationName: org?.name ?? '',
            },
          })
        }
      />

      <LineItemsFieldset
        rows={state.lineItems}
        disabled={disabled}
        onAdd={() => dispatch({ type: 'add-line' })}
        onRemove={(key) => dispatch({ type: 'remove-line', key })}
        onChange={handleLineChange}
        onReorder={(sourceKey, targetKey) =>
          dispatch({ type: 'reorder-lines', sourceKey, targetKey })
        }
        errors={errors}
        renderPicker={renderPicker}
      />

      <DiscountFieldset
        discountType={state.discountType}
        discountValue={state.discountValue}
        taxRate={state.taxRate}
        disabled={disabled}
        errors={errors}
        onDiscountTypeChange={(value) =>
          dispatch({
            type: 'set',
            patch: {
              discountType: value,
              discountValue: value ? state.discountValue || '0' : '0',
            },
          })
        }
        onDiscountValueChange={(value) =>
          dispatch({ type: 'set', patch: { discountValue: value } })
        }
        onTaxRateChange={(value) => dispatch({ type: 'set', patch: { taxRate: value } })}
      />

      <ValidityFieldset
        validUntil={state.dueDate}
        disabled={disabled}
        errors={errors}
        onChange={(value) => dispatch({ type: 'set', patch: { dueDate: value } })}
      />

      <PaymentTermsFieldset
        paymentTerms={state.paymentTerms}
        notes={state.notes}
        internalNotes={state.internalNotes}
        disabled={disabled}
        onPaymentTermsChange={(value) =>
          dispatch({ type: 'set', patch: { paymentTerms: value } })
        }
        onNotesChange={(value) => dispatch({ type: 'set', patch: { notes: value } })}
        onInternalNotesChange={(value) =>
          dispatch({ type: 'set', patch: { internalNotes: value } })
        }
      />
    </div>
  );
}
