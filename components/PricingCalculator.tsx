"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { priceItems, PRICE_GROUPS, PROMO_RATE, formatKRW } from "@/lib/pricing";

export default function PricingCalculator() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const chosen = priceItems.filter((p) => selected[p.id]);
  const total = useMemo(() => chosen.reduce((s, p) => s + p.from, 0), [chosen]);
  const promo = Math.round((total * (1 - PROMO_RATE)) / 10000) * 10000;

  // 선택한 서비스 id를 문의 폼으로 전달 → 폼에서 동일하게 선택된 상태로 이어짐
  const contactHref =
    chosen.length > 0
      ? `/contact?items=${chosen.map((c) => c.id).join(",")}`
      : "/contact";

  return (
    <div className="pricing">
      <div className="pricing__list">
        {PRICE_GROUPS.map((group) => {
          const items = priceItems.filter((p) => p.group === group);
          if (items.length === 0) return null;
          return (
            <div className="pricing__group" key={group}>
              <h3 className="pricing__group-title">{group}</h3>
              <div className="pricing__items">
                {items.map((p) => {
                  const on = !!selected[p.id];
                  return (
                    <button
                      type="button"
                      key={p.id}
                      className={`price-item${on ? " is-on" : ""}`}
                      onClick={() => toggle(p.id)}
                      aria-pressed={on}
                    >
                      <span className="price-item__check" aria-hidden>{on ? "✓" : ""}</span>
                      <span className="price-item__body">
                        <span className="price-item__name">{p.name}</span>
                        {p.note && <span className="price-item__note">{p.note}</span>}
                      </span>
                      <span className="price-item__price">
                        <b>{formatKRW(p.from)}원~</b>
                        <span>{p.unit}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 요약 패널 */}
      <aside className="pricing__summary">
        <div className="pricing__summary-inner">
          <p className="eyebrow" style={{ margin: 0 }}>내 견적</p>
          {chosen.length === 0 ? (
            <p className="pricing__empty">필요한 서비스를 선택하면 예상 시작가가 계산됩니다.</p>
          ) : (
            <>
              <ul className="pricing__chosen">
                {chosen.map((c) => (
                  <li key={c.id}>
                    <span>{c.name}</span>
                    <span>{formatKRW(c.from)}원~</span>
                  </li>
                ))}
              </ul>
              <div className="pricing__total">
                <span>예상 시작가</span>
                <b>{formatKRW(total)}원~</b>
              </div>
              {chosen.length >= 2 && (
                <div className="pricing__promo">
                  <span>런칭 프로모션 <b>−20%</b></span>
                  <b>{formatKRW(promo)}원~</b>
                </div>
              )}
            </>
          )}
          <Link href={contactHref} className="btn btn--primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
            {chosen.length > 0 ? "이 조합으로 견적 상담" : "견적 상담 신청"}
          </Link>
          <p className="pricing__disclaimer">
            * 표기 금액은 <b>시작가(예시)</b>이며, 실제 견적은 요구사항·범위에 따라 상담으로 확정됩니다.
          </p>
        </div>
      </aside>
    </div>
  );
}
