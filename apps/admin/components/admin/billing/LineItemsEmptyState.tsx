'use client';

/*
 * Empty-state used inside the LineItems table when no rows have been added
 * yet. Generated initially from the design library variant
 * `empty-state-classic` and stripped to a thin prop-driven wrapper.
 */

import { Plus, Receipt } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export interface LineItemsEmptyStateProps {
  onAddLine: () => void;
  primaryLabel?: string;
}

export function LineItemsEmptyState({
  onAddLine,
  primaryLabel = 'Add line item',
}: LineItemsEmptyStateProps): React.ReactElement {
  return (
    <div className="px-6 py-8">
      <Empty>
        <EmptyMedia variant="icon">
          <Receipt />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No line items yet</EmptyTitle>
          <EmptyDescription>
            Add a service, product, or custom line to start building this document.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" className="gap-1.5" onClick={onAddLine}>
            <Plus className="size-3.5" />
            {primaryLabel}
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
