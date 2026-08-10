import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ProjectExplorer from "@/components/ProjectExplorer";
import { PROJECT_CATEGORIES } from "@/lib/projects";

export const metadata: Metadata = {
  title: "자체 프로젝트",
  description:
    "에이엑스원이 직접 만들어 공개하는 오픈 프로젝트 — 블로그 자동화, 팀 캘린더, 리드 알림, 주식·자동화·AI 앱. 각 항목을 눌러 상세·데모·GitHub를 확인하세요.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Projects</p>
            <h1 className="page-hero__title">자체 프로젝트</h1>
            <p className="page-hero__lead">
              에이엑스원이 직접 만들어 공개하는 프로젝트입니다. 완성된 서비스부터 공개 예정
              로드맵까지 — 각 항목을 누르면 상세 설명과 데모·GitHub 링크를 볼 수 있습니다.
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

      <ProjectExplorer />

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
        </div>
      </section>
    </>
  );
}
