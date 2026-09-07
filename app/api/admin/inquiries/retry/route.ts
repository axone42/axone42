import { NextRequest, NextResponse } from 'next/server';
import { adminAccess } from '@/lib/admin-auth';
import { retrySlack } from '@/lib/slack';
export const runtime = 'nodejs';
export const maxDuration = 120;
export async function POST(request: NextRequest) {
  const denied = adminAccess(request, true); if (denied) return denied;
  try { return NextResponse.json({ ok: true, ...await retrySlack() }); }
  catch { return NextResponse.json({ ok: false, error: '알림 재전송에 실패했습니다. 상담 내용은 안전하게 저장되어 있습니다.' }, { status: 503 }); }
}
