import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectButton } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type Row = {
  label: string;
  description?: string;
  control: React.ReactNode;
};

// @mock-start
const MOCK_ROWS: Row[] = [
  {
    label: 'Display name',
    description: 'Shown on invoices and outbound emails.',
    control: <Input defaultValue="Acme Co." />,
  },
  {
    label: 'Legal entity',
    description: 'Used on contracts and tax documents.',
    control: <Input defaultValue="Acme Holdings, Inc." />,
  },
  {
    label: 'Billing email',
    control: <Input type="email" defaultValue="ar@acme.co" />,
  },
  {
    label: 'Currency',
    description: 'Defaults for new invoices.',
    control: <SelectButton>USD &mdash; United States Dollar</SelectButton>,
  },
  {
    label: 'Notes',
    control: <Textarea rows={3} placeholder="Anything billing should know..." />,
  },
  {
    label: 'Auto-pay',
    description: 'Charge the saved card automatically when invoices are due.',
    control: <Switch defaultChecked />,
  },
];
const MOCK_TITLE = 'Billing profile';
const MOCK_DESCRIPTION =
  'Information used on invoices, statements, and receipts.';
// @mock-end

export interface FormLayoutTwoColumnProps {
  rows?: ReadonlyArray<Row>;
  title?: string;
  description?: string;
}

export function FormLayoutTwoColumn({
  rows = MOCK_ROWS,
  title = MOCK_TITLE,
  description = MOCK_DESCRIPTION,
}: FormLayoutTwoColumnProps = {}) {
  return (
    <div className="px-6 py-8" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-3xl space-y-2 pb-6">
        <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {description}
        </p>
      </div>

      <div className="mx-auto max-w-3xl">
        <dl
          className="divide-y rounded-xl border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid items-start gap-4 px-5 py-4 sm:grid-cols-[200px_1fr]"
              style={{ borderColor: 'var(--border)' }}
            >
              <dt className="space-y-0.5">
                <div className="font-medium text-sm">{row.label}</div>
                {row.description ? (
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {row.description}
                  </div>
                ) : null}
              </dt>
              <dd>{row.control}</dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center justify-end gap-2 pt-5">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save profile</Button>
        </div>
      </div>
    </div>
  );
}
