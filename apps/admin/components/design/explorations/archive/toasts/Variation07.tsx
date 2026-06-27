import { CalendarDays, MapPin, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface ToastLongFormProps {}

export function ToastLongForm(_props: ToastLongFormProps = {}) {
  return (
    <div
      className="grid place-items-center px-6 py-10"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border shadow-xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-2.5"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>
                AR
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-xs">Avery R.</span>
            <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              shared a visit with you
            </span>
          </div>
          <Badge variant="info" size="sm">
            Notification
          </Badge>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="space-y-1">
            <div className="font-semibold text-sm tracking-tight">
              Site visit &mdash; Acme Co. HQ
            </div>
            <div
              className="text-xs leading-relaxed"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Walkthrough of the second-floor mechanical room with the facilities manager. Bring
              the updated quote and the network drawing.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
              <span>Thu, Jun 12</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
              <span>9:30 &ndash; 10:30 AM</span>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <MapPin className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
              <span>142 Mission St, San Francisco, CA</span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t px-4 py-2.5"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
            Decline
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
            View
          </Button>
          <Button size="sm" className="h-7 px-2.5 text-xs">
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
