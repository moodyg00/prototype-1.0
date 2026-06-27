import { X, FileText, Image as ImageIcon, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AttachOption = { icon: typeof FileText; label: string; detail: string };

// @mock-start
const MOCK_ATTACH_OPTIONS: AttachOption[] = [
  { icon: FileText, label: 'Document', detail: 'PDF, DOCX, MD up to 25 MB' },
  { icon: ImageIcon, label: 'Image', detail: 'PNG, JPG, GIF up to 10 MB' },
  { icon: Link2, label: 'Link', detail: 'Paste a URL or share path' },
];
// @mock-end

export interface DialogBottomSheetProps {
  attachOptions?: ReadonlyArray<AttachOption>;
}

export function DialogBottomSheet({ attachOptions = MOCK_ATTACH_OPTIONS }: DialogBottomSheetProps) {
  return (
    <div
      className="relative flex h-[480px] flex-col items-center justify-end px-6 pb-0 pt-16"
      style={{
        background: 'color-mix(in srgb, var(--foreground) 14%, var(--background))',
      }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-t-2xl border border-b-0 shadow-2xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col items-center gap-3 px-6 pt-3">
          <span className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
          <div className="flex w-full items-start justify-between gap-3 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-semibold text-base tracking-tight">Attach to work order</h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Add reference material the technician will see on-site.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 transition-colors hover:bg-[var(--muted)]"
              aria-label="Close"
            >
              <X className="size-4" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-6 pb-5">
          {attachOptions.map(({ icon: Icon, label, detail }) => (
            <button
              key={label}
              type="button"
              className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-[var(--muted)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="grid size-8 place-items-center rounded-md"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
              >
                <Icon className="size-4" />
              </div>
              <div>
                <div className="font-medium text-sm">{label}</div>
                <div className="text-[11px] leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                  {detail}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div
          className="flex items-center justify-between gap-2 border-t px-6 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Or drag &amp; drop anywhere on this sheet
          </span>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
