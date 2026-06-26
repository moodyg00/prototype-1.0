'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import type { ActingUser } from '@/src/lib/user-roles/permissions';
import {
  AVAILABILITY_SUBJECT_KINDS,
  type AvailabilityExceptionType,
  type AvailabilitySubjectKind,
} from '@/src/lib/validation/scheduling';
import {
  remainderOfMonthRange,
  WEEKDAY_SHORT,
} from './calendar-utils';

type SubjectPicker = {
  owners: Array<{ id: string; fullName: string }>;
  contractors: Array<{ id: string; fullName: string }>;
  services: Array<{ id: string; name: string }>;
  businesses: Array<{ id: string; name: string; isPrimary: boolean }>;
};

type PatternLine = {
  key: string;
  weekIndex: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type ExceptionLine = {
  key: string;
  exceptionType: AvailabilityExceptionType;
  specificDate: string;
  startTime: string;
  endTime: string;
};

type Conflict = {
  scheduleId: string;
  subjectLabel: string;
  validFrom: string;
  validTo: string;
};

const TIME_OPTIONS = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 20; h += 1) {
    out.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

const SUBJECT_LABELS: Record<AvailabilitySubjectKind, string> = {
  owner: 'Owner',
  contractor: 'Contractor',
  business: 'Business',
  service: 'Service',
};

/** Mon → Sun (JS getDay: 1–6, then 0). */
const WEEK_DAYS_MON_SUN = [1, 2, 3, 4, 5, 6, 0] as const;

function makeKey() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultPatternLines(patternWeeks: 1 | 2): PatternLine[] {
  const lines: PatternLine[] = [];
  const weeks = patternWeeks === 2 ? [0, 1] : [0];
  for (const weekIndex of weeks) {
    for (const dayOfWeek of WEEK_DAYS_MON_SUN) {
      lines.push({
        key: makeKey(),
        weekIndex,
        dayOfWeek,
        startTime: '07:00',
        endTime: '20:00',
      });
    }
  }
  return lines;
}

function patternWeekIndexes(patternWeeks: 1 | 2): number[] {
  return patternWeeks === 2 ? [0, 1] : [0];
}

const DAY_ORDER_MON_SUN = new Map(WEEK_DAYS_MON_SUN.map((day, index) => [day, index]));

function linesForWeek(lines: PatternLine[], weekIndex: number): PatternLine[] {
  return lines
    .filter((line) => line.weekIndex === weekIndex)
    .sort((a, b) => (DAY_ORDER_MON_SUN.get(a.dayOfWeek) ?? 0) - (DAY_ORDER_MON_SUN.get(b.dayOfWeek) ?? 0));
}

function datePresetRange(preset: string, now = new Date()): { from: string; to: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  if (preset === 'remainder') return remainderOfMonthRange(now);
  if (preset === '1w') {
    end.setDate(end.getDate() + 6);
  } else if (preset === '1m') {
    end.setMonth(end.getMonth() + 1);
    end.setDate(end.getDate() - 1);
  } else if (preset === '3m') {
    end.setMonth(end.getMonth() + 3);
    end.setDate(end.getDate() - 1);
  } else if (preset === '1y') {
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);
  }
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

function canUseSubject(actingUser: ActingUser | null, subjectKind: AvailabilitySubjectKind): boolean {
  if (!actingUser) return true;
  return actingUser.permissions.availability.layers.includes(subjectKind);
}

export function AvailabilityEditor({ onSaved }: { onSaved?: () => void }): React.ReactElement {
  const defaults = remainderOfMonthRange();
  const [subjects, setSubjects] = React.useState<SubjectPicker | null>(null);
  const [actingUser, setActingUser] = React.useState<ActingUser | null>(null);
  const [subjectKind, setSubjectKind] = React.useState<AvailabilitySubjectKind>('owner');
  const [entityId, setEntityId] = React.useState('');
  const [patternWeeks, setPatternWeeks] = React.useState<1 | 2>(1);
  const [validFrom, setValidFrom] = React.useState(defaults.from);
  const [validTo, setValidTo] = React.useState(defaults.to);
  const [slotDurationMinutes, setSlotDurationMinutes] = React.useState('60');
  const [slotGapMinutes, setSlotGapMinutes] = React.useState('15');
  const [patternLines, setPatternLines] = React.useState<PatternLine[]>(() => defaultPatternLines(1));
  const [excludes, setExcludes] = React.useState<ExceptionLine[]>([]);
  const [additions, setAdditions] = React.useState<ExceptionLine[]>([]);
  const [publishing, setPublishing] = React.useState(false);
  const [conflicts, setConflicts] = React.useState<Conflict[]>([]);
  const [conflictOpen, setConflictOpen] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/availability-subjects');
        const body = (await res.json()) as {
          subjects?: SubjectPicker;
          actingUser?: ActingUser | null;
        };
        setSubjects(body.subjects ?? null);
        setActingUser(body.actingUser ?? null);

        const allowed = AVAILABILITY_SUBJECT_KINDS.find((kind) =>
          canUseSubject(body.actingUser ?? null, kind),
        );
        if (allowed) setSubjectKind(allowed);
      } catch {
        toast.error('Could not load availability subjects.');
      }
    })();
  }, []);

  const entityOptions = React.useMemo(() => {
    if (!subjects) return [];
    if (subjectKind === 'owner') return subjects.owners.map((o) => ({ id: o.id, label: o.fullName }));
    if (subjectKind === 'contractor') return subjects.contractors.map((c) => ({ id: c.id, label: c.fullName }));
    if (subjectKind === 'service') return subjects.services.map((s) => ({ id: s.id, label: s.name }));
    return subjects.businesses.map((b) => ({
      id: b.id,
      label: b.isPrimary ? `${b.name} (primary)` : b.name,
    }));
  }, [subjects, subjectKind]);

  React.useEffect(() => {
    if (entityOptions.length === 0) {
      setEntityId('');
      return;
    }
    if (!entityOptions.some((option) => option.id === entityId)) {
      setEntityId(entityOptions[0]?.id ?? '');
    }
  }, [entityOptions, entityId]);

  React.useEffect(() => {
    setPatternLines(defaultPatternLines(patternWeeks));
  }, [patternWeeks]);

  const buildPayload = (confirmOverwrite: boolean) => ({
    subjectKind,
    userId: subjectKind === 'owner' || subjectKind === 'contractor' ? entityId : undefined,
    serviceId: subjectKind === 'service' ? entityId : undefined,
    businessId: subjectKind === 'business' ? entityId : undefined,
    patternWeeks,
    validFrom,
    validTo,
    slotDurationMinutes: Number(slotDurationMinutes),
    slotGapMinutes: Number(slotGapMinutes),
    patternDays: patternLines.map((line) => ({
      weekIndex: line.weekIndex,
      dayOfWeek: line.dayOfWeek,
      startTime: line.startTime,
      endTime: line.endTime,
    })),
    exceptions: [
      ...excludes.map((line) => ({
        exceptionType: 'exclude' as const,
        specificDate: line.specificDate,
        startTime: line.startTime,
        endTime: line.endTime,
      })),
      ...additions.map((line) => ({
        exceptionType: 'add' as const,
        specificDate: line.specificDate,
        startTime: line.startTime,
        endTime: line.endTime,
      })),
    ],
    confirmOverwrite,
  });

  const publish = async (confirmOverwrite = false) => {
    setPublishing(true);
    try {
      const res = await fetch('/api/admin/availability-schedules/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(confirmOverwrite)),
      });
      const body = (await res.json()) as {
        error?: string;
        conflicts?: Conflict[];
      };
      if (res.status === 409 && body.conflicts?.length) {
        setConflicts(body.conflicts);
        setConflictOpen(true);
        return;
      }
      if (!res.ok) throw new Error(body.error ?? 'Publish failed.');
      toast.success('Availability published.');
      setConflictOpen(false);
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not publish availability.');
    } finally {
      setPublishing(false);
    }
  };

  const allowedSubjects = AVAILABILITY_SUBJECT_KINDS.filter((kind) => canUseSubject(actingUser, kind));

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Publish availability</h3>
        <p className="text-xs text-muted-foreground">
          Choose a subject, set a weekly pattern over a date range, then publish. Exclusions remove hours on
          specific days; additions open one-off windows.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-4" style={{ borderColor: 'var(--border)' }}>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</span>
          <select
            value={subjectKind}
            onChange={(e) => setSubjectKind(e.target.value as AvailabilitySubjectKind)}
            className="h-9 w-full rounded-md border bg-background px-2"
            style={{ borderColor: 'var(--border)' }}
          >
            {allowedSubjects.map((kind) => (
              <option key={kind} value={kind}>
                {SUBJECT_LABELS[kind]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {SUBJECT_LABELS[subjectKind]}
          </span>
          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-2"
            style={{ borderColor: 'var(--border)' }}
          >
            {entityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pattern</span>
          <select
            value={String(patternWeeks)}
            onChange={(e) => setPatternWeeks(Number(e.target.value) as 1 | 2)}
            className="h-9 w-full rounded-md border bg-background px-2"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="1">1 week</option>
            <option value="2">2 week</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Slot</span>
            <Input value={slotDurationMinutes} onChange={(e) => setSlotDurationMinutes(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gap</span>
            <Input value={slotGapMinutes} onChange={(e) => setSlotGapMinutes(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">From</span>
            <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">To</span>
            <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-1 pb-0.5">
            {[
              ['remainder', 'Rest of month'],
              ['1w', '1 week'],
              ['1m', '1 month'],
              ['3m', '3 months'],
              ['1y', '1 year'],
            ].map(([preset, label]) => (
              <Button
                key={preset}
                size="xs"
                variant="outline"
                onClick={() => {
                  const range = datePresetRange(preset);
                  setValidFrom(range.from);
                  setValidTo(range.to);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {patternWeeks === 1 ? '1 week pattern' : '2 week pattern'}
        </p>
        <div
          className={
            patternWeeks === 2
              ? 'grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-x-8'
              : 'max-w-[560px]'
          }
        >
          {patternWeekIndexes(patternWeeks).map((weekIndex) => (
            <div key={weekIndex} className="w-full max-w-[560px] space-y-2">
              {patternWeeks === 2 ? (
                <p className="text-xs font-medium text-muted-foreground">Week {weekIndex + 1}</p>
              ) : null}
              {linesForWeek(patternLines, weekIndex).map((line) => (
                <PatternDayRow
                  key={line.key}
                  line={line}
                  onStartChange={(startTime) =>
                    setPatternLines((prev) =>
                      prev.map((row) => (row.key === line.key ? { ...row, startTime } : row)),
                    )
                  }
                  onEndChange={(endTime) =>
                    setPatternLines((prev) =>
                      prev.map((row) => (row.key === line.key ? { ...row, endTime } : row)),
                    )
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ExceptionSection
          title="Exclude"
          emptyLabel="No excluded days"
          rows={excludes}
          onAdd={() =>
            setExcludes((prev) => [
              ...prev,
              { key: makeKey(), exceptionType: 'exclude', specificDate: validFrom, startTime: '15:00', endTime: '20:00' },
            ])
          }
          onChange={setExcludes}
        />
        <ExceptionSection
          title="Add"
          emptyLabel="No extra days"
          rows={additions}
          onAdd={() =>
            setAdditions((prev) => [
              ...prev,
              { key: makeKey(), exceptionType: 'add', specificDate: validFrom, startTime: '13:00', endTime: '17:00' },
            ])
          }
          onChange={setAdditions}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => void publish(false)} loading={publishing}>
          Publish
        </Button>
      </div>

      <Dialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Overwrite published dates?</DialogTitle>
            <DialogDescription>
              Existing published schedules overlap this date range for the same subject. Continuing will replace
              them.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="space-y-2 text-sm">
            {conflicts.map((conflict) => (
              <div key={conflict.scheduleId} className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                {conflict.subjectLabel}: {conflict.validFrom} → {conflict.validTo}
              </div>
            ))}
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button loading={publishing} onClick={() => void publish(true)}>
              Continue
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}

function PatternDayRow({
  line,
  onStartChange,
  onEndChange,
}: {
  line: PatternLine;
  onStartChange: (startTime: string) => void;
  onEndChange: (endTime: string) => void;
}) {
  const selectClass =
    'h-9 min-w-[5.75rem] flex-1 rounded-md border bg-background px-3 text-sm tabular-nums';

  return (
    <div
      className="grid grid-cols-[3.25rem_1fr_auto_1fr] items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2.5 text-sm sm:grid-cols-[3.5rem_minmax(5.75rem,1fr)_auto_minmax(5.75rem,1fr)]"
      style={{ borderColor: 'var(--border)' }}
    >
      <span className="font-medium text-muted-foreground">{WEEKDAY_SHORT[line.dayOfWeek]}</span>
      <select
        value={line.startTime}
        onChange={(e) => onStartChange(e.target.value)}
        className={selectClass}
        style={{ borderColor: 'var(--border)' }}
        aria-label={`${WEEKDAY_SHORT[line.dayOfWeek]} start time`}
      >
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <span className="px-0.5 text-xs text-muted-foreground">to</span>
      <select
        value={line.endTime}
        onChange={(e) => onEndChange(e.target.value)}
        className={selectClass}
        style={{ borderColor: 'var(--border)' }}
        aria-label={`${WEEKDAY_SHORT[line.dayOfWeek]} end time`}
      >
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}

function ExceptionSection({
  title,
  emptyLabel,
  rows,
  onAdd,
  onChange,
}: {
  title: string;
  emptyLabel: string;
  rows: ExceptionLine[];
  onAdd: () => void;
  onChange: React.Dispatch<React.SetStateAction<ExceptionLine[]>>;
}) {
  return (
    <div className="space-y-2 rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <Button size="xs" variant="outline" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        rows.map((row) => (
          <div key={row.key} className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={row.specificDate}
              onChange={(e) =>
                onChange((prev) =>
                  prev.map((item) => (item.key === row.key ? { ...item, specificDate: e.target.value } : item)),
                )
              }
            />
            <Input
              type="time"
              value={row.startTime}
              onChange={(e) =>
                onChange((prev) =>
                  prev.map((item) => (item.key === row.key ? { ...item, startTime: e.target.value } : item)),
                )
              }
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="time"
              value={row.endTime}
              onChange={(e) =>
                onChange((prev) =>
                  prev.map((item) => (item.key === row.key ? { ...item, endTime: e.target.value } : item)),
                )
              }
            />
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => onChange((prev) => prev.filter((item) => item.key !== row.key))}
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
