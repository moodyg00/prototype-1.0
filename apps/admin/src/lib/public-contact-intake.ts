import { createAttachmentFromUpload } from '@/src/lib/attachments/attachment-service';
import { prisma } from '@/src/lib/prisma';
import { isImageMimeType, MAX_IMAGE_SIZE_BYTES } from '@/src/lib/validation/attachment';
import { z } from 'zod';

export const publicContactFormSchema = z
  .object({
    name: z.string().trim().max(255).optional(),
    email: z
      .string()
      .trim()
      .max(255)
      .optional()
      .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Invalid email address.'),
    phone: z.string().trim().max(40).optional(),
    title: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(5000).optional(),
    service: z.string().trim().max(120).optional(),
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const name = data.name?.trim() ?? '';
    const email = data.email?.trim() ?? '';
    const phone = data.phone?.trim() ?? '';
    if (!name && !email && !phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one of name, email, or phone is required.',
        path: ['name'],
      });
    }
  });

export type PublicContactFormInput = z.infer<typeof publicContactFormSchema>;

const MAX_PHOTOS = 10;

function normalizeEmail(email?: string): string | null {
  const value = email?.trim().toLowerCase() ?? '';
  return value || null;
}

function normalizePhone(phone?: string): string | null {
  const value = phone?.trim() ?? '';
  return value || null;
}

async function findExistingContactId(email: string | null, phone: string | null): Promise<string | null> {
  if (!email && !phone) return null;

  const contact = await prisma.contact.findFirst({
    where: {
      OR: [
        ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return contact?.id ?? null;
}

async function touchContact(contactId: string): Promise<void> {
  const existing = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { tags: true },
  });
  const tags = Array.isArray(existing?.tags)
    ? (existing.tags as string[])
    : typeof existing?.tags === 'object' && existing?.tags !== null
      ? []
      : [];
  const nextTags = tags.includes('website-lead') ? tags : [...tags, 'website-lead'];

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      lastContactedAt: new Date(),
      tags: nextTags,
    },
  });
}

function collectPhotoFiles(formData: FormData): File[] {
  const files: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File) || value.size === 0) continue;
    if (key === 'photos' || key === 'photos[]' || key.startsWith('photos')) {
      files.push(value);
    }
  }
  return files.slice(0, MAX_PHOTOS);
}

function assertPhotosAllowed(files: File[]): void {
  if (files.length > MAX_PHOTOS) {
    throw new Error(`You can upload up to ${MAX_PHOTOS} photos.`);
  }
  for (const file of files) {
    const mimeType = file.type || 'application/octet-stream';
    if (!isImageMimeType(mimeType)) {
      throw new Error(`Unsupported image type: ${mimeType || 'unknown'}.`);
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Each image must be 10 MB or smaller.');
    }
  }
}

export async function createPublicContactIntake(formData: FormData) {
  const parsed = publicContactFormSchema.parse({
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    title: String(formData.get('title') ?? ''),
    notes: String(formData.get('notes') ?? ''),
    service: String(formData.get('service') ?? ''),
    website: String(formData.get('website') ?? ''),
  });

  if (parsed.website?.trim()) {
    throw new Error('Submission rejected.');
  }

  const email = normalizeEmail(parsed.email);
  const phone = normalizePhone(parsed.phone);
  const name = parsed.name?.trim() || null;
  const photos = collectPhotoFiles(formData);
  assertPhotosAllowed(photos);

  const now = new Date();
  const notesPayload = {
    summary: parsed.notes?.trim() || null,
    service: parsed.service?.trim() || null,
    origin: 'website-contact-form',
    submittedAt: now.toISOString(),
  };

  let contactId = await findExistingContactId(email, phone);
  let contactCreated = false;

  if (!contactId) {
    const contact = await prisma.contact.create({
      data: {
        name: name ?? email ?? phone ?? 'Website Contact',
        title: parsed.title?.trim() || null,
        email,
        phone,
        type: 'customer',
        status: 'active',
        source: 'website_contact_form',
        notes: notesPayload,
        tags: ['website-lead'],
        lastContactedAt: now,
      },
    });
    contactId = contact.id;
    contactCreated = true;
  } else {
    await touchContact(contactId);
    if (parsed.notes?.trim()) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { notes: notesPayload },
      });
    }
  }

  const lead = await prisma.lead.create({
    data: {
      contactId,
      name: name ?? email ?? phone ?? 'Website Lead',
      email,
      phone,
      title: parsed.service?.trim() || parsed.title?.trim() || null,
      source: 'website_organic',
      status: 'new',
      notes: notesPayload,
      lastContactedAt: now,
    },
  });

  const attachmentIds: string[] = [];
  for (const file of photos) {
    const attachment = await createAttachmentFromUpload({
      file,
      input: {
        kind: 'photo',
        scope: 'lead',
        leadId: lead.id,
        description: parsed.service?.trim() || 'Website contact form upload',
      },
    });
    attachmentIds.push(attachment.id);
  }

  return {
    contactId,
    contactCreated,
    leadId: lead.id,
    attachmentIds,
  };
}