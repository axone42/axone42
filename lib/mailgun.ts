// Mailgun REST API 발송 (SDK 없이 fetch 사용)
// 필요한 환경변수: MAILGUN_API_KEY, MAILGUN_DOMAIN, MAIL_FROM, MAIL_TO
// 선택: MAILGUN_API_BASE (기본 https://api.mailgun.net — EU 계정은 https://api.eu.mailgun.net)

export type MailInput = {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type MailResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true }
  | { ok: false; error: string };

export function mailgunConfigured(): boolean {
  return Boolean(
    process.env.MAILGUN_API_KEY &&
      process.env.MAILGUN_DOMAIN &&
      process.env.MAIL_FROM &&
      process.env.MAIL_TO
  );
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAIL_FROM;
  const to = process.env.MAIL_TO;
  const base = process.env.MAILGUN_API_BASE || "https://api.mailgun.net";

  // 미설정도 실패 결과입니다. 호출자는 접수 성공으로 표시하면 안 됩니다.
  if (!apiKey || !domain || !from || !to) {
    console.warn("[mailgun] 환경변수 미설정 — 발송을 건너뜁니다.");
    return { ok: false, skipped: true };
  }

  const body = new URLSearchParams();
  body.set("from", from);
  body.set("to", to);
  body.set("subject", input.subject);
  body.set("text", input.text);
  if (input.html) body.set("html", input.html);
  if (input.replyTo) body.set("h:Reply-To", input.replyTo);

  const auth = Buffer.from(`api:${apiKey}`).toString("base64");

  try {
    const res = await fetch(`${base}/v3/${domain}/messages`, {
      signal: AbortSignal.timeout(15000),
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[mailgun] 발송 실패", res.status, detail);
      return { ok: false, error: `메일 발송 실패 (${res.status})` };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id ?? "sent" };
  } catch (e) {
    console.error("[mailgun] 요청 오류", e);
    return { ok: false, error: "메일 서버 요청 중 오류가 발생했습니다." };
  }
}
