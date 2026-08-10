"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  services,
  AUTOMATION_CATEGORIES,
  type Service,
  type AutomationExample,
  type AutomationCategory,
} from "@/lib/services";

export default function ServiceExplorer() {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = services.find((s) => s.id === openId) ?? null;

  const open = useCallback((id: string) => {
    setOpenId(id);
    if (typeof window !== "undefined") history.replaceState(null, "", `#${id}`);
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // 딥링크(#service-id) 및 해시 변경 시 모달 자동 오픈
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.replace("#", "");
      if (id && services.some((s) => s.id === id)) setOpenId(id);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return (
    <>
      <div className="cards cards--2">
        {services.map((svc, i) => (
          <button
            key={svc.id}
            type="button"
            className="card card--btn"
            onClick={() => open(svc.id)}
            aria-haspopup="dialog"
          >
            {svc.tags && (
              <div className="card__tags">
                {svc.tags.slice(0, 4).map((t) => (
                  <span key={t} className="minitag">{t}</span>
                ))}
              </div>
            )}
            <span className="card__icon" aria-hidden>{svc.icon}</span>
            <h3 className="card__title">{svc.title}</h3>
            <p className="card__body">{svc.summary}</p>
            {svc.automations && (
              <p className="card__meta">자동화 구축 사례 {svc.automations.length}가지 →</p>
            )}
            <span className="card__link">상세 보기</span>
            <span className="card__index" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </div>

      {active && <ServiceModal service={active} onClose={close} />}
    </>
  );
}

function ServiceModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const [filter, setFilter] = useState<AutomationCategory | "전체">("전체");
  const [caseItem, setCaseItem] = useState<AutomationExample | null>(null);

  // ESC 닫기 + 배경 스크롤 잠금 (케이스 상세가 열려 있으면 상세만 닫음)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (caseItem) setCaseItem(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, caseItem]);

  const usedCategories = useMemo(() => {
    if (!service.automations) return [];
    const set = new Set(service.automations.map((a) => a.category));
    return AUTOMATION_CATEGORIES.filter((c) => set.has(c));
  }, [service.automations]);

  const filtered = useMemo(() => {
    if (!service.automations) return [];
    return filter === "전체"
      ? service.automations
      : service.automations.filter((a) => a.category === filter);
  }, [service.automations, filter]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="modal__scroll">

        <p className="modal__eyebrow">Service · {service.icon}</p>
        <h2 className="modal__title" id="modal-title">{service.title}</h2>

        {/* 태그 (최상단) */}
        {service.tags && (
          <div className="tags tags--top">
            {service.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
        )}

        <p className="modal__desc">{service.description}</p>

        {/* 후킹 배너 */}
        {service.hook && <div className="hook-banner">{service.hook}</div>}

        {/* 이런 고민 있으신가요? */}
        {service.painPoints && (
          <div className="modal__section">
            <h4>혹시, 이런 고민 있으신가요?</h4>
            <ul className="painlist">
              {service.painPoints.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        )}

        {/* 왜 지금 AX인가 */}
        {service.whyNow && (
          <div className="modal__section">
            <h4>왜 지금 AX가 필요할까요?</h4>
            <div className="whynow">
              {service.whyNow.map((w) => (
                <div key={w.step} className="whynow__item">
                  <div className="whynow__t">{w.step}</div>
                  <div className="whynow__d">{w.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 자동화 구축 사례: 필터 + 클릭 상세 */}
        {service.automations && (
          <div className="modal__section">
            <h4>구축 사례 {service.automations.length}가지 · 필터로 골라 보세요</h4>
            <div className="filterbar">
              <button
                type="button"
                className={`filter-chip${filter === "전체" ? " is-active" : ""}`}
                onClick={() => setFilter("전체")}
              >
                전체 {service.automations.length}
              </button>
              {usedCategories.map((c) => {
                const count = service.automations!.filter((a) => a.category === c).length;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`filter-chip${filter === c ? " is-active" : ""}`}
                    onClick={() => setFilter(c)}
                  >
                    {c} {count}
                  </button>
                );
              })}
            </div>

            <div className="autolist">
              {filtered.map((a) => (
                <button
                  key={a.title}
                  type="button"
                  className="auto auto--btn"
                  onClick={() => setCaseItem(a)}
                  aria-haspopup="dialog"
                >
                  <span className="auto__no">＋</span>
                  <div>
                    <div className="auto__head">
                      <p className="auto__title">{a.title}</p>
                    </div>
                    <p className="auto__flow">{a.flow}</p>
                    <span className="auto__cat">{a.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 컨설팅 제공 범위 */}
        {service.bullets && (
          <div className="modal__section">
            <h4>제공 범위</h4>
            <ul className="curric">{service.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
        )}

        {/* 강의 커리큘럼 */}
        {service.curriculum && (
          <div className="modal__section">
            <h4>커리큘럼</h4>
            <ul className="curric">{service.curriculum.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        )}

        {/* 진행 방식 — 파이프라인 도표 */}
        {service.process && (
          <div className="modal__section">
            <h4>진행 방식</h4>
            <div className="pipeline">
              {service.process.map((p, idx) => (
                <div key={p.step} className="pipe-node">
                  <div className="pipe-node__k">STEP {idx + 1}</div>
                  <div className="pipe-node__t">{p.step}</div>
                  <div className="pipe-node__d">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 기대 효과 */}
        {service.outcomes && (
          <div className="modal__section">
            <h4>기대 효과</h4>
            <ul className="curric">{service.outcomes.map((o) => <li key={o}>{o}</li>)}</ul>
          </div>
        )}

        {/* CTA */}
        <div className="modal__cta">
          <p className="modal__cta-text">
            <strong style={{ color: "var(--color-ink)", fontWeight: 600 }}>{service.title}</strong>에 관심이 있으신가요?
            상황을 알려주시면 맞춤 제안을 드립니다.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href={`/contact?service=${encodeURIComponent(service.title)}`}
              className="btn btn--primary"
              onClick={onClose}
            >
              상담 신청
            </Link>
            <button type="button" className="btn btn--ghost" onClick={onClose}>닫기</button>
          </div>
        </div>

        </div>{/* /.modal__scroll */}
      </div>

      {/* 케이스 상세 (중첩 모달) */}
      {caseItem && (
        <CaseDetail
          item={caseItem}
          serviceTitle={service.title}
          onClose={() => setCaseItem(null)}
        />
      )}
    </div>
  );
}

function CaseDetail({
  item,
  serviceTitle,
  onClose,
}: {
  item: AutomationExample;
  serviceTitle: string;
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modal-overlay modal-overlay--top"
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-title"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="modal modal--case" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="modal__scroll">

        <p className="modal__eyebrow">{item.category} · 자동화 사례</p>
        <h3 className="modal__title" id="case-title">{item.title}</h3>

        {/* 사용 도구 태그 (최상단) */}
        <div className="tags tags--top">
          {item.tools.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>

        {/* 흐름 도표 */}
        <div className="modal__section">
          <h4>자동화 흐름</h4>
          <div className="flow-diagram">
            {item.flow.split(/\s*→\s*/).map((node, idx, arr) => (
              <span key={node + idx} className="flow-step">
                <span className="flow-node">{node}</span>
                {idx < arr.length - 1 && <span className="flow-arrow" aria-hidden>→</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="modal__section">
          <h4>이런 문제를 해결해요</h4>
          <p className="case-problem">{item.problem}</p>
        </div>

        <div className="modal__section">
          <h4>이렇게 동작해요</h4>
          <ol className="flowsteps">
            {item.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </div>

        <div className="modal__section">
          <h4>도입 효과</h4>
          <div className="case-result">✓ {item.result}</div>
        </div>

        <div className="modal__cta">
          <p className="modal__cta-text">이 자동화를 우리 회사에 적용하고 싶으신가요?</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href={`/contact?service=${encodeURIComponent(serviceTitle)}`}
              className="btn btn--primary"
            >
              상담 신청
            </Link>
            <button type="button" className="btn btn--ghost" onClick={onClose}>목록으로</button>
          </div>
        </div>

        </div>{/* /.modal__scroll */}
      </div>
    </div>,
    document.body
  );
}
