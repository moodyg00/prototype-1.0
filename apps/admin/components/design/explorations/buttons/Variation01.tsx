import { Save, Plus, Trash2, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface ButtonVariantMatrixProps {}

export function ButtonVariantMatrix(_props: ButtonVariantMatrixProps = {}) {
  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <div className="space-y-2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Variant matrix
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default">
            <Save />
            Save changes
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">
            <Plus />
            Outline
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">
            Link
            <ExternalLink />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Destructive
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="destructive">
            <Trash2 />
            Delete record
          </Button>
          <Button variant="destructive-outline">
            <Trash2 />
            Delete record
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Trailing affordance
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default">
            Continue
            <ArrowRight />
          </Button>
          <Button variant="outline">
            Continue
            <ArrowRight />
          </Button>
          <Button variant="ghost">
            View all
            <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
