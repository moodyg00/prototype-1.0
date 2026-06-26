import { prisma } from '@/src/lib/prisma';
import { canEditAvailabilitySubject, type ActingUser } from '@/src/lib/user-roles/permissions';
import {
  availabilityConflictQuerySchema,
  availabilityScheduleExceptionsPatchSchema,
  availabilitySchedulePublishSchema,
  type AvailabilitySchedulePublishInput,
  type AvailabilitySubjectKind,
} from '@/src/lib/validation/scheduling';

export class AvailabilityScheduleError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code?: 'CONFLICT',
    readonly conflicts?: ConflictSummary[],
  ) {
    super(message);
    this.name = 'AvailabilityScheduleError';
  }
}

export type ConflictSummary = {
  scheduleId: string;
  subjectKind: AvailabilitySubjectKind;
  subjectLabel: string;
  validFrom: string;
  validTo: string;
};

export type ScheduleWithRelations = Awaited<ReturnType<typeof listPublishedSchedules>>[number];

function normalizeTime(value: string): string {
  return /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
}

function toTimeDate(value: string): Date {
  return new Date(`1970-01-01T${normalizeTime(value)}Z`);
}

function subjectWhere(input: {
  subjectKind: AvailabilitySubjectKind;
  userId?: string | null;
  serviceId?: string | null;
  businessId?: string | null;
}) {
  return {
    subjectKind: input.subjectKind,
    userId: input.userId ?? null,
    serviceId: input.serviceId ?? null,
    businessId: input.businessId ?? null,
    isPublished: true,
  };
}

function rangesOverlap(aFrom: Date, aTo: Date, bFrom: Date, bTo: Date): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

export async function findScheduleConflicts(input: unknown): Promise<ConflictSummary[]> {
  const parsed = availabilityConflictQuerySchema.parse(input);
  const validFrom = new Date(parsed.validFrom);
  const validTo = new Date(parsed.validTo);

  const rows = await prisma.availabilitySchedule.findMany({
    where: subjectWhere(parsed),
    include: {
      user: { select: { fullName: true } },
      service: { select: { name: true } },
      business: { select: { name: true } },
    },
  });

  return rows
    .filter((row) => rangesOverlap(validFrom, validTo, row.validFrom, row.validTo))
    .map((row) => ({
      scheduleId: row.id,
      subjectKind: row.subjectKind as AvailabilitySubjectKind,
      subjectLabel:
        row.user?.fullName ?? row.service?.name ?? row.business?.name ?? row.subjectKind,
      validFrom: row.validFrom.toISOString().slice(0, 10),
      validTo: row.validTo.toISOString().slice(0, 10),
    }));
}

export async function publishAvailabilitySchedule(
  actingUser: ActingUser,
  input: unknown,
): Promise<{ scheduleId: string; conflictsOverwritten: number }> {
  const parsed = availabilitySchedulePublishSchema.parse(input);

  const subjectUserId =
    parsed.subjectKind === 'owner' || parsed.subjectKind === 'contractor'
      ? (parsed.userId ?? null)
      : null;

  if (
    !canEditAvailabilitySubject({
      user: actingUser,
      subjectKind: parsed.subjectKind,
      subjectUserId,
    })
  ) {
    throw new AvailabilityScheduleError('You do not have permission to publish this availability.', 403);
  }

  const conflicts = await findScheduleConflicts(parsed);
  if (conflicts.length > 0 && !parsed.confirmOverwrite) {
    throw new AvailabilityScheduleError(
      'Published schedules already exist for this subject in the selected date range.',
      409,
      'CONFLICT',
      conflicts,
    );
  }

  const validFrom = new Date(parsed.validFrom);
  const validTo = new Date(parsed.validTo);

  const scheduleId = await prisma.$transaction(async (tx) => {
    if (conflicts.length > 0) {
      await tx.availabilitySchedule.deleteMany({
        where: { id: { in: conflicts.map((c) => c.scheduleId) } },
      });
    }

    const schedule = await tx.availabilitySchedule.create({
      data: {
        subjectKind: parsed.subjectKind,
        userId: parsed.userId ?? null,
        serviceId: parsed.serviceId ?? null,
        businessId: parsed.businessId ?? null,
        patternWeeks: parsed.patternWeeks,
        validFrom,
        validTo,
        slotDurationMinutes: parsed.slotDurationMinutes,
        slotGapMinutes: parsed.slotGapMinutes,
        timezone: parsed.timezone,
        notes: parsed.notes ?? null,
        createdBy: actingUser.id,
        patternDays: {
          create: parsed.patternDays.map((day) => ({
            weekIndex: day.weekIndex,
            dayOfWeek: day.dayOfWeek,
            startTime: toTimeDate(day.startTime),
            endTime: toTimeDate(day.endTime),
          })),
        },
        exceptions: {
          create: parsed.exceptions.map((ex) => ({
            exceptionType: ex.exceptionType,
            specificDate: new Date(ex.specificDate),
            startTime: toTimeDate(ex.startTime),
            endTime: toTimeDate(ex.endTime),
          })),
        },
      },
      select: { id: true },
    });

    return schedule.id;
  });

  return { scheduleId, conflictsOverwritten: conflicts.length };
}

