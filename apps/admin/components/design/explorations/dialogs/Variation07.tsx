import { X, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type TimelineRow = { time: string; label: string; detail: string };
type ContactItem = { icon: LucideIcon; value: string };

// @mock-start
const MOCK_TIMELINE: TimelineRow[] = [
  { time: '2h ago', label: 'Call logged', detail: '8 min &middot; Renewal discussion' },
  { time: 'Yesterday', label: 'Quote sent', detail: '$12,500 / yr' },
  { time: 'May 24', label: 'Email reply', detail: '&ldquo;Looks good, looping in finance&rdquo;' },
];
const MOCK_CONTACT_ITEMS: ContactItem[] = [
  { icon: Building2, value: '142 Mission St, San Francisco, CA' },
  { icon: Phone, value: '+1 415 555 0143' },
  { icon: Mail, value: 'avery@acme.co' },
  { icon: MapPin, value: 'Pacific Time' },
];
// @mock-end

export interface DialogRightDrawerProps {
  timeline?: ReadonlyArray<TimelineRow>;
  contactItems?: ReadonlyArray<ContactItem>;
}

export function DialogRightDrawer({
  timeline = MOCK_TIMELINE,
  contactItems = MOCK_CONTACT_ITEMS,
}: DialogRightDrawerProps) {
  return (
    <div
      className="relative flex h-[520px]"
      style={{
        background: 'color-mix(in srgb, var(--foreground) 14%, var(--background))',
      }}
    >
      <div className="flex-1 px-6 py-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Workspace content (visible behind the drawer)
      </div>

      <aside
        className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l shadow-2xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-start justify-between gap-3 border-b px-6 py-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>
                AC
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <div className="font-semibold text-base tracking-tight">Acme Co.</div>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm" className="gap-1">
                  <span className="size-1.5 rounded-full bg-current" />
                  Active
                </Badge>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Customer since 2024
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 transition-colors hover:bg-[var(--muted)]"
            aria-label="Close"
          >
            <X className="size-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            <div
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Contact
            </div>
            <div className="space-y-2">
              {contactItems.map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-center gap-2.5 text-sm">
                  <Icon className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="my-5 h-px w-full"
            style={{ background: 'var(--border)' }}
          />

          <div className="space-y-3">
            <div
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Recent activity
            </div>
            <ol className="space-y-3">
              {timeline.map((row, idx) => (
                <li key={idx} className="grid grid-cols-[80px_1fr] gap-3">
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {row.time}
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-medium text-sm">{row.label}</div>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--muted-foreground)' }}
                      dangerouslySetInnerHTML={{ __html: row.detail }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t px-6 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button size="sm">Open record</Button>
        </div>
      </aside>
    </div>
  );
}
