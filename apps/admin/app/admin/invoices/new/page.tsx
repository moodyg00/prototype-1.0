import * as React from 'react';

import { InvoiceCreateClient } from '@/components/admin/billing/InvoiceCreateClient';
import { loadBillingCreateBootstrap } from '@/src/lib/billing/billing-bootstrap';

export const dynamic = 'force-dynamic';

export default async function Page(): Promise<React.ReactElement> {
  const bootstrap = await loadBillingCreateBootstrap({ kind: 'invoice' });
  return <InvoiceCreateClient bootstrap={bootstrap} />;
}
