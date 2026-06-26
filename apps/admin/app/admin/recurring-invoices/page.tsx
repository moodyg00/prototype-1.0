import React from 'react';
import { PagePlaceholder } from '../../../src/components/ui/PagePlaceholder';

export default function Page() {
  return (
    <PagePlaceholder
      title="Recurring Invoices"
      description="Subscription and retainer invoice schedules."
      group="Accounting"
      source="app/Filament/Resources/RecurringInvoiceResource.php"
    />
  );
}
