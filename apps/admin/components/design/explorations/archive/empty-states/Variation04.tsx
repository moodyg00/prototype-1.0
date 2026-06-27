import { Plus, Inbox } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface EmptyStateTableRowProps {}

export function EmptyStateTableRow(_props: EmptyStateTableRowProps = {}) {
  return (
    <div className="p-6">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:!bg-transparent">
              <TableCell colSpan={5} className="whitespace-normal py-16">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div
                    className="grid size-12 place-items-center rounded-xl border"
                    style={{
                      background: 'var(--card)',
                      borderColor: 'var(--border)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    <Inbox className="size-5" />
                  </div>
                  <div className="max-w-sm">
                    <div className="font-semibold">No work orders yet</div>
                    <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      Once you create your first work order, it will show up here. You can also let
                      the agent draft one from a recent customer message.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="gap-1.5">
                      <Plus className="size-3.5" />
                      New work order
                    </Button>
                    <Button variant="outline" size="sm">
                      Import from CSV
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
