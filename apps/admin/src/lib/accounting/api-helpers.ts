import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  EstimateServiceError,
  estimateServiceErrorStatus,
} from '@/src/lib/billing/estimate-service';
import {
  InvoiceServiceError,
  invoiceServiceErrorStatus,
} from '@/src/lib/billing/invoice-service';
import { JournalEntryServiceError, serviceErrorStatus } from '@/src/lib/accounting/journal-entries';
import {
  IgnoreTransactionError,
  ignoreTransactionErrorStatus,
} from '@/src/lib/banking/ignore-transaction';
import { AcceptEstimateError, acceptEstimateErrorStatus } from '@/src/lib/operations/accept-estimate';
import {
  AttachmentServiceError,
  attachmentServiceErrorStatus,
} from '@/src/lib/attachments/attachment-service';
import { AttachmentValidationError } from '@/src/lib/validation/attachment';
import { AvailabilityScheduleError } from '@/src/lib/scheduling/availability-schedules';
import { UserRoleServiceError } from '@/src/lib/user-roles/user-roles';
import { SettingsServiceError } from '@/src/lib/settings/errors';

export function jsonError(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    return jsonError(422, 'Validation failed.', error.flatten());
  }
  if (error instanceof JournalEntryServiceError) {
    return jsonError(serviceErrorStatus(error.code), error.message, { code: error.code });
  }
  if (error instanceof EstimateServiceError) {
    return jsonError(estimateServiceErrorStatus(error.code), error.message, { code: error.code });
  }
  if (error instanceof InvoiceServiceError) {
    return jsonError(invoiceServiceErrorStatus(error.code), error.message, { code: error.code });
  }
  if (error instanceof AcceptEstimateError) {
    return jsonError(acceptEstimateErrorStatus(error.code), error.message, { code: error.code });
  }
  if (error instanceof IgnoreTransactionError) {
    return jsonError(ignoreTransactionErrorStatus(error.code), error.message, { code: error.code });
  }
  if (error instanceof AttachmentServiceError) {
    return jsonError(attachmentServiceErrorStatus(error.code), error.message, { code: error.code });
  }
  if (error instanceof AttachmentValidationError) {
    return jsonError(422, error.message);
  }
  if (error instanceof UserRoleServiceError) {
    return jsonError(error.status, error.message);
  }
  if (error instanceof SettingsServiceError) {
    return jsonError(error.status, error.message);
  }
  if (error instanceof AvailabilityScheduleError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        conflicts: error.conflicts,
      },
      { status: error.status },
    );
  }
  if (error instanceof SyntaxError) {
    return jsonError(400, 'Invalid JSON body.');
  }
  const message = error instanceof Error ? error.message : 'Unexpected error.';
  return jsonError(500, message);
}

export async function readJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new SyntaxError('Invalid JSON body.');
  }
}
