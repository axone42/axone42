"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { projects, PROJECT_CATEGORIES, type Project } from "@/lib/projects";

export default function ProjectExplorer() {
  const [active, setActive] = useState<Project | null>(null);
  const recommended = projects.filter((p) => p.recommended);

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
      {/* 우선 추천 / 공개 */}
      <section className="section--tight">
        <div className="container">
          <Reveal>
            <p className="eyebrow">먼저 살펴보세요</p>
            <h2 className="section-title" style={{ fontSize: "28px" }}>
              ★ 공개·추천 프로젝트 {recommended.length}선
            </h2>
          </Reveal>
          <div className="cards" style={{ marginTop: 28 }}>
            {recommended.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <ProjectCard p={p} onOpen={() => setActive(p)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 카테고리별 전체 로드맵 */}
      {PROJECT_CATEGORIES.map((cat) => {
        const list = projects.filter((p) => p.category === cat);
        if (list.length === 0) return null;
        return (
          <section className="section" id={cat} key={cat} style={{ scrollMarginTop: 96 }}>
            <div className="container">
              <Reveal>
                <p className="eyebrow">Roadmap</p>
                <h2 className="section-title">{cat}</h2>
              </Reveal>
              <div className="cards" style={{ marginTop: 28 }}>
                {list.map((p, i) => (
                  <Reveal key={p.id} delay={i * 50}>
                    <ProjectCard p={p} withHighlights onOpen={() => setActive(p)} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}

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
    <button type="button" className="card proj-card card--btn" style={{ height: "100%" }} onClick={onOpen} aria-haspopup="dialog">
      <div className="proj-card__top">
        <span className={`proj-status${p.status === "공개" ? " proj-status--live" : ""}`}>{p.status}</span>
        {p.recommended && <span className="proj-rec">★ 추천</span>}
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
      <div className="tags" style={{ marginTop: "auto", paddingTop: 16 }}>
        {p.stack.map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>
      <span className="card__link" style={{ marginTop: 14 }}>상세 보기</span>
    </button>
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
            {p.category} · <span className={p.status === "공개" ? "proj-live-text" : ""}>{p.status}</span>
          </p>
          <h3 className="modal__title" id="project-title">{p.title}</h3>
          <p className="proj-en" style={{ marginTop: 0 }}>{p.en}</p>

          <p className="modal__desc">{p.detail ?? p.summary}</p>

          <div className="modal__section">
            <h4>핵심 기능</h4>
            <ul className="curric" style={{ gridTemplateColumns: "1fr" }}>
              {p.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>

          <div className="modal__section">
            <h4>사용 기술</h4>
            <div className="tags">
              {p.stack.map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>

          <div className="modal__cta">
            <div className="proj-links" style={{ margin: 0, padding: 0, border: "none", flex: "1 1 auto" }}>
              {p.repoUrl && (
                <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="proj-link">GitHub 저장소 ↗</a>
              )}
              {p.demoUrl && (
                <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="proj-link proj-link--demo">데모 사이트 →</a>
              )}
              {!p.repoUrl && !p.demoUrl && (
                <span className="sample-note" style={{ margin: 0 }}>
                  {p.status === "공개" ? "링크 준비 중입니다." : "공개 예정 프로젝트입니다."}
                </span>
              )}
            </div>
            <button type="button" className="btn btn--ghost" onClick={onClose}>닫기</button>
          </div>

          <p className="sample-note" style={{ marginTop: 16 }}>
            * MVP 버전을 공유합니다. 최종본은 당사 자산으로, 도입·협업은 문의 요청해 주세요.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
