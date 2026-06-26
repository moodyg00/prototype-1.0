import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface DialogAlertDestructiveProps {}

export function DialogAlertDestructive(_props: DialogAlertDestructiveProps = {}) {
  return (
    <div
      className="relative grid place-items-center px-6 py-10"
      style={{
        background: 'color-mix(in srgb, var(--foreground) 14%, var(--background))',
      }}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-xl border shadow-xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--destructive, #dc2626) 12%, transparent)',
              color: 'var(--destructive, #dc2626)',
            }}
          >
            <TriangleAlert className="size-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-base tracking-tight">Delete &ldquo;Q3 invoices&rdquo;?</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              This permanently deletes 142 invoice records and all attachments. This action cannot
              be undone.
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 px-6 py-3"
          style={{
            background: 'color-mix(in srgb, var(--muted) 60%, var(--card) 40%)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button variant="destructive" size="sm">
            Yes, delete records
          </Button>
        </div>
      </div>
    </div>
  );
}
