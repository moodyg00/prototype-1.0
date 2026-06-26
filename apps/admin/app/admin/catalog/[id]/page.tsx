import { notFound } from 'next/navigation';
import * as React from 'react';

import { CatalogEditClient } from '@/src/components/admin/catalog/CatalogEditClient';
import { getProductDetail } from '@/src/lib/operations/product-service';
import { isUuidShape } from '@/src/lib/uuid-shape';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  if (!isUuidShape(id)) notFound();
  const product = await getProductDetail(id);
  if (!product) notFound();
  return <CatalogEditClient product={product} />;
}
