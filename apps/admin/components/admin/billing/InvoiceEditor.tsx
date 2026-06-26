'use client';

import * as React from 'react';

import { CustomerFieldset } from '@/components/admin/billing/fieldsets/CustomerFieldset';
import { DiscountFieldset } from '@/components/admin/billing/fieldsets/DiscountFieldset';
import { DocumentMetaFieldset } from '@/components/admin/billing/fieldsets/DocumentMetaFieldset';
import { LineItemsFieldset } from '@/components/admin/billing/fieldsets/LineItemsFieldset';
import { PaymentTermsFieldset } from '@/components/admin/billing/fieldsets/PaymentTermsFieldset';
import type {
  ContactOption,
  OrganizationOption,
  OfferingOption,
  ProductOption,
} from '@/src/lib/billing/billing-bootstrap';
import type {
  BillingFormAction,
  BillingFormState,
} from '@/src/hooks/admin/useBillingDocumentForm';
import type { LineItemRow } from '@/components/admin/billing/LineItemsTable';
import { renderLineItemPicker } from '@/components/admin/billing/line-item-picker-utils';
import { useEstimateLineChange } from '@/components/admin/billing/useEstimateLineChange';

export interface InvoiceEditorProps {
  state: BillingFormState;
  dispatch: React.Dispatch<BillingFormAction>;
  contacts: ReadonlyArray<ContactOption>;
  organizations: ReadonlyArray<OrganizationOption>;
  offerings: ReadonlyArray<OfferingOption>;
  products: ReadonlyArray<ProductOption>;
  materials: ReadonlyArray<ProductOption>;
  refreshing: boolean;
  disabled: boolean;
  errors?: Record<string, string>;
  onRefreshNumber: () => void;
}

export function InvoiceEditor({
  state,
  dispatch,
  contacts,
  organizations,
  offerings,
  products,
  materials,
  refreshing,
  disabled,
  errors,
  onRefreshNumber,
}: InvoiceEditorProps): React.ReactElement {
  const handleLineChange = useEstimateLineChange(state.lineItems, dispatch);

  const renderPicker = React.useMemo(
    () => renderLineItemPicker({ offerings, products, materials }, disabled, handleLineChange),
    [offerings, products, materials, disabled, handleLineChange],
  );

  return (
    <div className="space-y-6">
      <DocumentMetaFieldset
        kind="invoice"
        documentNumber={state.documentNumber}
        issueDate={state.issueDate}
        dueDate={state.dueDate}
        refreshing={refreshing}
        disabled={disabled}
        errors={errors}
        onIssueDateChange={(value) => dispatch({ type: 'set', patch: { issueDate: value } })}
        onDueDateChange={(value) => dispatch({ type: 'set', patch: { dueDate: value } })}
        onRefreshNumber={onRefreshNumber}
      />
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
