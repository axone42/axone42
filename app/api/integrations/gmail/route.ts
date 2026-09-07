import { after, NextResponse } from 'next/server';
import { secretMatches } from '@/lib/admin-auth';
import { saveInquiry } from '@/lib/inquiries';
import { notifyInquiry } from '@/lib/slack';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!secretMatches(request.headers.get('authorization'), process.env.GMAIL_INGEST_SECRET ? `Bearer ${process.env.GMAIL_INGEST_SECRET}` : undefined)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!body || typeof body.messageId !== 'string' || !/^[a-zA-Z0-9_-]{1,200}$/.test(body.messageId) ||
    typeof body.mailbox !== 'string' || body.mailbox.toLowerCase() !== process.env.GMAIL_MAILBOX?.toLowerCase() ||
    typeof body.from !== 'string' || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(body.from) || body.from.length > 254 ||
    typeof body.subject !== 'string' || body.subject.length > 500 ||
    typeof body.message !== 'string' || body.message.length > 20000 ||
    typeof body.receivedAt !== 'string' || !Number.isFinite(Date.parse(body.receivedAt))) {
    return NextResponse.json({ ok: false, error: 'Invalid Gmail message' }, { status: 422 });
  }
  try {
    const { inquiry } = await saveInquiry({ source: 'gmail', externalId: `${body.mailbox.toLowerCase()}:${body.messageId}`,
      name: typeof body.name === 'string' ? body.name.slice(0, 100) || body.from : body.from,
      email: body.from, message: body.message || '(본문 없음)', subject: body.subject,
      receivedAt: new Date(body.receivedAt).toISOString() });
    after(async () => { try { await notifyInquiry(inquiry.id); } catch { console.error('[gmail] Slack delivery deferred'); } });
    return NextResponse.json({ ok: true, ticketId: inquiry.ticket_id });
  } catch { return NextResponse.json({ ok: false, error: 'Storage unavailable; retry this message' }, { status: 503 }); }
}
