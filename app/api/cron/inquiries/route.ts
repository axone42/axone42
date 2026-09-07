import { NextResponse } from 'next/server';
import { secretMatches } from '@/lib/admin-auth';
import { retrySlack } from '@/lib/slack';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export async function GET(request: Request) {
  if (!secretMatches(request.headers.get('authorization'), process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : undefined)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try { return NextResponse.json({ ok: true, ...await retrySlack() }); }
  catch { return NextResponse.json({ ok: false }, { status: 503 }); }
}
