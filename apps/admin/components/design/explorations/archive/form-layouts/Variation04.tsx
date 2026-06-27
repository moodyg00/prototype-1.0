import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { SelectButton } from '@/components/ui/select';

// @mock-start
// @mock-end

export interface FormLayoutInlineRowProps {}

export function FormLayoutInlineRow(_props: FormLayoutInlineRowProps = {}) {
  return (
    <div className="px-6 py-10" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-5xl space-y-3">
        <div className="space-y-1">
          <h2 className="font-semibold text-base tracking-tight">Find work orders</h2>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Filter the list inline &mdash; results update as you type.
          </p>
        </div>

        <form
          className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] items-end gap-2 rounded-xl border p-3"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <label className="space-y-1.5">
            <span className="font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Search
            </span>
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput placeholder="Title, customer, or work order #" />
            </InputGroup>
          </label>
          <label className="space-y-1.5">
            <span className="font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Status
            </span>
            <SelectButton>Open</SelectButton>
          </label>
          <label className="space-y-1.5">
            <span className="font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Owner
            </span>
            <SelectButton>Anyone</SelectButton>
          </label>
          <label className="space-y-1.5">
            <span className="font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Date
            </span>
            <Input placeholder="Last 30 days" defaultValue="Last 30 days" />
          </label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="size-3.5" />
              More
            </Button>
            <Button size="sm">Apply</Button>
          </div>
        </form>

        <div
          className="text-xs"
          style={{ color: 'var(--muted-foreground)' }}
        >
          247 results &middot; sorted by latest activity
        </div>
      </div>
    </div>
  );
}
