import { NextResponse } from "next/server";
import { sendMail, mailgunConfigured } from "@/lib/mailgun";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  service?: string;
  message?: string;
  agree?: boolean;
  // 허니팟 (사람은 비워둠, 봇은 채움)
  company_website?: string;
};

// 아주 단순한 인메모리 레이트리밋 (서버리스 인스턴스 단위)
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RATE_LIMIT;
}

function esc(s: string) {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  let data: ContactPayload;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  // 허니팟: 채워져 있으면 봇 — 성공한 척하고 조용히 폐기
  if (data.company_website && data.company_website.trim() !== "") {
    return NextResponse.json({ ok: true, ticketId: "AX-OK", message: "문의가 접수되었습니다." });
  }

  const name = (data.name ?? "").trim();
  const email = (data.email ?? "").trim();
  const message = (data.message ?? "").trim();
  const company = (data.company ?? "").trim();
  const service = (data.service ?? "").trim() || "미지정";

  const errors: string[] = [];
  if (name.length < 2) errors.push("이름을 입력해 주세요.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("올바른 이메일을 입력해 주세요.");
  if (message.length < 5) errors.push("문의 내용을 조금 더 자세히 적어 주세요.");
  if (data.agree !== true) errors.push("개인정보 수집·이용에 동의해 주세요.");

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, error: errors.join(" ") }, { status: 422 });
  }

  const ticketId = `AX-${Date.now().toString(36).toUpperCase()}`;

  const text = [
    `[AXONE 신규 문의] ${ticketId}`,
    ``,
    `이름: ${name}`,
    `이메일: ${email}`,
    `회사/소속: ${company || "-"}`,
    `관심 서비스: ${service}`,
    ``,
    `문의 내용:`,
    message,
    ``,
    `IP: ${ip}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.6">
      <h2 style="margin:0 0 12px">AXONE 신규 문의 <small style="color:#888">${ticketId}</small></h2>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#888">이름</td><td>${esc(name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#888">이메일</td><td>${esc(email)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#888">회사/소속</td><td>${esc(company) || "-"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#888">관심 서비스</td><td>${esc(service)}</td></tr>
      </table>
      <p style="margin:16px 0 4px;color:#888">문의 내용</p>
      <div style="white-space:pre-wrap;border-left:3px solid #6b62f2;padding-left:12px">${esc(message)}</div>
      <p style="margin-top:16px;color:#aaa;font-size:12px">IP ${esc(ip)}</p>
    </div>`;

  const result = await sendMail({
    subject: `[AXONE 문의] ${service} — ${name}`,
    text,
    html,
    replyTo: email,
  });

  if (result.ok === false && "error" in result) {
    // 메일 발송은 실패했지만 사용자에겐 접수 실패로 안내
    return NextResponse.json(
      { ok: false, error: "접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }

  const delivered = result.ok === true;
  console.log(
    `[contact] ${ticketId} 접수 · 메일발송=${delivered ? "성공" : mailgunConfigured() ? "실패" : "건너뜀(미설정)"}`
  );

  return NextResponse.json({
    ok: true,
    ticketId,
    message: "문의가 정상 접수되었습니다. 영업일 기준 1~2일 내 연락드리겠습니다.",
  });
}
