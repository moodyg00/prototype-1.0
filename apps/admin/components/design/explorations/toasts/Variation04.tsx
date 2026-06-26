import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface ToastBorderedActionProps {}

export function ToastBorderedAction(_props: ToastBorderedActionProps = {}) {
  return (
    <div
      className="grid place-items-center px-6 py-10"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="flex w-full max-w-md items-start gap-3 rounded-xl border p-4 shadow-md"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div
          className="grid size-9 shrink-0 place-items-center rounded-lg"
          style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
        >
          <Bell className="size-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="font-medium text-sm leading-tight">New mention from Avery R.</div>
          <div
            className="text-xs leading-snug"
            style={{ color: 'var(--muted-foreground)' }}
          >
            &ldquo;Can you take this one? Customer asked about the Q3 contract specifically.&rdquo;
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
              View thread
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
              Mark read
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
