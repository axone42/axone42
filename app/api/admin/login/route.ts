import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const token = process.env.ADMIN_TOKEN;

  if (!expected || !token) {
    return NextResponse.json(
      { ok: false, error: "관리자 인증이 아직 설정되지 않았습니다. (환경변수 ADMIN_PASSWORD/ADMIN_TOKEN)" },
      { status: 500 }
    );
  }

  let password = "";
  try {
    const body = await req.json();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (password !== expected) {
    return NextResponse.json({ ok: false, error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("axone_admin", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7일
  });
  return res;
}
