'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  API_AUTH_TYPES,
  API_ENVIRONMENTS,
  API_PROVIDERS,
  INTEGRATION_STATUSES,
  type ApiAuthType,
  type ApiEnvironment,
  type ApiProvider,
  type IntegrationStatus,
} from '@/src/lib/validation/api-integrations';

export type ApiIntegrationDto = {
  id: string;
  name: string;
  description: string | null;
  status: IntegrationStatus;
  provider: ApiProvider | string | null;
  environment: ApiEnvironment | string | null;
  baseUrl: string | null;
  authType: ApiAuthType | string | null;
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  publicKey: string;
  externalAccountId: string | null;
  docsUrl: string | null;
};

interface FormState {
  name: string;
  description: string;
  status: IntegrationStatus;
  provider: ApiProvider;
  environment: ApiEnvironment;
  baseUrl: string;
  authType: ApiAuthType;
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  publicKey: string;
  externalAccountId: string;
  docsUrl: string;
}

function initialState(integration: ApiIntegrationDto | null): FormState {
  return {
    name: integration?.name ?? '',
    description: integration?.description ?? '',
    status: (integration?.status as IntegrationStatus) ?? 'active',
    provider: (integration?.provider as ApiProvider) ?? 'custom',
    environment: (integration?.environment as ApiEnvironment) ?? 'production',
    baseUrl: integration?.baseUrl ?? '',
    authType: (integration?.authType as ApiAuthType) ?? 'api_key',
    apiKey: integration?.apiKey ?? '',
    apiSecret: integration?.apiSecret ?? '',
    webhookSecret: integration?.webhookSecret ?? '',
    publicKey: integration?.publicKey ?? '',
    externalAccountId: integration?.externalAccountId ?? '',
    docsUrl: integration?.docsUrl ?? '',
  };
}

export function ApiIntegrationFormDialog({
  open,
  onOpenChange,
  integration,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: ApiIntegrationDto | null;
  onSaved: () => void;
}): React.ReactElement {
  const isEdit = Boolean(integration);
  const [form, setForm] = React.useState<FormState>(() => initialState(integration));
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm(initialState(integration));
  }, [open, integration]);

  React.useEffect(() => {
    if (!open || !isEdit || !integration) return;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/integrations/${integration.id}`);
        const body = (await res.json()) as { integration?: ApiIntegrationDto };
        if (body.integration) setForm(initialState(body.integration));
      } catch {
        /* keep list payload */
      }
    })();
  }, [open, isEdit, integration]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length === 0) {
      toast.error('Name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        provider: form.provider,
        environment: form.environment,
        baseUrl: form.baseUrl.trim() || undefined,
        authType: form.authType,
        apiKey: form.apiKey.trim() || undefined,
        apiSecret: form.apiSecret.trim() || undefined,
        webhookSecret: form.webhookSecret.trim() || undefined,
        publicKey: form.publicKey.trim() || undefined,
        externalAccountId: form.externalAccountId.trim() || undefined,
        docsUrl: form.docsUrl.trim() || undefined,
      };
      const res = await fetch(
        isEdit ? `/api/admin/integrations/${integration?.id}` : '/api/admin/integrations',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const body = (await res.json().catch(() => ({}))) as {
        integration?: { name: string };
        error?: string;
      };
      if (!res.ok || !body.integration) {
        throw new Error(body.error ?? 'Could not save integration.');
      }
      toast.success(isEdit ? `Saved ${body.integration.name}` : `Created ${body.integration.name}`);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save integration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit API integration' : 'New API integration'}</DialogTitle>
          <DialogDescription>
            Store connection details for programmatic APIs — base URL, auth type, keys, and webhook secrets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogPanel className="max-h-[70vh] space-y-4 overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Mercury"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Provider</FieldLabel>
                <Select value={form.provider} onValueChange={(value) => update('provider', value as ApiProvider)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {API_PROVIDERS.map((provider) => (
                      <SelectItem key={provider} value={provider} className="capitalize">
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Business banking feed and card spend sync."
                rows={2}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={form.status} onValueChange={(value) => update('status', value as IntegrationStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {INTEGRATION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Environment</FieldLabel>
                <Select
                  value={form.environment}
                  onValueChange={(value) => update('environment', value as ApiEnvironment)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {API_ENVIRONMENTS.map((environment) => (
                      <SelectItem key={environment} value={environment} className="capitalize">
                        {environment}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Auth type</FieldLabel>
                <Select value={form.authType} onValueChange={(value) => update('authType', value as ApiAuthType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {API_AUTH_TYPES.map((authType) => (
                      <SelectItem key={authType} value={authType}>
                        {authType.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel>Base URL</FieldLabel>
              <Input
                value={form.baseUrl}
                onChange={(e) => update('baseUrl', e.target.value)}
                placeholder="https://api.mercury.com/api/v1"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>API key / token</FieldLabel>
                <Input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => update('apiKey', e.target.value)}
                  placeholder="secret_..."
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel>API secret</FieldLabel>
                <Input
                  type="password"
                  value={form.apiSecret}
                  onChange={(e) => update('apiSecret', e.target.value)}
                  placeholder="Optional second secret"
                  autoComplete="off"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Webhook secret</FieldLabel>
                <Input
                  type="password"
                  value={form.webhookSecret}
                  onChange={(e) => update('webhookSecret', e.target.value)}
                  placeholder="whsec_..."
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel>Public / publishable key</FieldLabel>
                <Input
                  value={form.publicKey}
                  onChange={(e) => update('publicKey', e.target.value)}
                  placeholder="pk_live_..."
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>External account ID</FieldLabel>
                <Input
                  value={form.externalAccountId}
                  onChange={(e) => update('externalAccountId', e.target.value)}
                  placeholder="acct_..."
                />
              </Field>
              <Field>
                <FieldLabel>Docs URL</FieldLabel>
                <Input
                  value={form.docsUrl}
                  onChange={(e) => update('docsUrl', e.target.value)}
                  placeholder="https://docs.mercury.com"
                />
              </Field>
            </div>

            {isEdit ? (
              <Field>
                <FieldDescription>Leave secret fields blank to keep the current stored value.</FieldDescription>
              </Field>
            ) : null}
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save changes' : 'Create integration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
