import * as React from 'react';

import { EstimateCreateClient } from '@/components/admin/billing/EstimateCreateClient';
import { loadBillingCreateBootstrap } from '@/src/lib/billing/billing-bootstrap';

export const dynamic = 'force-dynamic';

export default async function Page(): Promise<React.ReactElement> {
  const bootstrap = await loadBillingCreateBootstrap({ kind: 'estimate' });
  return <EstimateCreateClient bootstrap={bootstrap} />;
}
