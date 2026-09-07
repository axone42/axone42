import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailgun";
import { estimateText, selectedItems, serviceIntents } from "@/lib/pricing";
import { validateContact } from "@/lib/contact-validation";
import { inquiryProject } from "@/lib/project-inquiry";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { saveInquiry, InquiryConflict } from "@/lib/inquiries";
import { notifyInquiry } from "@/lib/slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  service?: string;
  estimate?: string;
  message?: string;
  agree?: boolean;
  items?: string[];
  topic?: string;
  project?: string;
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

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  const read = (value: unknown, max = 5000) => typeof value === "string" ? value.trim().slice(0, max) : "";

  // 허니팟: 채워져 있으면 봇 — 성공한 척하고 조용히 폐기
  if (read(data.company_website) !== "") {
    return NextResponse.json({ ok: true, ticketId: "AX-OK", message: "문의가 접수되었습니다." });
  }

  const name = read(data.name, 101);
  const email = read(data.email, 255);
  const phone = read(data.phone, 30);
  const message = read(data.message, 5001);
  const company = read(data.company, 200);
  const ids = Array.isArray(data.items) ? data.items.filter((id): id is string => typeof id === "string") : [];
  const chosen = selectedItems(ids);
  const project = inquiryProject(data.project);
  const topic = Object.values(serviceIntents).find((s) => s.title === data.topic && chosen.some((p) => p.id === s.item))?.title;
  const service = [topic, ...chosen.map((p) => p.name)].filter(Boolean).join(" · ") || "무료 상담 · 서비스 미정";
  // 견적은 클라이언트가 보내온 합계 대신 서버의 기준 금액으로 계산합니다.
  const estimate = estimateText(ids);

  const fieldErrors = validateContact({ name, email, message, agree: data.agree === true });
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ ok: false, error: "입력 내용을 확인해 주세요.", fieldErrors }, { status: 422 });
  }

  const requestKey = request.headers.get("idempotency-key") || randomUUID();
  if (!/^[0-9a-f-]{36}$/i.test(requestKey)) return NextResponse.json({ ok: false, error: "잘못된 요청 번호입니다." }, { status: 400 });
  let saved;
  try {
    saved = await saveInquiry({ source: "website", externalId: requestKey, name, email, phone, company,
      service, project: project?.title || "", estimate, message, consent: true });
  } catch (error) {
    if (error instanceof InquiryConflict) return NextResponse.json({ ok: false, error: "요청 내용이 변경되었습니다. 새로고침 후 다시 신청해 주세요." }, { status: 409 });
    console.error("[contact] database save failed");
    return NextResponse.json({ ok: false, error: "상담을 접수하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도하거나 이메일로 문의해 주세요." }, { status: 503 });
  }
  const ticketId = saved.inquiry.ticket_id;

  const text = [
    `[AXONE 신규 문의] ${ticketId}`,
    ``,
    `이름: ${name}`,
    `이메일: ${email}`,
    `연락처: ${phone || "-"}`,
    `회사/소속: ${company || "-"}`,
    `관심 서비스: ${service}`,
    `관심 프로젝트: ${project?.title || "-"}`,
    `예상 견적: ${estimate || "-"}`,
    ``,
    `문의 내용:`,
    message,
    ``,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.6">
      <h2 style="margin:0 0 12px">AXONE 신규 문의 <small style="color:#888">${ticketId}</small></h2>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#888">이름</td><td>${esc(name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#888">이메일</td><td>${esc(email)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#888">연락처</td><td>${esc(phone) || "-"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#888">회사/소속</td><td>${esc(company) || "-"}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#888">관심 서비스</td><td>${esc(service)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#888">관심 프로젝트</td><td>${esc(project?.title || "-")}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#888">예상 견적</td><td>${esc(estimate) || "-"}</td></tr>
      </table>
      <p style="margin:16px 0 4px;color:#888">문의 내용</p>
      <div style="white-space:pre-wrap;border-left:3px solid #6b62f2;padding-left:12px">${esc(message)}</div>
    </div>`;

  // Durable acceptance precedes all notifications. Failed Slack sends remain in the DB retry queue.
  after(async () => {
    try { await notifyInquiry(saved.inquiry.id); } catch { console.error("[contact] Slack delivery deferred"); }
    if (saved.created) {
      try { await sendMail({ subject: `[AXONE 문의] ${service} — ${name}`, text, html, replyTo: email }); }
      catch { console.error("[contact] optional email notification failed"); }
    }
  });

  return NextResponse.json({
    ok: true,
    ticketId,
    message: "문의가 정상 접수되었습니다. 영업일 기준 1~2일 내 연락드리겠습니다.",
  });
}
