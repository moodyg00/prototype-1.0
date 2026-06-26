import React from 'react';
import { PagePlaceholder } from '../../../src/components/ui/PagePlaceholder';

export default function Page() {
  return (
    <PagePlaceholder
      title="Payments"
      description="Customer and vendor payments."
      group="Accounting"
      source="app/Filament/Resources/PaymentResource.php"
    />
  );
}
