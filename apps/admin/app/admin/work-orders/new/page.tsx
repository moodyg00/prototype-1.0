import * as React from 'react';

import { WorkOrderCreateClient } from '@/src/components/admin/work-orders/WorkOrderCreateClient';
import { loadWorkOrderBootstrap } from '@/src/lib/operations/work-order-bootstrap';

export const dynamic = 'force-dynamic';

export default async function Page(): Promise<React.ReactElement> {
  const bootstrap = await loadWorkOrderBootstrap();
  return <WorkOrderCreateClient bootstrap={bootstrap} />;
}
