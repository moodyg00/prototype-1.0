import { z } from 'zod';

export const WORK_ORDER_STATUSES = [
  'new',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'rework',
  'archived',
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const workOrderLineItemSchema = z.object({
  id: z.string().uuid().optional(),
  serviceId: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1, 'Description is required.'),
  quantity: z.string().trim().min(1, 'Quantity is required.'),
  notes: z.string().trim().optional().nullable(),
});

const workOrderBaseSchema = z.object({
  contactId: z.string().uuid().optional().nullable(),
  contactName: z.string().trim().optional().nullable(),
  organizationId: z.string().uuid().optional().nullable(),
  customerName: z.string().trim().optional().nullable(),
  status: z.enum(WORK_ORDER_STATUSES).default('scheduled'),
  scheduledDate: z.string().trim().optional().nullable(),
  specialInstructions: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  estimateId: z.string().uuid().optional().nullable(),
  lineItems: z.array(workOrderLineItemSchema).min(1, 'Add at least one service line.'),
});

function requireWorkOrderContact(
  data: {
    contactId?: string | null;
    contactName?: string | null;
    customerName?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (!data.contactId && !data.contactName?.trim() && !data.customerName?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Select or enter a contact.',
      path: ['contactName'],
    });
  }
}

export const workOrderCreateSchema = workOrderBaseSchema.superRefine(requireWorkOrderContact);

export const workOrderUpdateSchema = workOrderBaseSchema
  .partial()
  .extend({
    lineItems: z.array(workOrderLineItemSchema).min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.contactId !== undefined ||
      data.contactName !== undefined ||
      data.customerName !== undefined
    ) {
      requireWorkOrderContact(data, ctx);
    }
  });

export type WorkOrderLineItemInput = z.infer<typeof workOrderLineItemSchema>;
export type WorkOrderCreateInput = z.infer<typeof workOrderCreateSchema>;
export type WorkOrderUpdateInput = z.infer<typeof workOrderUpdateSchema>;
