import React from 'react';
import { PagePlaceholder } from '../../../src/components/ui/PagePlaceholder';

export default function Page() {
  return (
    <PagePlaceholder
      title="Balances"
      description="Period-end balances per account."
      group="Accounting"
      source="app/Filament/Resources/BalanceResource.php"
    />
  );
}
