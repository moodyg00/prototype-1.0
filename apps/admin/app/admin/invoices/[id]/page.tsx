import { notFound } from 'next/navigation';
import * as React from 'react';

import { InvoiceEditClient } from '@/components/admin/billing/InvoiceEditClient';
import { loadBillingCreateBootstrap } from '@/src/lib/billing/billing-bootstrap';
import { getInvoiceDetail } from '@/src/lib/billing/invoice-service';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const [bootstrap, invoice] = await Promise.all([
    loadBillingCreateBootstrap({ kind: 'invoice' }),
    getInvoiceDetail(id),
  ]);
  if (!invoice) notFound();
  return <InvoiceEditClient bootstrap={bootstrap} invoice={invoice} />;
}