export async function listPublishedSchedules(actingUser: ActingUser | null) {
  const rows = await prisma.availabilitySchedule.findMany({
    where: { isPublished: true },
    orderBy: [{ validFrom: 'desc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, fullName: true } },
      service: { select: { id: true, name: true } },
      business: { select: { id: true, name: true } },
      patternDays: true,
      exceptions: true,
    },
  });

  if (!actingUser) return rows;

  return rows.filter((row) =>
    canEditAvailabilitySubject({
      user: actingUser,
      subjectKind: row.subjectKind as AvailabilitySubjectKind,
      subjectUserId: row.userId,
    }),
  );
}

export async function listAvailabilitySubjects() {
  const [owners, contractors, services, businesses] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        userType: 'human',
        roleRef: { name: { in: ['Owner', 'Admin'] } },
      },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        userType: 'human',
        roleRef: { name: 'Contractor' },
      },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.business.findMany({
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true, isPrimary: true },
    }),
  ]);

  return { owners, contractors, services, businesses };
}

export type ExpandedScheduleInstance = {
  scheduleId: string;
  subjectKind: AvailabilitySubjectKind;
  userId: string | null;
  serviceId: string | null;
  businessId: string | null;
  subjectLabel: string;
  isAvailable: boolean;
  startsAt: string;
  endsAt: string;
  slotDurationMinutes: number;
  slotGapMinutes: number;
};

function toTimeParts(value: Date | string | null | undefined): { h: number; m: number } | null {
  if (value == null) return null;
  if (value instanceof Date) return { h: value.getUTCHours(), m: value.getUTCMinutes() };
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]) };
}

function combine(date: Date, time: { h: number; m: number }): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.h, time.m, 0, 0);
}

function dateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function timesOverlap(
  aStart: { h: number; m: number },
  aEnd: { h: number; m: number },
  bStart: { h: number; m: number },
  bEnd: { h: number; m: number },
): boolean {
  const a0 = aStart.h * 60 + aStart.m;
  const a1 = aEnd.h * 60 + aEnd.m;
  const b0 = bStart.h * 60 + bStart.m;
  const b1 = bEnd.h * 60 + bEnd.m;
  return a0 < b1 && b0 < a1;
}

