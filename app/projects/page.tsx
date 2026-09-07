import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ProjectExplorer from "@/components/ProjectExplorer";

export const metadata: Metadata = {
  title: "자체 프로젝트",
  description:
    "AXONE 자체 제작 프로젝트. 업무 자동화·AI 앱·웹사이트 데모를 직접 사용하고 체험 범위와 구현 내용을 확인하세요.",
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
              직접 사용해볼 수 있는 데모와 소개 단계의 프로젝트를 구분해 안내합니다.
              실제 고객사 실적이 아닌 자체 제작 예시이며, 체험 가능한 범위는 데모 상단에서 확인할 수 있습니다.
            </p>

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
