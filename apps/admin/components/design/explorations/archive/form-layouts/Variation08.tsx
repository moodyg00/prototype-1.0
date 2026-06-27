import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectButton } from '@/components/ui/select';

// @mock-start
// @mock-end

export interface FormLayoutSplitPreviewProps {}

export function FormLayoutSplitPreview(_props: FormLayoutSplitPreviewProps = {}) {
  return (
    <div className="px-6 py-8" style={{ background: 'var(--background)' }}>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <div className="space-y-1">
            <div
              className="text-[11px] font-mono uppercase tracking-[0.22em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Compose
            </div>
            <h2 className="font-semibold text-xl tracking-tight">New customer announcement</h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Edit on the left &mdash; preview updates live on the right.
            </p>
          </div>

          <div className="space-y-4">
            <Field>
              <FieldLabel>Subject line</FieldLabel>
              <Input defaultValue="A few updates about your account" />
            </Field>
            <Field>
              <FieldLabel>From</FieldLabel>
              <SelectButton>Avery Reyes &lt;avery@proto-2.com&gt;</SelectButton>
            </Field>
            <Field>
              <FieldLabel>Body</FieldLabel>
              <Textarea
                rows={8}
                defaultValue="Hi Acme Co. team,&#10;&#10;A short note to share two changes coming July 1: faster invoice sync and a new customer portal..."
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm">
              Save draft
            </Button>
            <Button size="sm">Send announcement</Button>
          </div>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{
            background: 'color-mix(in srgb, var(--muted) 50%, var(--card) 50%)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <span>Live preview</span>
            <Badge variant="info" size="sm">
              Email
            </Badge>
          </div>

          <div
            className="overflow-hidden rounded-xl border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div
              className="flex items-center gap-3 border-b px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <Avatar className="size-8">
                <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>
                  AR
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">Avery Reyes</div>
                <div className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  to Acme Co. team &middot; just now
                </div>
              </div>
              <Mail className="size-4" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div className="space-y-3 px-4 py-4">
              <h3 className="font-semibold text-base">A few updates about your account</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                Hi Acme Co. team,
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                A short note to share two changes coming July 1: faster invoice sync and a new
                customer portal...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
