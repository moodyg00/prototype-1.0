import { Plus, MessageSquare, Sparkles, Mail, FileText, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface ButtonFabProps {}

export function ButtonFab(_props: ButtonFabProps = {}) {
  return (
    <div className="grid gap-10 px-8 py-12 md:grid-cols-3">
      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Primary FAB
        </div>
        <div
          className="relative h-44 rounded-xl border"
          style={{
            background: 'var(--muted)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="absolute inset-0 grid place-items-center">
            <span
              className="text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              page surface
            </span>
          </div>
          <button
            type="button"
            aria-label="Compose"
            className="absolute right-4 bottom-4 grid size-14 place-items-center rounded-full text-white shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'var(--primary)',
              boxShadow:
                '0 12px 24px -8px color-mix(in srgb, var(--primary) 60%, transparent)',
            }}
          >
            <Plus className="size-6" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Speed-dial stack
        </div>
        <div
          className="relative h-44 rounded-xl border"
          style={{
            background: 'var(--muted)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="absolute right-4 bottom-4 flex flex-col items-end gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Email"
              className="rounded-full bg-[var(--card)] shadow-md"
            >
              <Mail />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Note"
              className="rounded-full bg-[var(--card)] shadow-md"
            >
              <FileText />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Call"
              className="rounded-full bg-[var(--card)] shadow-md"
            >
              <Phone />
            </Button>
            <button
              type="button"
              aria-label="Open quick actions"
              className="grid size-12 place-items-center rounded-full text-white shadow-lg"
              style={{
                background: 'var(--primary)',
                boxShadow:
                  '0 12px 24px -8px color-mix(in srgb, var(--primary) 60%, transparent)',
              }}
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Extended FAB (with label)
        </div>
        <div
          className="relative h-44 rounded-xl border"
          style={{
            background: 'var(--muted)',
            borderColor: 'var(--border)',
          }}
        >
          <button
            type="button"
            className="absolute right-4 bottom-4 inline-flex h-12 items-center gap-2 rounded-full px-5 font-medium text-sm text-white shadow-lg"
            style={{
              background: 'var(--primary)',
              boxShadow:
                '0 12px 24px -8px color-mix(in srgb, var(--primary) 60%, transparent)',
            }}
          >
            <Sparkles className="size-4" />
            Ask agent
          </button>
          <button
            type="button"
            className="absolute left-4 bottom-4 inline-flex h-11 items-center gap-2 rounded-full border bg-[var(--card)] px-4 font-medium text-sm shadow-md"
            style={{ borderColor: 'var(--border)' }}
          >
            <MessageSquare className="size-4" />
            New comment
          </button>
        </div>
      </div>
    </div>
  );
}
