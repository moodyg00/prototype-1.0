import { z } from 'zod';

const uuid = z.string().uuid({ message: 'Must be a valid UUID.' });

export const USER_TYPES = ['human', 'ai_agent', 'automation'] as const;
export type UserType = (typeof USER_TYPES)[number];

export const AUTOMATION_USER_TYPES = ['ai_agent', 'automation'] as const;

export const userInviteSchema = z.object({
  email: z.string().trim().email('Must be a valid email address.'),
  roleId: uuid,
  sendEmail: z.boolean().optional().default(true),
});

export const automationUserCreateSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required.').max(255),
  userType: z.enum(AUTOMATION_USER_TYPES),
  roleId: uuid.optional(),
  description: z.string().trim().max(2000).optional(),
  aiModel: z.string().trim().max(120).optional(),
});

export const inviteAcceptSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters.')
      .max(100)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Username may only contain letters, numbers, dots, underscores, and hyphens.'),
    password: z.string().min(8, 'Password must be at least 8 characters.').max(256),
    confirmPassword: z.string().min(8).max(256),
    fullName: z.string().trim().max(255).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type UserInviteInput = z.infer<typeof userInviteSchema>;
export type AutomationUserCreateInput = z.infer<typeof automationUserCreateSchema>;
export type InviteAcceptInput = z.infer<typeof inviteAcceptSchema>;
