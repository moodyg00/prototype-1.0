'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { CalendarEvent } from '@/src/lib/scheduling/events';
import { timeLabel } from './calendar-utils';

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function AvailabilityOverlayDialog({
  open,
  onOpenChange,
  event,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onSaved?: () => void;
}): React.ReactElement {
  const [addStart, setAddStart] = React.useState('13:00');
  const [addEnd, setAddEnd] = React.useState('17:00');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!event) return;
    setAddStart(toTimeInput(event.startsAt));
    setAddEnd(toTimeInput(event.endsAt));
  }, [event]);

  const patch = async (payload: {
    addExceptions?: Array<{
      exceptionType: 'exclude' | 'add';
      specificDate: string;
      startTime: string;
      endTime: string;
    }>;
    removeExceptionIds?: string[];
  }) => {
    if (!event?.scheduleId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/availability-schedules/${event.scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Update failed.');
      toast.success('Availability updated.');
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update availability.');
    } finally {
      setSaving(false);
    }
  };

  const blockWindow = () => {
    if (!event) return;
    void patch({
      addExceptions: [
        {
          exceptionType: 'exclude',
          specificDate: toDateInput(event.startsAt),
          startTime: toTimeInput(event.startsAt),
          endTime: toTimeInput(event.endsAt),
        },
      ],
    });
  };

  const addHours = () => {
    if (!event) return;
    void patch({
      addExceptions: [
        {
          exceptionType: 'add',
          specificDate: toDateInput(event.startsAt),
          startTime: addStart,
          endTime: addEnd,
        },
      ],
    });
  };

  const removeException = () => {
    if (!event?.exceptionId) return;
    void patch({ removeExceptionIds: [event.exceptionId] });
  };

  const dateLabel = event
    ? new Date(event.startsAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const windowLabel = event
    ? `${timeLabel(new Date(event.startsAt))} – ${timeLabel(new Date(event.endsAt))}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit availability</DialogTitle>
          <DialogDescription>
            {event?.subjectLabel ?? 'Availability'} · {dateLabel}
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="space-y-4 text-sm">
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
            <p className="font-medium">{windowLabel}</p>
            <p className="text-xs text-muted-foreground">
              {event?.isAvailable === false ? 'Blocked time' : 'Open hours'}
              {event?.exceptionType ? ` · ${event.exceptionType} exception` : ''}
            </p>
          </div>

          {event?.isAvailable !== false && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</p>
              <Button variant="outline" className="w-full justify-start" loading={saving} onClick={blockWindow}>
                Block this day/time
              </Button>
            </div>
          )}

          <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Add extra hours</p>
            <div className="flex flex-wrap items-center gap-2">
              <Input type="time" value={addStart} onChange={(e) => setAddStart(e.target.value)} />
              <span className="text-muted-foreground">to</span>
              <Input type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)} />
            </div>
            <Button size="sm" loading={saving} onClick={addHours}>
              Add hours
            </Button>
          </div>

          {event?.exceptionId && (
            <Button variant="destructive" className="w-full" loading={saving} onClick={removeException}>
              Remove this exception
            </Button>
          )}
        </DialogPanel>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
