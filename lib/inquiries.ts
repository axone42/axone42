import { neon } from '@neondatabase/serverless';
import { createHash, randomUUID } from 'node:crypto';

export type InquiryStatus = 'new' | 'in_progress' | 'closed';
export type InquiryInput = {
  source: 'website' | 'gmail'; externalId: string; name: string; email: string;
  phone?: string; company?: string; service?: string; project?: string;
  estimate?: string; message: string; subject?: string; receivedAt?: string; consent?: boolean;
};
export type Inquiry = {
  id: string; ticket_id: string; source: 'website' | 'gmail'; name: string; email: string;
  phone: string; company: string; service: string; project: string; estimate: string;
  message: string; subject: string; received_at: string; created_at: string; updated_at: string;
  status: InquiryStatus; note: string; version: number; slack_status: 'pending' | 'sending' | 'sent' | 'failed';
  slack_sent_at: string | null; slack_error: string | null; slack_attempts: number;
};
export class InquiryConflict extends Error {}
export function databaseConfigured() { return Boolean(process.env.DATABASE_URL); }
export function inquirySql() {
  if (!process.env.DATABASE_URL) throw new Error('Inquiry database is not configured');
  return neon(process.env.DATABASE_URL, { fetchOptions: { signal: AbortSignal.timeout(10000) } });
}
export async function saveInquiry(input: InquiryInput): Promise<{ inquiry: Inquiry; created: boolean }> {
  const sql = inquirySql();
  const id = randomUUID();
  const ticket = `AX-${id.replace(/-/g, '').slice(0, 16).toUpperCase()}`;
  const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const rows = await sql`
    INSERT INTO inquiries (id, ticket_id, source, external_id, payload_hash, name, email, phone, company,
      service, project, estimate, message, subject, received_at, consent_at)
    VALUES (${id}, ${ticket}, ${input.source}, ${input.externalId}, ${hash}, ${input.name}, ${input.email},
      ${input.phone || ''}, ${input.company || ''}, ${input.service || ''}, ${input.project || ''},
      ${input.estimate || ''}, ${input.message}, ${input.subject || ''},
      COALESCE(${input.receivedAt || null}::timestamptz, now()), CASE WHEN ${input.consent === true} THEN now() ELSE NULL END)
    ON CONFLICT (source, external_id) DO NOTHING RETURNING *`;
  if (rows.length) return { inquiry: rows[0] as Inquiry, created: true };
  const existing = await sql`SELECT * FROM inquiries WHERE source = ${input.source} AND external_id = ${input.externalId}`;
  if (!existing.length) throw new Error('Inquiry could not be read after save');
  if (input.source === 'website' && existing[0].payload_hash !== hash) throw new InquiryConflict('Request key already used');
  return { inquiry: existing[0] as Inquiry, created: false };
}
export async function listInquiries(page: number, status: string, source: string, ticket = '') {
  const sql = inquirySql();
  const [rows, count, pending] = await sql.transaction([
    sql`SELECT id, ticket_id, source, name, email, phone, company, service, project, estimate, message, subject,
      received_at, created_at, updated_at, status, note, version, slack_status, slack_sent_at, slack_error, slack_attempts
      FROM inquiries WHERE (${status} = '' OR status = ${status}) AND (${source} = '' OR source = ${source})
      AND (${ticket} = '' OR ticket_id = ${ticket})
      ORDER BY created_at DESC, id DESC LIMIT 25 OFFSET ${(page - 1) * 25}`,
    sql`SELECT count(*)::int AS total FROM inquiries WHERE (${status} = '' OR status = ${status}) AND (${source} = '' OR source = ${source}) AND (${ticket} = '' OR ticket_id = ${ticket})`,
    sql`SELECT count(*)::int AS total FROM inquiries WHERE slack_status <> 'sent'`,
  ]);
  return { inquiries: rows as Inquiry[], total: count[0].total as number, pending: pending[0].total as number, page };
}
export async function updateInquiry(id: string, status: InquiryStatus, note: string, version: number) {
  const sql = inquirySql();
  const rows = await sql`UPDATE inquiries SET status = ${status}, note = ${note}, updated_at = now(), version = version + 1
    WHERE id = ${id}::uuid AND version = ${version} RETURNING id`;
  return rows.length > 0;
}
