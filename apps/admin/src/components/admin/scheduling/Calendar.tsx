'use client';

import * as React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CalendarEvent } from '@/src/lib/scheduling/events';
import { snapRangeToBookableSlot } from '@/src/lib/scheduling/slots';
import type { CollectField } from '@/src/lib/validation/scheduling';

import { AvailabilityEditor } from './AvailabilityEditor';
import { AvailabilityOverlayDialog } from './AvailabilityOverlayDialog';
import { BookingLinkCardRows, type BookingLinkRow } from './BookingLinkCardRows';
import { BookingLinkFormDialog, type BookingLinkDto } from './BookingLinkFormDialog';
import {
  CreateBookingFromSlotDialog,
  type SlotSelection,
} from './CreateBookingFromSlotDialog';
import { DayCalendarGrid } from './DayCalendarGrid';
import {
  buildAvailabilityFilterKey,
  buildDefaultVisibility,
  eventMatchesVisibility,
  LayerVisibilityMenu,
  type AvailabilityFilterOption,
  type AvailabilityFilterVisibility,
} from './LayerVisibilityMenu';
import { MonthCalendarGrid } from './MonthCalendarGrid';
import { WeekCalendarGrid } from './WeekCalendarGrid';
import {
  addDays,
  dayRange,
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  monthRange,
  startOfDay,
  weekRange,
  type CalendarView,
} from './calendar-utils';

interface ApiLink {
  id: string;
  name: string;
  slug: string;
  publicToken: string;
  linkKind: BookingLinkRow['linkKind'];
  isActive: boolean;
  serviceId: string | null;
  contactId: string | null;
  durationMinutes: number | null;
  channel: string | null;
  fieldsToCollect: CollectField[];
  contact: { id: string; name: string | null; email: string | null } | null;
  _count: { bookings: number };
}

