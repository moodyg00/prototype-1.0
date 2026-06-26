import {
  add,
  isZero,
  round2,
  sub,
  sum,
  toAmountString,
  toDecimal,
} from '@/src/lib/accounting/money';
import type { LineItemInput } from '@/src/lib/validation/billing-document';

export type DocumentTotals = {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  itemTotals: string[];
};

function lineIsBillable(line: LineItemInput): boolean {
  return line.isBillable !== false;
}

export function computeDocumentTotals(input: {
  lineItems: ReadonlyArray<LineItemInput>;
  discountType: 'amount' | 'percent' | null | undefined;
  discountValue: string | undefined;
  taxRate: string | undefined;
}): DocumentTotals {
  const itemTotals = input.lineItems.map((line) =>
    toAmountString(toDecimal(line.quantity ?? '0').mul(toDecimal(line.unitPrice ?? '0'))),
  );
  const billableTotals = input.lineItems.map((line, index) =>
    lineIsBillable(line) ? itemTotals[index]! : '0',
  );
  const subtotal = sum(billableTotals);

  const discountValue = toDecimal(input.discountValue ?? '0');
  let discountAmount = toDecimal(0);
  if (input.discountType === 'amount' && !isZero(discountValue)) {
    discountAmount = round2(discountValue);
  } else if (input.discountType === 'percent' && !isZero(discountValue)) {
    discountAmount = round2(subtotal.mul(discountValue).div(100));
  }
  const baseAfterDiscount = sub(subtotal, discountAmount);
  const taxRate = toDecimal(input.taxRate ?? '0');
  const taxAmount = isZero(taxRate)
    ? toDecimal(0)
    : round2(baseAfterDiscount.mul(taxRate).div(100));
  const total = add(baseAfterDiscount, taxAmount);

  return {
    subtotal: toAmountString(subtotal),
    discountAmount: toAmountString(discountAmount),
    taxAmount: toAmountString(taxAmount),
    totalAmount: toAmountString(total),
    itemTotals,
  };
}
