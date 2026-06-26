import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type DemoField = {
  key: string;
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  description: React.ReactNode;
  type?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
};

// @mock-start
const MOCK_FIELDS: DemoField[] = [
  {
    key: 'email',
    label: 'Email address',
    name: 'email',
    type: 'email',
    autoComplete: 'email',
    placeholder: 'jane@vertexlabs.com',
    defaultValue: 'jane@vertexlabs.com',
    description: "We'll only use this to send work-order updates.",
  },
  {
    key: 'workspace',
    label: 'Workspace name',
    name: 'workspace',
    placeholder: 'acme-operations',
    description: 'Lowercase, no spaces — used in URLs and integrations.',
  },
  {
    key: 'account',
    label: 'Disabled (read-only context)',
    name: 'account-id',
    defaultValue: 'acc_3f08c1ab',
    disabled: true,
    description: 'System-managed identifier — cannot be edited.',
  },
  {
    key: 'legal',
    label: 'Required field',
    name: 'legal-name',
    placeholder: 'Vertex Labs Inc.',
    required: true,
    description: 'Appears on invoices and contracts.',
  },
];
// @mock-end

export interface InputClassicOutlineProps {
  fields?: ReadonlyArray<DemoField>;
}

export function InputClassicOutline({
  fields = MOCK_FIELDS,
}: InputClassicOutlineProps = {}) {
  return (
    <div className="grid gap-6 px-8 py-10 sm:grid-cols-2">
      {fields.map((f) => (
        <Field key={f.key}>
          <FieldLabel>{f.label}</FieldLabel>
          <Input
            type={f.type}
            name={f.name}
            autoComplete={f.autoComplete}
            placeholder={f.placeholder}
            defaultValue={f.defaultValue}
            disabled={f.disabled}
            required={f.required}
          />
          <FieldDescription>{f.description}</FieldDescription>
        </Field>
      ))}
    </div>
  );
}
