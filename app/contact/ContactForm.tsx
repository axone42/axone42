"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { services } from "@/lib/services";

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; message: string; ticketId: string }
  | { state: "error"; message: string };

// 숫자만 입력하면 한국 전화번호 형식으로 하이픈 자동 삽입
// 02(서울): 2-3-4 / 2-4-4, 그 외(010·031·070 등): 3-3-4 / 3-4-4
function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    if (d.length < 3) return d;
    if (d.length < 6) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length < 10) return `${d.slice(0, 2)}-${d.slice(2, d.length - 4)}-${d.slice(d.length - 4)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length < 11) return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(d.length - 4)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [service, setService] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // /contact?service=... / ?estimate=... 로 진입 시 자동 채움
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("service");
    if (q && services.some((s) => s.title === q)) setService(q);
    const est = params.get("estimate");
    if (est) setMessage(est);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ state: "loading" });

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      company: String(fd.get("company") ?? ""),
      service: String(fd.get("service") ?? ""),
      message: String(fd.get("message") ?? ""),
      agree: fd.get("agree") === "on",
      company_website: String(fd.get("company_website") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus({ state: "ok", message: json.message, ticketId: json.ticketId });
        form.reset();
        setMessage("");
        setPhone("");
        setService("");
      } else {
        setStatus({ state: "error", message: json.error ?? "접수 중 오류가 발생했습니다." });
      }
    } catch {
      setStatus({ state: "error", message: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">이름 *</label>
          <input id="name" name="name" type="text" placeholder="홍길동" required />
        </div>
        <div className="field">
          <label htmlFor="email">이메일 *</label>
          <input id="email" name="email" type="email" placeholder="you@company.com" required />
        </div>
        <div className="field">
          <label htmlFor="phone">연락처</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="숫자만 입력하면 자동으로 - 가 붙어요"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="company">회사 / 소속</label>
          <input id="company" name="company" type="text" placeholder="(선택)" />
        </div>
        <div className="field field--full">
          <label htmlFor="service">관심 서비스</label>
          <select
            id="service"
            name="service"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="" disabled>선택해 주세요</option>
            {services.map((s) => (
              <option key={s.id} value={s.title}>{s.title}</option>
            ))}
            <option value="기타">기타 / 잘 모르겠어요</option>
          </select>
        </div>
        <div className="field field--full">
          <label htmlFor="message">문의 내용 *</label>
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="현재 업무 상황이나 자동화하고 싶은 일, 궁금한 점을 자유롭게 적어 주세요."
            required
          />
        </div>
      </div>

      {/* 허니팟 (봇 차단용, 사용자에겐 보이지 않음) */}
      <div aria-hidden style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="company_website">Company Website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="consent">
        <input type="checkbox" name="agree" required />
        <span>
          <Link href="/privacy" target="_blank" className="consent__link">개인정보 수집·이용</Link>에 동의합니다. (이름·연락처·이메일·문의내용, 상담 목적, 3년 보관) *
        </span>
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        <button type="submit" className="btn btn--primary" disabled={status.state === "loading"}>
          {status.state === "loading" ? "접수 중…" : "문의 보내기"}
        </button>
        {status.state === "ok" && (
          <span className="form-status form-status--ok">
            ✓ {status.message} (접수번호 {status.ticketId})
          </span>
        )}
        {status.state === "error" && (
          <span className="form-status form-status--err">⚠ {status.message}</span>
        )}
      </div>
      <p className="form-note">* 표시는 필수 입력 항목입니다. 접수 내용은 상담 목적으로만 사용됩니다.</p>
    </form>
  );
}
