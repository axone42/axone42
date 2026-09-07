import { NextRequest, NextResponse } from 'next/server';
import { adminAccess } from '@/lib/admin-auth';
import { listInquiries, updateInquiry } from '@/lib/inquiries';
import { slackConfigured } from '@/lib/slack';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const denied = adminAccess(request); if (denied) return denied;
  const p = request.nextUrl.searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(p.get('page') || '1', 10) || 1));
  const status = p.get('status') || '', source = p.get('source') || '';
  const ticket = p.get('ticket') || '';
  if (ticket && !/^AX-[A-F0-9]{16}$/.test(ticket)) return NextResponse.json({ ok: false, error: '접수번호를 확인해 주세요.' }, { status: 400 });
  if (!['', 'new', 'in_progress', 'closed'].includes(status) || !['', 'website', 'gmail'].includes(source)) {
    return NextResponse.json({ ok: false, error: '필터를 확인해 주세요.' }, { status: 400 });
  }
  try {
    const data = await listInquiries(page, status, source, ticket);
    return NextResponse.json({ ok: true, ...data, integrations: { database: true, slack: slackConfigured(), gmail: Boolean(process.env.GMAIL_INGEST_SECRET) } },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ ok: false, error: '상담 목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.' }, { status: 503 });
  }
}
export async function PATCH(request: NextRequest) {
  const denied = adminAccess(request, true); if (denied) return denied;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!body || typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id) ||
    !['new', 'in_progress', 'closed'].includes(body.status) || typeof body.note !== 'string' || body.note.length > 5000 ||
    !Number.isInteger(body.version) || body.version < 1) return NextResponse.json({ ok: false, error: '수정 내용을 확인해 주세요.' }, { status: 422 });
  try {
    const updated = await updateInquiry(body.id, body.status, body.note, body.version);
    return NextResponse.json({ ok: updated, ...(!updated && { error: '다른 화면에서 변경되었습니다. 새로고침 후 다시 수정해 주세요.' }) }, { status: updated ? 200 : 409 });
  } catch { return NextResponse.json({ ok: false, error: '변경 내용을 저장하지 못했습니다.' }, { status: 503 }); }
}
