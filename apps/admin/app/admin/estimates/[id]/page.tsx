import { notFound } from 'next/navigation';
import * as React from 'react';

import { EstimateEditClient } from '@/components/admin/billing/EstimateEditClient';
import { loadBillingCreateBootstrap } from '@/src/lib/billing/billing-bootstrap';
import { getEstimateDetail } from '@/src/lib/billing/estimate-service';
import { getEstimateMaterials } from '@/src/lib/operations/estimate-materials';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const [bootstrap, estimate, materialsResult] = await Promise.all([
    loadBillingCreateBootstrap({ kind: 'estimate' }),
    getEstimateDetail(id),
    getEstimateMaterials(id),
  ]);
  if (!estimate) notFound();
  return (
    <EstimateEditClient
      bootstrap={bootstrap}
      estimate={estimate}
      materials={materialsResult.materials}
      materialsMode={materialsResult.mode}
    />
  );
}
