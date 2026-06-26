import type { Prisma } from '@prototype/db';

/**
 * Line item kinds for estimate and invoice editors.
 *
 * Naming map (UI → model):
 * - **Offering** (Admin → Offerings) → `Service` → kind `service`
 * - **Catalog product for sale** → `Product` (`isForSale`) → kind `product`
 * - **Catalog material / internal stock** → `Product` (`category=materials` or
 *   `isInternalUse`) → kind `material` — feeds the estimate materials manifest
 *   the same way as a product line (`source: product_line` in
 *   `estimate-material-lines.ts`).
 * - **Custom** → free-form description with no catalog FK.
 *
 * `InvoiceItem` does not persist `kind`; invoice edit loads infer material vs
 * product from the linked `Product` row when `productId` is set.
 */
export const LINE_ITEM_KINDS = ['service', 'product', 'material', 'custom'] as const;

export type LineItemKind = (typeof LINE_ITEM_KINDS)[number];

export const LINE_ITEM_KIND_LABELS: Record<LineItemKind, string> = {
  service: 'Offering',
  product: 'Product',
  material: 'Material',
  custom: 'Custom',
};

export const LINE_ITEM_KIND_OPTIONS: ReadonlyArray<{ value: LineItemKind; label: string }> =
  LINE_ITEM_KINDS.map((value) => ({ value, label: LINE_ITEM_KIND_LABELS[value] }));

/** Pickers only apply to catalog-linked kinds. */
export function lineItemKindHasPicker(kind: LineItemKind): boolean {
  return kind === 'service' || kind === 'product' || kind === 'material';
}

/** Catalog products eligible for material line items (estimate materials manifest). */
export function materialProductWhere(): Prisma.ProductWhereInput {
  return {
    OR: [
      { category: { in: ['materials', 'consumables'] } },
      { isInternalUse: true },
      { isForSale: false },
    ],
  };
}

export function inferLineItemKind(input: {
  kind?: string | null;
  serviceId?: string | null;
  productId?: string | null;
  productCategory?: string | null;
  productIsInternalUse?: boolean | null;
}): LineItemKind {
  if (
    input.kind === 'service' ||
    input.kind === 'product' ||
    input.kind === 'material' ||
    input.kind === 'custom'
  ) {
    return input.kind;
  }
  if (input.serviceId) return 'service';
  if (input.productId) {
    if (input.productCategory === 'materials' || input.productIsInternalUse) {
      return 'material';
    }
    return 'product';
  }
  return 'custom';
}
