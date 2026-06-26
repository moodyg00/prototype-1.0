import { Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ReviewSection = {
  title: string;
  rows: [string, string][];
};

// @mock-start
const MOCK_SECTIONS: ReviewSection[] = [
  {
    title: 'Customer',
    rows: [
      ['Company', 'Acme Co.'],
      ['Primary contact', 'Avery Reyes'],
      ['Email', 'avery@acme.co'],
    ],
  },
  {
    title: 'Quote',
    rows: [
      ['Plan', 'Annual subscription'],
      ['Term', '12 months &middot; auto-renew'],
      ['Total', '$12,500.00'],
    ],
  },
  {
    title: 'Billing',
    rows: [
      ['Method', 'ACH (Bank ****8821)'],
      ['Address', '142 Mission St, San Francisco, CA 94105'],
      ['Tax ID', 'On file'],
    ],
  },
];
// @mock-end

export interface FormLayoutReviewSummaryProps {
  sections?: ReadonlyArray<ReviewSection>;
}

export function FormLayoutReviewSummary({
  sections = MOCK_SECTIONS,
}: FormLayoutReviewSummaryProps = {}) {
  return (
    <div className="px-6 py-8" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-1">
          <Badge variant="success" size="sm" className="gap-1.5">
            <Check className="size-3" />
            Ready to submit
          </Badge>
          <h2 className="font-semibold text-xl tracking-tight">Review &amp; send quote</h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Confirm everything is right. You can still edit any section.
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.title}
              className="overflow-hidden rounded-xl border"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div
                className="flex items-center justify-between gap-3 border-b px-5 py-3"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="font-medium text-sm">{section.title}</div>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors hover:bg-[var(--muted)]"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
              </div>
              <dl className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {section.rows.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[160px_1fr] items-center gap-4 px-5 py-2.5 text-sm"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <dt style={{ color: 'var(--muted-foreground)' }}>{label}</dt>
                    <dd dangerouslySetInnerHTML={{ __html: value }} />
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between gap-3 rounded-xl border p-4"
          style={{
            background: 'var(--primary-soft)',
            borderColor: 'color-mix(in srgb, var(--primary) 22%, var(--border))',
          }}
        >
          <div className="space-y-0.5">
            <div className="font-medium text-sm">By submitting</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Acme Co. will receive an email and the quote becomes the active proposal.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Back
            </Button>
            <Button size="sm">Send quote</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
