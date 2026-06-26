'use client';

import * as React from 'react';

import { applyLineItemKindChange } from '@/components/admin/billing/line-item-picker-utils';
import {
  stripBomLinesForSource,
  syncBomLinesForServiceRow,
} from '@/components/admin/billing/service-bom-sync';
import type { LineItemRow } from '@/components/admin/billing/LineItemsTable';
import type { BillingFormAction } from '@/src/hooks/admin/useBillingDocumentForm';

function needsBomSync(
  current: LineItemRow,
  patch: Partial<LineItemRow>,
  nextLine: LineItemRow,
): boolean {
  if (nextLine.kind !== 'service') return false;
  if (patch.serviceId !== undefined) return true;
  if (patch.quantity !== undefined) return true;
  if (patch.kind === 'service' && nextLine.serviceId) return true;
  if (current.kind !== 'service' && patch.kind === 'service') return true;
  return false;
}

function clearsBomLines(
  current: LineItemRow,
  patch: Partial<LineItemRow>,
  nextLine: LineItemRow,
): boolean {
  if (current.kind === 'service' && patch.kind && patch.kind !== 'service') return true;
  if (current.kind === 'service' && patch.serviceId === null) return true;
  if (current.kind === 'service' && nextLine.kind !== 'service') return true;
  if (current.kind === 'service' && patch.serviceId !== undefined && !nextLine.serviceId) {
    return true;
  }
  return false;
}

export function useEstimateLineChange(
  lineItems: ReadonlyArray<LineItemRow>,
  dispatch: React.Dispatch<BillingFormAction>,
): (key: string, patch: Partial<LineItemRow>) => void {
  const syncRef = React.useRef(0);

  return React.useCallback(
    (key: string, patch: Partial<LineItemRow>) => {
      const current = lineItems.find((line) => line.key === key);
      if (!current) return;

      const effectivePatch = patch.kind
        ? applyLineItemKindChange(current, patch)
        : patch;
      const nextLine = { ...current, ...effectivePatch };
      const patchedLines = lineItems.map((line) =>
        line.key === key ? nextLine : line,
      );

      if (clearsBomLines(current, effectivePatch, nextLine)) {
        dispatch({
          type: 'set-line-items',
          lineItems: stripBomLinesForSource(patchedLines, key),
        });
        return;
      }

      if (!needsBomSync(current, effectivePatch, nextLine)) {
        dispatch({ type: 'change-line', key, patch: effectivePatch });
        return;
      }

      const syncId = ++syncRef.current;
      const previousServiceId =
        effectivePatch.serviceId !== undefined ? current.serviceId : null;

      void syncBomLinesForServiceRow(patchedLines, key, nextLine, previousServiceId)
        .then((synced) => {
          if (syncRef.current !== syncId) return;
          dispatch({ type: 'set-line-items', lineItems: synced });
        })
        .catch(() => {
          if (syncRef.current !== syncId) return;
          dispatch({
            type: 'set-line-items',
            lineItems: stripBomLinesForSource(patchedLines, key),
          });
        });
    },
    [dispatch, lineItems],
  );
}
