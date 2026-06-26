import { Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface LoadingButtonMatrixProps {}

export function LoadingButtonMatrix(_props: LoadingButtonMatrixProps = {}) {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <div
          className="text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Idle &rarr; Loading
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col items-center gap-2">
            <Button size="xs" className="gap-1">
              <Plus />
              New
            </Button>
            <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              xs
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button size="sm" className="gap-1.5">
              <Plus />
              New record
            </Button>
            <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              sm
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button className="gap-2">
              <Save />
              Save changes
            </Button>
            <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              default
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button size="lg" className="gap-2">
              <Save />
              Save changes
            </Button>
            <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              lg
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div
          className="text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Loading state
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col items-center gap-2">
            <Button size="xs" loading className="gap-1">
              <Plus />
              New
            </Button>
            <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              xs
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button size="sm" loading className="gap-1.5">
              <Plus />
              New record
            </Button>
            <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              sm
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button loading className="gap-2">
              <Save />
              Save changes
            </Button>
            <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              default
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button size="lg" loading className="gap-2">
              <Save />
              Save changes
            </Button>
            <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              lg
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div
          className="text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Variants while loading
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button loading>Primary</Button>
          <Button loading variant="secondary">
            Secondary
          </Button>
          <Button loading variant="outline">
            Outline
          </Button>
          <Button loading variant="ghost">
            Ghost
          </Button>
          <Button loading variant="destructive">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
