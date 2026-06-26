'use client';

import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ProductDetail } from '@/src/lib/operations/product-service';
import { PRODUCT_CATEGORIES, productUpdateSchema } from '@/src/lib/validation/products';

const CATEGORIES = PRODUCT_CATEGORIES;

export function CatalogEditClient({
  product: initial,
}: {
  product: ProductDetail;
}): React.ReactElement {
  const [product, setProduct] = React.useState(initial);
  const [state, setState] = React.useState({
    name: initial.name,
    description: initial.description ?? '',
    category: initial.category,
    sku: initial.sku ?? '',
    unitOfMeasure: initial.unitOfMeasure ?? '',
    unitPrice: initial.unitPrice ?? '',
    purchaseUrl: initial.purchaseUrl ?? '',
    isForSale: initial.isForSale,
    isInternalUse: initial.isInternalUse,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    const payload = {
      name: state.name.trim(),
      description: state.description.trim() || null,
      category: state.category,
      sku: state.sku.trim() || null,
      unitOfMeasure: state.unitOfMeasure.trim() || null,
      unitPrice: state.unitPrice.trim() || null,
      purchaseUrl: state.purchaseUrl.trim() || null,
      isForSale: state.isForSale,
      isInternalUse: state.isInternalUse,
    };
    const parsed = productUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error('Fix the highlighted fields before saving.');
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json()) as { product?: ProductDetail; error?: string };
      if (!res.ok || !body.product) throw new Error(body.error ?? 'Could not save catalog item.');
      setProduct(body.product);
      setState({
        name: body.product.name,
        description: body.product.description ?? '',
        category: body.product.category,
        sku: body.product.sku ?? '',
        unitOfMeasure: body.product.unitOfMeasure ?? '',
        unitPrice: body.product.unitPrice ?? '',
        purchaseUrl: body.product.purchaseUrl ?? '',
        isForSale: body.product.isForSale,
        isInternalUse: body.product.isInternalUse,
      });
      toast.success('Catalog item saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save catalog item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            <Badge variant="outline" className="capitalize">
              {product.category.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {product.sku ? `SKU ${product.sku}` : 'No SKU'}
            {product.quantityOnHand != null ? ` · ${product.quantityOnHand} on hand` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/catalog" />}>
            Back
          </Button>
          <Button loading={submitting} onClick={() => void handleSubmit()}>
            Save changes
          </Button>
        </div>
      </header>

      <FieldsetSurface title="Product" description="Catalog record used by BOMs, estimates, and work orders.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input
              value={state.name}
              disabled={submitting}
              onChange={(event) => setState((prev) => ({ ...prev, name: event.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel>SKU</FieldLabel>
            <Input
              value={state.sku}
              disabled={submitting}
              onChange={(event) => setState((prev) => ({ ...prev, sku: event.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel>Category</FieldLabel>
            <Select
              value={state.category}
              disabled={submitting}
              onValueChange={(value) => setState((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Unit of measure</FieldLabel>
            <Input
              value={state.unitOfMeasure}
              disabled={submitting}
              onChange={(event) => setState((prev) => ({ ...prev, unitOfMeasure: event.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel>Unit price</FieldLabel>
            <Input
              value={state.unitPrice}
              disabled={submitting}
              onChange={(event) => setState((prev) => ({ ...prev, unitPrice: event.target.value }))}
            />
          </Field>
        </div>
        <Field className="mt-4">
          <FieldLabel>Purchase URL</FieldLabel>
          <Input
            type="url"
            value={state.purchaseUrl}
            disabled={submitting}
            placeholder="https://vendor.example.com/item"
            onChange={(event) => setState((prev) => ({ ...prev, purchaseUrl: event.target.value }))}
            aria-invalid={errors.purchaseUrl ? true : undefined}
          />
          <FieldDescription>
            Optional link to buy this item online. Used on estimate and work order material lists.
          </FieldDescription>
          {errors.purchaseUrl ? (
            <p className="text-xs text-destructive">{errors.purchaseUrl}</p>
          ) : null}
        </Field>
        <Field className="mt-4">
          <FieldLabel>Description</FieldLabel>
          <Textarea
            value={state.description}
            disabled={submitting}
            rows={3}
            onChange={(event) => setState((prev) => ({ ...prev, description: event.target.value }))}
          />
        </Field>
        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={state.isForSale}
              disabled={submitting}
              onCheckedChange={(checked) =>
                setState((prev) => ({ ...prev, isForSale: checked === true }))
              }
            />
            For sale
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={state.isInternalUse}
              disabled={submitting}
              onCheckedChange={(checked) =>
                setState((prev) => ({ ...prev, isInternalUse: checked === true }))
              }
            />
            Internal use
          </label>
        </div>
      </FieldsetSurface>
    </div>
  );
}
