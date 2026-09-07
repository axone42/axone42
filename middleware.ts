import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// /admin 전체를 보호 — 로그인 쿠키(axone_admin)가 ADMIN_TOKEN과 일치해야 접근 허용
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 로그인 페이지는 통과
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = req.cookies.get("axone_admin")?.value;
  if (token && process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("from", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
