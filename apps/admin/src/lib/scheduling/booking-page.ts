/**
 * Shared renderer for the public booking page content.
 *
 * The SAME content HTML is used in two places so they never drift:
 *   1. The public `/book/[token]` page embeds `renderBookingContentHtml()`
 *      above the interactive submit form.
 *   2. The "Email" action on a booking link emails `renderBookingPageEmailHtml()`
 *      — i.e. the rendered page content IS the email body (per product decision),
 *      with a button linking to the live page to actually submit.
 */
import type { BookingLinkKind, CollectField, ProposedSlot } from '@/src/lib/validation/scheduling';

export interface BookingPageData {
  name: string;
  linkKind: BookingLinkKind;
  serviceName: string | null;
  contactName: string | null;
  durationMinutes: number | null;
  channel: string | null;
  fieldsToCollect: CollectField[];
  proposedSlots: ProposedSlot[];
  expiresAt: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSlot(slot: ProposedSlot): string {
  const start = new Date(slot.startsAt);
  const end = new Date(slot.endsAt);
  const date = start.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${startTime} – ${endTime}`;
}

const KIND_INTRO: Record<BookingLinkKind, string> = {
  standard: 'Pick a time that works for you and share a few details.',
  personalized: 'This booking page was prepared for you. Confirm your preferred time below.',
  confirmation: 'Please confirm one of the proposed times below.',
};

/** Inner content HTML shared by the public page and the email body. */
export function renderBookingContentHtml(data: BookingPageData): string {
  const meta: string[] = [];
  if (data.serviceName) meta.push(escapeHtml(data.serviceName));
  if (data.durationMinutes) meta.push(`${data.durationMinutes} min`);
  if (data.channel) meta.push(escapeHtml(data.channel));

  const slotsHtml =
    data.proposedSlots.length > 0
      ? `<div style="margin-top:16px">
           <p style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin:0 0 8px">
             ${data.linkKind === 'confirmation' ? 'Proposed times' : 'Available times'}
           </p>
           <ul style="list-style:none;padding:0;margin:0">
             ${data.proposedSlots
               .map(
                 (slot) =>
                   `<li style="padding:10px 14px;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:8px;font-weight:600">${escapeHtml(
                     formatSlot(slot),
                   )}</li>`,
               )
               .join('')}
           </ul>
         </div>`
      : '';

  const fieldsHtml =
    data.fieldsToCollect.length > 0
      ? `<div style="margin-top:16px">
           <p style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin:0 0 8px">We'll ask for</p>
           <p style="margin:0;color:#374151">${data.fieldsToCollect
             .map((f) => escapeHtml(f.label) + (f.required ? '' : ' (optional)'))
             .join(' · ')}</p>
         </div>`
      : '';

  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
      <h1 style="font-size:22px;margin:0 0 4px">${escapeHtml(data.name)}</h1>
      ${meta.length > 0 ? `<p style="margin:0 0 12px;color:#6b7280">${meta.join(' · ')}</p>` : ''}
      ${data.contactName ? `<p style="margin:0 0 12px;color:#374151">Prepared for ${escapeHtml(data.contactName)}</p>` : ''}
      <p style="margin:0;color:#374151">${KIND_INTRO[data.linkKind]}</p>
      ${slotsHtml}
      ${fieldsHtml}
    </div>
  `.trim();
}

/** Full standalone HTML document for the email body (content + CTA button). */
export function renderBookingPageEmailHtml(data: BookingPageData, publicUrl: string): string {
  const cta = data.linkKind === 'confirmation' ? 'Confirm your time' : 'Book now';
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f9fafb">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:28px">
      ${renderBookingContentHtml(data)}
      <div style="margin-top:24px">
        <a href="${escapeHtml(publicUrl)}"
           style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          ${cta}
        </a>
      </div>
      <p style="margin-top:16px;font-size:12px;color:#9ca3af">
        Or open this link: <a href="${escapeHtml(publicUrl)}" style="color:#6b7280">${escapeHtml(publicUrl)}</a>
      </p>
    </div>
  </body>
</html>`;
}

/** Plain-text fallback for the email. */
export function renderBookingPageEmailText(data: BookingPageData, publicUrl: string): string {
  const lines = [data.name];
  if (data.serviceName) lines.push(data.serviceName);
  lines.push('', KIND_INTRO[data.linkKind]);
  if (data.proposedSlots.length > 0) {
    lines.push('', data.linkKind === 'confirmation' ? 'Proposed times:' : 'Available times:');
    for (const slot of data.proposedSlots) lines.push(`- ${formatSlot(slot)}`);
  }
  lines.push('', `Open: ${publicUrl}`);
  return lines.join('\n');
}
