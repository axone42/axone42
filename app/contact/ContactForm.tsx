"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { priceItems, PRICE_GROUPS, PROMO_RATE, formatKRW } from "@/lib/pricing";

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; message: string; ticketId: string }
  | { state: "error"; message: string };

// 숫자만 입력하면 한국 전화번호 형식으로 하이픈 자동 삽입
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
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // /contact?items=id1,id2 로 진입 시 가격 페이지에서 고른 조합을 그대로 선택
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const items = params.get("items");
    if (items) {
      const ids = items.split(",").map((s) => s.trim());
      const next: Record<string, boolean> = {};
      priceItems.forEach((p) => { if (ids.includes(p.id)) next[p.id] = true; });
      setSelected(next);
    } else {
      // 이전 방식 호환: ?service=제목
      const q = params.get("service");
      if (q) {
        const match = priceItems.find((p) => p.name.includes(q) || q.includes(p.name.split(" ")[0]));
        if (match) setSelected({ [match.id]: true });
      }
    }
  }, []);

  const toggle = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const chosen = priceItems.filter((p) => selected[p.id]);
  const total = useMemo(() => chosen.reduce((s, p) => s + p.from, 0), [chosen]);
  const promo = Math.round((total * (1 - PROMO_RATE)) / 10000) * 10000;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ state: "loading" });

    const form = e.currentTarget;
    const fd = new FormData(form);

    const serviceNames = chosen.map((c) => c.name).join(", ");
    const estimate =
      chosen.length > 0
        ? `예상 시작가 ${formatKRW(total)}원~` +
          (chosen.length >= 2 ? ` (프로모션 -20% 적용 시 ${formatKRW(promo)}원~)` : "")
        : "";

    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      company: String(fd.get("company") ?? ""),
      service: serviceNames || "미지정",
      estimate,
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
        setSelected({});
      } else {
        setStatus({ state: "error", message: json.error ?? "접수 중 오류가 발생했습니다." });
      }
    } catch {
      setStatus({ state: "error", message: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* ① 필요한 서비스 선택 (가격 연동) */}
      <div className="field field--full" style={{ marginBottom: 20 }}>
        <label style={{ marginBottom: 4 }}>필요한 서비스 <span style={{ color: "var(--color-slate)", fontWeight: 400 }}>(복수 선택 가능 · 예상 시작가 자동 계산)</span></label>
        <div className="contact-picker">
          {PRICE_GROUPS.map((group) => {
            const items = priceItems.filter((p) => p.group === group);
            if (items.length === 0) return null;
            return (
              <div className="contact-picker__group" key={group}>
                <span className="contact-picker__gtitle">{group}</span>
                {items.map((p) => {
                  const on = !!selected[p.id];
                  return (
                    <button
                      type="button"
                      key={p.id}
                      className={`price-item price-item--sm${on ? " is-on" : ""}`}
                      onClick={() => toggle(p.id)}
                      aria-pressed={on}
                    >
                      <span className="price-item__check" aria-hidden>{on ? "✓" : ""}</span>
                      <span className="price-item__body">
                        <span className="price-item__name">{p.name}</span>
                        {p.note && <span className="price-item__note">{p.note}</span>}
                      </span>
                      <span className="price-item__price"><b>{formatKRW(p.from)}원~</b><span>{p.unit}</span></span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        {chosen.length > 0 && (
          <div className="contact-estimate">
            <span>선택 {chosen.length}개 · 예상 시작가</span>
            <b>{formatKRW(total)}원~</b>
            {chosen.length >= 2 && <span className="contact-estimate__promo">프로모션 {formatKRW(promo)}원~</span>}
          </div>
        )}
      </div>

      {/* ② 연락 정보 */}
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
            id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel"
            placeholder="숫자만 입력하면 자동으로 - 가 붙어요"
            value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="company">회사 / 소속</label>
          <input id="company" name="company" type="text" placeholder="(선택)" />
        </div>
        <div className="field field--full">
          <label htmlFor="message">문의 내용 *</label>
          <textarea
            id="message" name="message" value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="현재 업무 상황이나 자동화하고 싶은 일, 궁금한 점을 자유롭게 적어 주세요."
            required
          />
        </div>
      </div>

      {/* 허니팟 */}
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
          <span className="form-status form-status--ok">✓ {status.message} (접수번호 {status.ticketId})</span>
        )}
        {status.state === "error" && (
          <span className="form-status form-status--err">⚠ {status.message}</span>
        )}
      </div>
      <p className="form-note">* 표시는 필수 입력 항목입니다. 접수 내용은 상담 목적으로만 사용됩니다.</p>
    </form>
  );
}