export function expandAvailabilitySchedules(
  schedules: ScheduleWithRelations[],
  from: Date,
  to: Date,
): ExpandedScheduleInstance[] {
  const out: ExpandedScheduleInstance[] = [];
  const rangeStart = dateOnly(from);
  const rangeEnd = dateOnly(to);

  for (const schedule of schedules) {
    const subjectLabel =
      schedule.user?.fullName ?? schedule.service?.name ?? schedule.business?.name ?? schedule.subjectKind;

    const scheduleStart = dateOnly(schedule.validFrom);
    const scheduleEnd = dateOnly(schedule.validTo);
    const cursor = new Date(Math.max(rangeStart.getTime(), scheduleStart.getTime()));
    const end = new Date(Math.min(rangeEnd.getTime(), scheduleEnd.getTime()));

    while (cursor <= end) {
      const dayIso = isoDate(cursor);
      const daysSinceStart = Math.floor((cursor.getTime() - scheduleStart.getTime()) / 86_400_000);
      const weekIndex =
        schedule.patternWeeks === 2 ? Math.floor(daysSinceStart / 7) % 2 : 0;
      const dayOfWeek = cursor.getDay();

      const patternDay = schedule.patternDays.find(
        (d) => d.weekIndex === weekIndex && d.dayOfWeek === dayOfWeek,
      );

      const dayExceptions = schedule.exceptions.filter(
        (ex) => isoDate(ex.specificDate) === dayIso,
      );

      if (patternDay) {
        const start = toTimeParts(patternDay.startTime)!;
        const endTime = toTimeParts(patternDay.endTime)!;
        let blocked = false;

        for (const ex of dayExceptions) {
          if (ex.exceptionType !== 'exclude') continue;
          const exStart = toTimeParts(ex.startTime)!;
          const exEnd = toTimeParts(ex.endTime)!;
          if (timesOverlap(start, endTime, exStart, exEnd)) {
            blocked = true;
            break;
          }
        }

        if (!blocked) {
          out.push({
            scheduleId: schedule.id,
            subjectKind: schedule.subjectKind as AvailabilitySubjectKind,
            userId: schedule.userId,
            serviceId: schedule.serviceId,
            businessId: schedule.businessId,
            subjectLabel,
            isAvailable: true,
            startsAt: combine(cursor, start).toISOString(),
            endsAt: combine(cursor, endTime).toISOString(),
            slotDurationMinutes: schedule.slotDurationMinutes,
            slotGapMinutes: schedule.slotGapMinutes,
          });
        }
      }

      for (const ex of dayExceptions) {
        if (ex.exceptionType !== 'add') continue;
        const exStart = toTimeParts(ex.startTime)!;
        const exEnd = toTimeParts(ex.endTime)!;
        out.push({
          scheduleId: `${schedule.id}:add:${dayIso}:${ex.id}`,
          subjectKind: schedule.subjectKind as AvailabilitySubjectKind,
          userId: schedule.userId,
          serviceId: schedule.serviceId,
          businessId: schedule.businessId,
          subjectLabel,
          isAvailable: true,
          startsAt: combine(cursor, exStart).toISOString(),
          endsAt: combine(cursor, exEnd).toISOString(),
          slotDurationMinutes: schedule.slotDurationMinutes,
          slotGapMinutes: schedule.slotGapMinutes,
        });
      }

      for (const ex of dayExceptions) {
        if (ex.exceptionType !== 'exclude') continue;
        const exStart = toTimeParts(ex.startTime)!;
        const exEnd = toTimeParts(ex.endTime)!;
        out.push({
          scheduleId: `${schedule.id}:exclude:${dayIso}:${ex.id}`,
          subjectKind: schedule.subjectKind as AvailabilitySubjectKind,
          userId: schedule.userId,
          serviceId: schedule.serviceId,
          businessId: schedule.businessId,
          subjectLabel,
          isAvailable: false,
          startsAt: combine(cursor, exStart).toISOString(),
          endsAt: combine(cursor, exEnd).toISOString(),
          slotDurationMinutes: schedule.slotDurationMinutes,
          slotGapMinutes: schedule.slotGapMinutes,
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return out;
}

export async function patchAvailabilityScheduleExceptions(
  actingUser: ActingUser,
  scheduleId: string,
  input: unknown,
): Promise<{ scheduleId: string; added: number; removed: number }> {
  const parsed = availabilityScheduleExceptionsPatchSchema.parse(input);

  const schedule = await prisma.availabilitySchedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      subjectKind: true,
      userId: true,
      isPublished: true,
    },
  });

  if (!schedule || !schedule.isPublished) {
    throw new AvailabilityScheduleError('Published schedule not found.', 404);
  }

  if (
    !canEditAvailabilitySubject({
      user: actingUser,
      subjectKind: schedule.subjectKind as AvailabilitySubjectKind,
      subjectUserId: schedule.userId,
    })
  ) {
    throw new AvailabilityScheduleError('You do not have permission to edit this availability.', 403);
  }

  const added = parsed.addExceptions.length;
  const removed = parsed.removeExceptionIds.length;

  await prisma.$transaction(async (tx) => {
    if (parsed.removeExceptionIds.length > 0) {
      await tx.availabilityException.deleteMany({
        where: { scheduleId, id: { in: parsed.removeExceptionIds } },
      });
    }
    if (parsed.addExceptions.length > 0) {
      await tx.availabilityException.createMany({
        data: parsed.addExceptions.map((ex) => ({
          scheduleId,
          exceptionType: ex.exceptionType,
          specificDate: new Date(ex.specificDate),
          startTime: toTimeDate(ex.startTime),
          endTime: toTimeDate(ex.endTime),
        })),
      });
    }
  });

  return { scheduleId, added, removed };
}

export function remainderOfMonthRange(now = new Date()): { from: string; to: string } {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: isoDate(from),
    to: isoDate(to),
  };
}
