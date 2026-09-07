import { randomUUID } from 'node:crypto';
import { inquirySql, type Inquiry } from '@/lib/inquiries';

export function slackConfigured() {
  return /^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9]+\/[A-Za-z0-9]+\/[A-Za-z0-9]+$/.test(process.env.SLACK_WEBHOOK_URL || '');
}
export function slackPayload(inquiry: Inquiry) {
  const title = `${inquiry.source === 'gmail' ? 'Gmail 문의' : '홈페이지 상담'} 접수 · ${inquiry.ticket_id}`;
  // User text is plain_text: pasted Slack mentions and links cannot notify a channel.
  const details = [inquiry.subject && `제목: ${inquiry.subject}`, `이름: ${inquiry.name}`,
    `이메일: ${inquiry.email}`, `연락처: ${inquiry.phone || '-'}`, `회사: ${inquiry.company || '-'}`,
    `서비스: ${inquiry.service || '-'}`, `프로젝트: ${inquiry.project || '-'}`, `예상 비용: ${inquiry.estimate || '-'}`].filter(Boolean).join('\n');
  return { text: title, unfurl_links: false, unfurl_media: false, blocks: [
    { type: 'header', text: { type: 'plain_text', text: title } },
    { type: 'section', text: { type: 'plain_text', text: details.slice(0, 2900) } },
    { type: 'section', text: { type: 'plain_text', text: inquiry.message.slice(0, 2400) + (inquiry.message.length > 2400 ? '\n… 전체 내용은 관리자 화면에서 확인해 주세요.' : '') } },
    { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: '관리자에서 확인' },
      url: `https://axone.ai.kr/admin/inquiries?ticket=${inquiry.ticket_id}` }] },
  ] };
}
export async function notifyInquiry(id: string) {
  if (!slackConfigured()) return false; // Keep pending until the destination is connected.
  const sql = inquirySql();
  const claim = randomUUID();
  const rows = await sql`UPDATE inquiries SET slack_status = 'sending', slack_claim = ${claim}::uuid,
    slack_attempts = slack_attempts + 1, slack_next_attempt_at = now() + interval '2 minutes'
    WHERE id = ${id}::uuid AND slack_status <> 'sent' AND slack_next_attempt_at <= now() RETURNING *`;
  if (!rows.length) return false;
  let error = '';
  try {
    const response = await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload(rows[0] as Inquiry)), signal: AbortSignal.timeout(8000),
    });
    const body = await response.text();
    if (!response.ok || body.trim() !== 'ok') error = `Slack HTTP ${response.status}`;
  } catch { error = 'Slack 연결 실패 또는 응답 시간 초과'; }
  await inquirySql()`UPDATE inquiries SET slack_status = ${error ? 'failed' : 'sent'}, slack_error = ${error || null},
    slack_sent_at = CASE WHEN ${!error} THEN now() ELSE NULL END,
    slack_next_attempt_at = now() + interval '5 minutes', slack_claim = NULL
    WHERE id = ${id}::uuid AND slack_claim = ${claim}::uuid`;
  return !error;
}
export async function retrySlack() {
  if (!slackConfigured()) return { sent: 0, configured: false };
  const sql = inquirySql();
  const rows = await sql`SELECT id FROM inquiries WHERE slack_status <> 'sent' AND slack_next_attempt_at <= now()
    ORDER BY created_at ASC LIMIT 10`;
  let sent = 0;
  for (const row of rows) if (await notifyInquiry(row.id)) sent++;
  return { sent, configured: true };
}
