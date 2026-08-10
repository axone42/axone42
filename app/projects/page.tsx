import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { projects, PROJECT_CATEGORIES } from "@/lib/projects";

export const metadata: Metadata = {
  title: "자체 프로젝트",
  description:
    "에이엑스원(AXONE)이 직접 만드는 오픈 프로젝트 로드맵 — 주식·금융, 자동화, AI 앱. 공개 예정 리스트.",
};

export default function ProjectsPage() {
  const recommended = projects.filter((p) => p.recommended);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Projects</p>
            <h1 className="page-hero__title">자체 프로젝트</h1>
            <p className="page-hero__lead">
              에이엑스원이 직접 만들어 공개하는 오픈 프로젝트입니다. 아래는 공개 예정
              로드맵으로, GitHub에서 꾸준히 인기 있는 주식·금융 · 자동화 · AI 앱
              카테고리를 기준으로 선정했습니다.
            </p>
            <div className="anchors">
              {PROJECT_CATEGORIES.map((c) => (
                <a key={c} href={`#${encodeURIComponent(c)}`} className="anchor-chip">
                  {c}
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 우선 추천 */}
      <section className="section--tight">
        <div className="container">
          <Reveal>
            <p className="eyebrow">먼저 추천하는 프로젝트</p>
            <h2 className="section-title" style={{ fontSize: "28px" }}>
              ★ 우선 착수 추천 {recommended.length}선
            </h2>
          </Reveal>
          <div className="cards" style={{ marginTop: 28 }}>
            {recommended.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <div className="card proj-card" style={{ height: "100%" }}>
                  <div className="proj-card__top">
                    <span className="proj-status">{p.status}</span>
                    <span className="proj-rec">★ 추천</span>
                  </div>
                  <h3 className="card__title">{p.title}</h3>
                  <p className="proj-en">{p.en}</p>
                  <p className="card__body">{p.summary}</p>
                  <div className="tags" style={{ marginTop: "auto", paddingTop: 16 }}>
                    {p.stack.map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 카테고리별 전체 로드맵 */}
      {PROJECT_CATEGORIES.map((cat) => {
        const list = projects.filter((p) => p.category === cat);
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
                    <div className="card proj-card" style={{ height: "100%" }}>
                      <div className="proj-card__top">
                        <span className="proj-status">{p.status}</span>
                        {p.recommended && <span className="proj-rec">★ 추천</span>}
                      </div>
                      <h3 className="card__title">{p.title}</h3>
                      <p className="proj-en">{p.en}</p>
                      <p className="card__body">{p.summary}</p>
                      <ul className="proj-high">
                        {p.highlights.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                      <div className="tags" style={{ marginTop: "auto", paddingTop: 16 }}>
                        {p.stack.map((t) => (
                          <span key={t} className="tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="section">
        <div className="container">
          <Reveal className="cta-band">
            <h2 className="cta-band__title">함께 만들고 싶은 프로젝트가 있나요?</h2>
            <p className="cta-band__sub">
              공개 예정 프로젝트에 대한 제안이나 협업 문의를 환영합니다.
            </p>
            <div className="cta-band__actions">
              <Link href="/contact" className="btn btn--primary">협업·문의하기</Link>
              <Link href="/services" className="btn btn--ghost">서비스 보기</Link>
            </div>
          </Reveal>
          <p className="sample-note">
            * 위 목록은 공개 예정 로드맵이며, GitHub에서 인기 있는 카테고리를 참고해 선정했습니다. 우선순위는 변경될 수 있습니다.
          </p>
        </div>
      </section>
    </>
  );
}
