"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { caseStudies, type CaseStudy } from "@/lib/showcase";

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" aria-label={`5점 만점에 ${rating}점`}>
      {"★★★★★".split("").map((s, i) => (
        <span key={i} className={i < full ? "stars__on" : "stars__off"}>
          ★
        </span>
      ))}
      <span className="stars__num">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function CaseStudies() {
  const [active, setActive] = useState<CaseStudy | null>(null);

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active, close]);

  return (
    <>
      <div className="cards cards--2">
        {caseStudies.map((cs) => (
          <button
            key={cs.id}
            type="button"
            className="card card--btn"
            onClick={() => setActive(cs)}
            aria-haspopup="dialog"
          >
            <div className="case">
              <div className="case__ind">{cs.industry}</div>
              <h3 className="case__title">{cs.title}</h3>
              <p className="case__summary">{cs.summary}</p>
              <div className="case__metrics">
                {cs.metrics.map((m) => (
                  <div key={m.label} className="case__metric">
                    <strong>{m.value}</strong>
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="case__foot">
                <span className="case__client">{cs.client}</span>
                <span className="card__link">구현 상세</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {active && <CaseModal cs={active} onClose={close} />}
    </>
  );
}

function CaseModal({ cs, onClose }: { cs: CaseStudy; onClose: () => void }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modal-overlay modal-overlay--top"
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-study-title"
      onClick={onClose}
    >
      <div className="modal modal--case" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="modal__scroll">
          <p className="modal__eyebrow">{cs.industry} · 도입 성과</p>
          <h3 className="modal__title" id="case-study-title">{cs.title}</h3>
          <p className="case__client" style={{ marginTop: 0 }}>{cs.client}</p>

          {/* 성과 지표 */}
          <div className="case__metrics" style={{ borderTop: "none", paddingTop: 8, marginTop: 12 }}>
            {cs.metrics.map((m) => (
              <div key={m.label} className="case__metric">
                <strong>{m.value}</strong>
                <span>{m.label}</span>
              </div>
            ))}
          </div>

          <div className="modal__section">
            <h4>어떤 문제였나요?</h4>
            <p className="case-problem">{cs.summary}</p>
          </div>

          <div className="modal__section">
            <h4>이렇게 구현했어요</h4>
            <ol className="flowsteps">
              {cs.approach.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </div>

          <div className="modal__section">
            <h4>사용 기술·도구</h4>
            <div className="tags">
              {cs.tags.map((t) => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>

          {/* 도입 기업 평가 */}
          <div className="modal__section">
            <h4>도입 기업 평가</h4>
            <div className="eval">
              <Stars rating={cs.evaluation.rating} />
              <p className="eval__quote">&ldquo;{cs.evaluation.quote}&rdquo;</p>
              <p className="eval__who">
                <b>{cs.evaluation.name}</b> · {cs.evaluation.role}, {cs.client}
              </p>
            </div>
          </div>

          <div className="modal__cta">
            <p className="modal__cta-text">비슷한 성과를 원하시나요? 업무 상황을 알려주세요.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="/contact" className="btn btn--primary">상담 신청</a>
              <button type="button" className="btn btn--ghost" onClick={onClose}>닫기</button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
