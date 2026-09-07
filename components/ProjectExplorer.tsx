"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { projects, PROJECT_CATEGORIES, type Project } from "@/lib/projects";

export default function ProjectExplorer() {
  const [active, setActive] = useState<Project | null>(null);
  const [category, setCategory] = useState("전체");
  const [availability, setAvailability] = useState("전체");
  const ordered = [...projects].sort((a,b) => {
    const order = ["자동화", "AI 앱", "생산성·콘텐츠", "웹·커머스", "주식·금융"];
    return order.indexOf(a.category) - order.indexOf(b.category);
  });
  const visible = ordered.filter((p) => (category === "전체" || p.category === category) && (availability === "전체" || (availability === "데모 체험" ? !!p.demoUrl : !p.demoUrl)));

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
      <section className="section--tight"><div className="container">
        <div className="project-filters" aria-label="프로젝트 필터">
          <div className="filterbar" aria-label="분야">{["전체", ...PROJECT_CATEGORIES].map((cat) => <button type="button" key={cat} className={`filter-chip${category === cat ? " is-active" : ""}`} aria-pressed={category === cat} onClick={() => setCategory(cat)}>{cat}</button>)}</div>
          <div className="filterbar" aria-label="체험 가능 여부">{["전체", "데모 체험", "소개·예정"].map((value) => <button type="button" key={value} className={`filter-chip${availability === value ? " is-active" : ""}`} aria-pressed={availability === value} onClick={() => setAvailability(value)}>{value}</button>)}</div>
        </div>
        <p role="status">{visible.length}개 프로젝트 · 데모별 체험 범위를 확인해 주세요.</p>
        <div className="cards projects-grid">{visible.map((p) => <ProjectCard key={p.id} p={p} onOpen={() => setActive(p)} />)}</div>
        {!visible.length && <p className="empty-state">이 조건의 프로젝트가 없습니다. 다른 분야를 선택해 주세요.</p>}
      </div></section>

      {active && <ProjectModal p={active} onClose={close} />}
    </>
  );
}

function ProjectCard({
  p,
  withHighlights,
  onOpen,
}: {
  p: Project;
  withHighlights?: boolean;
  onOpen: () => void;
}) {
  return (
    <article className="card proj-card" style={{ height: "100%" }}>
      <div className="proj-card__top">
        <span className="proj-status">{p.demoUrl ? "체험 가능한 데모" : p.status === "공개" ? "소개 공개 · 체험 준비" : "개발 예정"}</span>
      </div>
      <h3 className="card__title">{p.title}</h3>
      <p className="proj-en">{p.en}</p>
      <p className="card__body">{p.summary}</p>
      {withHighlights && (
        <ul className="proj-high">
          {p.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      <div className="project-card-actions">
        {p.demoUrl && <a href={p.demoUrl} className="btn btn--primary">데모 체험 →</a>}
        <button type="button" className="btn btn--ghost" onClick={onOpen} aria-haspopup="dialog" aria-label={`${p.title} 상세 보기`}>상세 보기</button>
      </div>
    </article>
  );
}

function ProjectModal({ p, onClose }: { p: Project; onClose: () => void }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modal-overlay modal-overlay--top"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-title"
      onClick={onClose}
    >
      <div className="modal modal--case" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="modal__scroll">
          <p className="modal__eyebrow">
            {p.category} · <span>{p.demoUrl ? "체험 가능한 데모" : p.status === "공개" ? "소개 공개 · 체험 준비" : "개발 예정"}</span>
            {p.demoUrl && <span className="proj-demo" style={{ marginLeft: 8 }}>▶ 데모 체험 가능</span>}
          </p>
          <h3 className="modal__title" id="project-title">{p.title}</h3>
          <p className="proj-en" style={{ marginTop: 0 }}>{p.en}</p>

          {/* 라이브 데모 CTA — 눈에 띄게 상단 배치 */}
          {p.demoUrl && (
            <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="proj-demo-cta">
              <span className="proj-demo-cta__icon" aria-hidden>▶</span>
              <span>
                <b>화면 데모 체험하기</b>
                <small>예시 데이터와 사용 흐름을 새 탭에서 확인합니다</small>
              </span>
              <span className="proj-demo-cta__arrow" aria-hidden>→</span>
            </a>
          )}

          <p className="modal__desc">{p.detail ?? p.summary}</p>

          {p.useCases && p.useCases.length > 0 && (
            <div className="modal__section">
              <h4>이런 분께 필요해요</h4>
              <ul className="proj-uses">
                {p.useCases.map((u) => <li key={u}>{u}</li>)}
              </ul>
            </div>
          )}

          <div className="modal__section">
            <h4>도입 시 논의할 기능</h4>
            <ul className="curric" style={{ gridTemplateColumns: "1fr" }}>
              {p.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>

          {p.flow && p.flow.length > 0 && (
            <div className="modal__section">
              <h4>도입 시 목표 업무 흐름</h4>
              <ol className="flowsteps">
                {p.flow.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
          )}

          <div className="modal__section">
            <h4>사용 기술</h4>
            <div className="tags">
              {p.stack.map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>

          <div className="modal__cta">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flex: "1 1 auto" }}>
              {p.demoUrl && (
                <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary">▶ 데모 체험</a>
              )}
              <a href="/contact" className="btn btn--ghost">도입 문의</a>
              {p.repoUrl && (
                <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="proj-link">GitHub ↗</a>
              )}
            </div>
            <button type="button" className="btn btn--ghost" onClick={onClose}>닫기</button>
          </div>

          <p className="sample-note" style={{ marginTop: 16 }}>
            * 공개 데모는 예시 데이터로 동작합니다. 실제 도입 시 귀사 환경·데이터에 맞춰 구축하며, 도입·협업은 문의해 주세요.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
