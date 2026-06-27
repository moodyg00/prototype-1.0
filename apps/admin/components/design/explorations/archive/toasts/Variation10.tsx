import { Sparkles, ChevronRight, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface ToastAgentFinishedProps {}

export function ToastAgentFinished(_props: ToastAgentFinishedProps = {}) {
  return (
    <div
      className="grid place-items-center px-6 py-10"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border shadow-xl"
        style={{
          background: 'var(--card)',
          borderColor: 'color-mix(in srgb, var(--primary) 22%, var(--border))',
        }}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="relative shrink-0">
            <Avatar className="size-9">
              <AvatarFallback
                style={{
                  background:
                    'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 60%, #a855f7))',
                  color: 'white',
                }}
              >
                <Sparkles className="size-4" />
              </AvatarFallback>
            </Avatar>
            <span
              className="-bottom-0.5 -right-0.5 absolute size-2.5 rounded-full"
              style={{
                background: '#16a34a',
                boxShadow: '0 0 0 2px var(--card)',
              }}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm leading-tight">Atlas finished a task</span>
                <Badge variant="info" size="sm" className="gap-1">
                  Agent
                </Badge>
              </div>
              <button
                type="button"
                className="rounded-md p-1 transition-colors hover:bg-[var(--muted)]"
                aria-label="Dismiss"
              >
                <X className="size-3" style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>

            <div
              className="text-xs leading-snug"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Replied to <span style={{ color: 'var(--foreground)' }}>4 customer emails</span> and
              opened <span style={{ color: 'var(--foreground)' }}>2 follow-up tasks</span>.
            </div>

            <div
              className="rounded-md border p-2 text-xs"
              style={{
                background: 'color-mix(in srgb, var(--muted) 50%, var(--card) 50%)',
                borderColor: 'var(--border)',
              }}
            >
              <span style={{ color: 'var(--muted-foreground)' }}>Preview:</span>{' '}
              &ldquo;Thanks for flagging this &mdash; I&rsquo;ve looped in our renewals team and
              they&rsquo;ll reach out by Friday...&rdquo;
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                3m ago &middot; took 28s
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
              >
                Review work
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