export function Calendar(): React.ReactElement {
  const [view, setView] = React.useState<CalendarView>('week');
  const [anchor, setAnchor] = React.useState<Date>(() => startOfDay(new Date()));
  const [visibility, setVisibility] = React.useState<AvailabilityFilterVisibility>({});
  const [filterOptions, setFilterOptions] = React.useState<AvailabilityFilterOption[]>([]);
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = React.useState(true);

  const [links, setLinks] = React.useState<ApiLink[]>([]);
  const [linkDialogOpen, setLinkDialogOpen] = React.useState(false);
  const [editingLink, setEditingLink] = React.useState<BookingLinkDto | null>(null);
  const [emailingId, setEmailingId] = React.useState<string | null>(null);

  const [slot, setSlot] = React.useState<SlotSelection | null>(null);
  const [slotDialogOpen, setSlotDialogOpen] = React.useState(false);
  const [availabilityEvent, setAvailabilityEvent] = React.useState<CalendarEvent | null>(null);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = React.useState(false);

  const range = React.useMemo(() => {
    if (view === 'month') return monthRange(anchor);
    if (view === 'day') return dayRange(anchor);
    return weekRange(anchor);
  }, [view, anchor]);

  const loadEvents = React.useCallback(async () => {
    setLoadingEvents(true);
    try {
      const params = new URLSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      });
      const res = await fetch(`/api/admin/calendar/events?${params.toString()}`);
      const body = (await res.json()) as { events?: CalendarEvent[] };
      setEvents(body.events ?? []);
    } catch {
      toast.error('Could not load calendar events.');
    } finally {
      setLoadingEvents(false);
    }
  }, [range.from, range.to]);

  const loadLinks = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/booking-links');
      const body = (await res.json()) as { links?: ApiLink[] };
      setLinks(body.links ?? []);
    } catch {
      toast.error('Could not load booking links.');
    }
  }, []);

  const loadFilterOptions = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/availability-subjects');
      const body = (await res.json()) as {
        subjects?: {
          owners: Array<{ id: string; fullName: string }>;
          contractors: Array<{ id: string; fullName: string }>;
          services: Array<{ id: string; name: string }>;
          businesses: Array<{ id: string; name: string }>;
        };
        actingUser?: { id?: string; permissions?: { availability?: { layers?: string[]; scope?: string } } } | null;
      };
      const subjects = body.subjects;
      if (!subjects) return;

      const allowedLayers = new Set(body.actingUser?.permissions?.availability?.layers ?? []);
      const actingUser = body.actingUser;
      const scope = actingUser?.permissions?.availability?.scope ?? 'own';
      const actingUserId = actingUser?.id;
      const options: AvailabilityFilterOption[] = [];

      for (const owner of subjects.owners) {
        if (!allowedLayers.has('owner')) continue;
        if (scope === 'own' && actingUserId && owner.id !== actingUserId) continue;
        options.push({
          key: buildAvailabilityFilterKey('owner', owner.id),
          subjectKind: 'owner',
          entityId: owner.id,
          label: owner.fullName,
        });
      }

      for (const contractor of subjects.contractors) {
        if (!allowedLayers.has('contractor')) continue;
        if (scope === 'own' && actingUserId && contractor.id !== actingUserId) continue;
        options.push({
          key: buildAvailabilityFilterKey('contractor', contractor.id),
          subjectKind: 'contractor',
          entityId: contractor.id,
          label: contractor.fullName,
        });
      }
      for (const business of subjects.businesses) {
        if (!allowedLayers.has('business')) continue;
        options.push({
          key: buildAvailabilityFilterKey('business', business.id),
          subjectKind: 'business',
          entityId: business.id,
          label: business.name,
        });
      }
      for (const service of subjects.services) {
        if (!allowedLayers.has('service')) continue;
        options.push({
          key: buildAvailabilityFilterKey('service', service.id),
          subjectKind: 'service',
          entityId: service.id,
          label: service.name,
        });
      }

      setFilterOptions(options);
      setVisibility((prev) => {
        const next = buildDefaultVisibility(options);
        for (const option of options) {
          if (option.key in prev) next[option.key] = prev[option.key]!;
        }
        return next;
      });
    } catch {
      /* filter menu stays empty */
    }
  }, []);

  React.useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  React.useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  React.useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  // Deep-link to a section via hash (?section folded into hash by the redirects).
  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const visibleEvents = React.useMemo(
    () => events.filter((ev) => eventMatchesVisibility(ev, visibility)),
    [events, visibility],
  );

  const step = (dir: 1 | -1) => {
    setAnchor((prev) => {
      if (view === 'month') return new Date(prev.getFullYear(), prev.getMonth() + dir, 1);
      if (view === 'day') return addDays(prev, dir);
      return addDays(prev, dir * 7);
    });
  };

  const snapSlotSelection = React.useCallback(
    (start: Date, end: Date): SlotSelection => {
      const windows = visibleEvents
        .filter((ev) => ev.kind === 'availability' && ev.isAvailable !== false)
        .map((ev) => ({
          startsAt: ev.startsAt,
          endsAt: ev.endsAt,
          slotDurationMinutes: ev.slotDurationMinutes ?? 60,
          slotGapMinutes: ev.slotGapMinutes ?? 15,
        }));
      const snapped = snapRangeToBookableSlot({ start, end, windows });
      return snapped ?? { start, end };
    },
    [visibleEvents],
  );

  const rangeLabel =
    view === 'month' ? formatMonthLabel(anchor) : view === 'day' ? formatDayLabel(anchor) : formatWeekLabel(anchor);

  const linkRows: BookingLinkRow[] = links.map((l) => ({
    id: l.id,
    name: l.name,
    slug: l.slug,
    publicToken: l.publicToken,
    linkKind: l.linkKind,
    isActive: l.isActive,
    bookingsCount: l._count.bookings,
    contactEmail: l.contact?.email ?? null,
  }));

  const handleCopy = async (row: BookingLinkRow) => {
    const url = `${window.location.origin}/book/${row.publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Booking URL copied.');
    } catch {
      toast.error(url);
    }
  };

  const handleEmail = async (row: BookingLinkRow) => {
    const to = row.contactEmail ?? window.prompt('Send the booking page to which email?');
    if (!to) return;
    setEmailingId(row.id);
    try {
      const res = await fetch(`/api/admin/booking-links/${row.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      });
      const body = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Email failed.');
      toast.success(body.detail ?? `Emailed booking page to ${to}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not email booking page.');
    } finally {
      setEmailingId(null);
    }
  };

  const handleEdit = (row: BookingLinkRow) => {
    const full = links.find((l) => l.id === row.id);
    if (!full) return;
    setEditingLink({
      id: full.id,
      name: full.name,
      slug: full.slug,
      linkKind: full.linkKind,
      isActive: full.isActive,
      serviceId: full.serviceId,
      contactId: full.contactId,
      durationMinutes: full.durationMinutes,
      channel: full.channel,
      fieldsToCollect: full.fieldsToCollect ?? [],
    });
    setLinkDialogOpen(true);
  };

  const handleToggleActive = async (row: BookingLinkRow) => {
    try {
      const res = await fetch(`/api/admin/booking-links/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      if (!res.ok) throw new Error('Update failed.');
      toast.success(row.isActive ? 'Link deactivated.' : 'Link activated.');
      void loadLinks();
    } catch {
      toast.error('Could not update link.');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
        </div>
      </header>

      <Card className="admin-surface overflow-hidden">
        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Controls: view tabs (left) + nav + layers dropdown (right) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAnchor(startOfDay(new Date()))}>
                Today
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => step(-1)} aria-label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-40 text-center text-sm font-medium">{rangeLabel}</div>
              <Button variant="outline" size="icon-sm" onClick={() => step(1)} aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </Button>
              {/* Right-aligned overlay dropdown ABOVE the calendar */}
              <LayerVisibilityMenu options={filterOptions} visibility={visibility} onChange={setVisibility} />
            </div>
          </div>

          {(view === 'week' || view === 'day') && (
            <p className="text-xs text-muted-foreground">
              Tip: click or drag time slots to create a booking. Right-click (or long-press on touch)
              availability overlays to edit.
            </p>
          )}

          <div className={loadingEvents ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {view === 'month' && (
              <MonthCalendarGrid
                anchor={anchor}
                events={visibleEvents}
                onSelectDay={(day) => {
                  setAnchor(day);
                  setView('day');
                }}
              />
            )}
            {view === 'week' && (
              <WeekCalendarGrid
                anchor={anchor}
                events={visibleEvents}
                onCreateSlot={(start, end) => {
                  setSlot(snapSlotSelection(start, end));
                  setSlotDialogOpen(true);
                }}
                onAvailabilityClick={(ev) => {
                  setAvailabilityEvent(ev);
                  setAvailabilityDialogOpen(true);
                }}
              />
            )}
            {view === 'day' && (
              <DayCalendarGrid
                anchor={anchor}
                events={visibleEvents}
                onCreateSlot={(start, end) => {
                  setSlot(snapSlotSelection(start, end));
                  setSlotDialogOpen(true);
                }}
                onAvailabilityClick={(ev) => {
                  setAvailabilityEvent(ev);
                  setAvailabilityDialogOpen(true);
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Availability editor — kept in the DOM on the same page */}
      <Card id="availability" className="admin-surface scroll-mt-20">
        <CardContent className="p-4 sm:p-6">
          <AvailabilityEditor
            onSaved={() => {
              void loadEvents();
              void loadFilterOptions();
            }}
          />
        </CardContent>
      </Card>

      {/* Booking links section */}
      <Card id="booking-links" className="admin-surface scroll-mt-20">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Booking links</h2>
              <p className="text-xs text-muted-foreground">
                Public pages that collect bookings. Copy the URL or email the page itself.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingLink(null);
                setLinkDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add booking link
            </Button>
          </div>
          <BookingLinkCardRows
            rows={linkRows}
            onCopy={handleCopy}
            onEmail={handleEmail}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            emailingId={emailingId}
          />
        </CardContent>
      </Card>

      <BookingLinkFormDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        link={editingLink}
        onSaved={loadLinks}
      />
      <CreateBookingFromSlotDialog
        open={slotDialogOpen}
        onOpenChange={setSlotDialogOpen}
        slot={slot}
        onCreated={({ bookingUrl }) => {
          void loadEvents();
          void loadLinks();
          if (bookingUrl) {
            const full = `${window.location.origin}${bookingUrl}`;
            void navigator.clipboard?.writeText(full).then(
              () => toast.success('Confirmation link copied to clipboard.'),
              () => undefined,
            );
          }
        }}
      />
      <AvailabilityOverlayDialog
        open={availabilityDialogOpen}
        onOpenChange={setAvailabilityDialogOpen}
        event={availabilityEvent}
        onSaved={() => void loadEvents()}
      />
    </div>
  );
}
