'use client';

import Link from 'next/link';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ServiceDetail } from '@/src/lib/operations/service-service';
import { SERVICE_CATEGORIES, serviceUpdateSchema } from '@/src/lib/validation/services';
import { serviceMaterialsReplaceSchema } from '@/src/lib/validation/service-materials';

import {
  newServiceMaterialRow,
  ServiceMaterialsTable,
  serviceMaterialRowsFromDetail,
  serviceMaterialsPayload,
} from './ServiceMaterialsTable';

function basicsFromService(service: ServiceDetail) {
  return {
    name: service.name,
    description: service.description ?? '',
    quotePrompt: service.quotePrompt ?? '',
    category: service.category,
    estimatedDurationMinutes:
      service.estimatedDurationMinutes != null
        ? service.estimatedDurationMinutes.toString()
        : '',
    suggestedPrice: service.suggestedPrice ?? '',
    isActive: service.isActive,
  };
}

export function OfferingEditClient({
  service: initial,
}: {
  service: ServiceDetail;
}): React.ReactElement {
  const router = useRouter();
  const [service, setService] = React.useState(initial);
  const [basics, setBasics] = React.useState(() => basicsFromService(initial));
  const [materialRows, setMaterialRows] = React.useState(() =>
    serviceMaterialRowsFromDetail(initial.materials),
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [savingBasics, setSavingBasics] = React.useState(false);
  const [savingMaterials, setSavingMaterials] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete "${service.name}"? Its BOM will be removed. Line items on past estimates and work orders will keep their descriptions but lose the service link.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/offerings/${service.id}`, { method: 'DELETE' });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Could not delete offering.');
      toast.success('Offering deleted');
      router.push('/admin/offerings');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete offering.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveBasics = async () => {
    const payload = {
      name: basics.name.trim(),
      description: basics.description.trim() || null,
      quotePrompt: basics.quotePrompt.trim() || null,
      category: basics.category,
      estimatedDurationMinutes: basics.estimatedDurationMinutes.trim() || null,
      suggestedPrice: basics.suggestedPrice.trim() || null,
      isActive: basics.isActive,
    };
    const parsed = serviceUpdateSchema.safeParse(payload);
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
    setSavingBasics(true);
    try {
      const res = await fetch(`/api/admin/offerings/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json()) as { service?: ServiceDetail; error?: string };
      if (!res.ok || !body.service) throw new Error(body.error ?? 'Could not save offering.');
      setService(body.service);
      setBasics(basicsFromService(body.service));
      toast.success('Offering saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save offering.');
    } finally {
      setSavingBasics(false);
    }
  };

  const handleSaveMaterials = async () => {
    const payload = { materials: serviceMaterialsPayload(materialRows) };
    const parsed = serviceMaterialsReplaceSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'materials';
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error('Fix the highlighted fields before saving.');
      return;
    }

    const missingProduct = materialRows.some((row) => !row.productId);
    if (missingProduct) {
      setErrors({ materials: 'Each row needs a product selected.' });
      toast.error('Select a product for every material row.');
      return;
    }

    setErrors({});
    setSavingMaterials(true);
    try {
      const res = await fetch(`/api/admin/offerings/${service.id}/materials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json()) as {
        materials?: ServiceDetail['materials'];
        error?: string;
      };
      if (!res.ok || !body.materials) throw new Error(body.error ?? 'Could not save materials.');
      setMaterialRows(serviceMaterialRowsFromDetail(body.materials));
      setService((prev) => ({ ...prev, materials: body.materials! }));
      toast.success('Bill of materials saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save materials.');
    } finally {
      setSavingMaterials(false);
    }
  };

  const busy = savingBasics || savingMaterials || deleting;

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{service.name}</h1>
            <Badge variant="outline" className="capitalize">
              {service.category.replace('_', ' ')}
            </Badge>
            {!service.isActive ? <Badge variant="secondary">Inactive</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Service offering · {service.materials.length} BOM line
            {service.materials.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void handleDelete()}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
          <Button variant="outline" render={<Link href="/admin/offerings" />}>
            Back
          </Button>
          <Button loading={savingBasics} disabled={busy} onClick={() => void handleSaveBasics()}>
            Save offering
          </Button>
        </div>
      </header>

      <FieldsetSurface
        title="Offering details"
        description="Name, pricing, and scheduling defaults for this service."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input
              value={basics.name}
              disabled={busy}
              onChange={(event) => setBasics((prev) => ({ ...prev, name: event.target.value }))}
              aria-invalid={errors.name ? true : undefined}
            />
          </Field>
          <Field>
            <FieldLabel>Category</FieldLabel>
            <Select
              value={basics.category}
              disabled={busy}
              onValueChange={(value) => setBasics((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {SERVICE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Suggested price</FieldLabel>
            <Input
              value={basics.suggestedPrice}
              disabled={busy}
              placeholder="0.00"
              onChange={(event) =>
                setBasics((prev) => ({ ...prev, suggestedPrice: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel>Est. duration (min)</FieldLabel>
            <Input
              type="number"
              min={0}
              value={basics.estimatedDurationMinutes}
              disabled={busy}
              onChange={(event) =>
                setBasics((prev) => ({
                  ...prev,
                  estimatedDurationMinutes: event.target.value,
                }))
              }
            />
          </Field>
        </div>
        <Field className="mt-4">
          <FieldLabel>Quote prompt</FieldLabel>
          <Textarea
            value={basics.quotePrompt}
            disabled={busy}
            rows={2}
            placeholder="Short prompt used in quoting and sales copy."
            onChange={(event) =>
              setBasics((prev) => ({ ...prev, quotePrompt: event.target.value }))
            }
          />
        </Field>
        <Field className="mt-4">
          <FieldLabel>Description</FieldLabel>
          <Textarea
            value={basics.description}
            disabled={busy}
            rows={3}
            onChange={(event) =>
              setBasics((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </Field>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <Checkbox
            checked={basics.isActive}
            disabled={busy}
            onCheckedChange={(checked) =>
              setBasics((prev) => ({ ...prev, isActive: checked === true }))
            }
          />
          Active offering
        </label>
      </FieldsetSurface>

      <FieldsetSurface
        eyebrow="BOM"
        title="Materials bill"
        description="Default products and internal consumables pulled into estimates and work orders when this service is included."
        actions={
          <Button loading={savingMaterials} disabled={busy} onClick={() => void handleSaveMaterials()}>
            Save materials
          </Button>
        }
      >
        <ServiceMaterialsTable
          rows={materialRows}
          disabled={busy}
          errors={errors}
          onAdd={() => setMaterialRows((rows) => [...rows, newServiceMaterialRow()])}
          onRemove={(key) => setMaterialRows((rows) => rows.filter((row) => row.key !== key))}
          onChange={(key, patch) =>
            setMaterialRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
          }
        />
      </FieldsetSurface>
    </div>
  );
}
