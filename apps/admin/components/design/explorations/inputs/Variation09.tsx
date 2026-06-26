import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

// @mock-start
// @mock-end

export interface InputValidationStatesProps {}

export function InputValidationStates(_props: InputValidationStatesProps = {}) {
  return (
    <div className="grid gap-6 px-8 py-10 sm:grid-cols-2">
      <Field>
        <FieldLabel>Error</FieldLabel>
        <Input
          aria-invalid
          name="email-error"
          defaultValue="not-an-email"
          placeholder="jane@vertexlabs.com"
        />
        <FieldDescription
          className="flex items-center gap-1.5"
          style={{ color: 'var(--destructive-foreground)' }}
        >
          <AlertCircle className="size-3.5" />
          That doesn&apos;t look like a valid email address.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Success</FieldLabel>
        <Input
          name="slug-success"
          defaultValue="acme-operations"
          placeholder="acme-operations"
          className="border-[color-mix(in_srgb,var(--success)_36%,var(--border)_64%)] has-focus-visible:border-[color-mix(in_srgb,var(--success)_64%,var(--border)_36%)] has-focus-visible:ring-[color-mix(in_srgb,var(--success)_24%,transparent)]"
        />
        <FieldDescription
          className="flex items-center gap-1.5"
          style={{ color: 'var(--success-foreground)' }}
        >
          <CheckCircle2 className="size-3.5" />
          Slug is available.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Warning</FieldLabel>
        <Input
          name="domain-warning"
          defaultValue="vertex.dev"
          className="border-[color-mix(in_srgb,var(--warning)_36%,var(--border)_64%)] has-focus-visible:border-[color-mix(in_srgb,var(--warning)_64%,var(--border)_36%)] has-focus-visible:ring-[color-mix(in_srgb,var(--warning)_24%,transparent)]"
        />
        <FieldDescription
          className="flex items-center gap-1.5"
          style={{ color: 'var(--warning-foreground)' }}
        >
          <AlertTriangle className="size-3.5" />
          Domain reachable but DNS records are not yet verified.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Default (no validity yet)</FieldLabel>
        <Input
          name="company-name"
          placeholder="Vertex Labs Inc."
        />
        <FieldDescription>
          Neutral state — fields default here on first render.
        </FieldDescription>
      </Field>
    </div>
  );
}
