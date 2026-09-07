import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export function secretMatches(actual: string | undefined | null, expected: string | undefined) {
  if (!actual || !expected) return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function adminAccess(request: NextRequest, mutate = false) {
  if (!secretMatches(request.cookies.get('axone_admin')?.value, process.env.ADMIN_TOKEN)) {
    return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }
  if (mutate && request.headers.get('origin') !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: '허용되지 않은 요청입니다.' }, { status: 403 });
  }
  return null;
}
