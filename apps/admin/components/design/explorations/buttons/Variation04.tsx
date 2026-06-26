import { Save, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HEAD_CLS = 'font-mono text-[10px] uppercase tracking-[0.18em]';

// @mock-start
// @mock-end

export interface ButtonLoadingDisabledProps {}

export function ButtonLoadingDisabled(_props: ButtonLoadingDisabledProps = {}) {
  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-[88px_1fr]">
        <div
          className={`${HEAD_CLS} self-center`}
          style={{ color: 'var(--muted-foreground)' }}
        >
          Default
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <Save />
            Save
          </Button>
          <Button loading>
            <Save />
            Save
          </Button>
          <Button disabled>
            <Save />
            Save
          </Button>
        </div>

        <div
          className={`${HEAD_CLS} self-center`}
          style={{ color: 'var(--muted-foreground)' }}
        >
          Outline
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline">
            <Send />
            Send invite
          </Button>
          <Button variant="outline" loading>
            <Send />
            Send invite
          </Button>
          <Button variant="outline" disabled>
            <Send />
            Send invite
          </Button>
        </div>

        <div
          className={`${HEAD_CLS} self-center`}
          style={{ color: 'var(--muted-foreground)' }}
        >
          Destructive
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="destructive">
            <Trash2 />
            Delete
          </Button>
          <Button variant="destructive" loading>
            <Trash2 />
            Delete
          </Button>
          <Button variant="destructive" disabled>
            <Trash2 />
            Delete
          </Button>
        </div>

        <div
          className={`${HEAD_CLS} self-center`}
          style={{ color: 'var(--muted-foreground)' }}
        >
          Ghost
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button variant="ghost" loading>
            Cancel
          </Button>
          <Button variant="ghost" disabled>
            Cancel
          </Button>
        </div>

        <div
          className={`${HEAD_CLS} self-center`}
          style={{ color: 'var(--muted-foreground)' }}
        >
          Icon
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Save">
            <Save />
          </Button>
          <Button variant="outline" size="icon" loading aria-label="Saving" />
          <Button variant="outline" size="icon" disabled aria-label="Save">
            <Save />
          </Button>
        </div>
      </div>

      <div
        className="rounded-lg border px-4 py-3 text-xs"
        style={{
          background: 'var(--muted)',
          borderColor: 'var(--border)',
          color: 'var(--muted-foreground)',
        }}
      >
        Loading state preserves button width and shows a centered spinner;
        label is visually hidden via{' '}
        <code className="font-mono">data-loading</code>.
      </div>
    </div>
  );
}
