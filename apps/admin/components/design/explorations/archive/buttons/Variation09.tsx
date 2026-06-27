import { Sparkles, ArrowRight, Plus, Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface ButtonPillProps {}

export function ButtonPill(_props: ButtonPillProps = {}) {
  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Pill primary
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button className="rounded-full px-4">
            <Sparkles />
            Ask agent
          </Button>
          <Button className="rounded-full px-5" size="lg">
            Get started
            <ArrowRight />
          </Button>
          <Button variant="outline" className="rounded-full px-4">
            <Plus />
            New work order
          </Button>
          <Button variant="ghost" className="rounded-full px-4">
            View archive
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Filter chips (rounded-full)
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 rounded-full px-3 text-xs"
          >
            <Filter className="size-3" />
            All
          </Button>
          {['Open', 'In progress', 'Blocked', 'Done'].map((label, idx) => (
            <Button
              key={label}
              size="sm"
              variant={idx === 1 ? 'default' : 'outline'}
              className="h-7 rounded-full px-3 text-xs"
            >
              {idx === 1 && <Check className="size-3" />}
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Inverted pill on tinted surface
        </div>
        <div
          className="flex flex-wrap items-center gap-3 rounded-2xl border p-5"
          style={{
            background:
              'color-mix(in srgb, var(--primary) 8%, var(--card) 92%)',
            borderColor:
              'color-mix(in srgb, var(--primary) 22%, var(--border) 78%)',
          }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--foreground)' }}
          >
            Ready to launch the next campaign?
          </span>
          <Button className="ms-auto rounded-full px-4">
            Launch
            <ArrowRight />
          </Button>
          <Button variant="ghost" className="rounded-full px-4">
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
