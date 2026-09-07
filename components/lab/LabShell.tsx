import Link from "next/link";
import AxoneMark from "@/components/AxoneMark";
import PageSeo from "@/components/PageSeo";
import { absoluteUrl } from "@/lib/seo";
import { projects } from "@/lib/projects";
import { contactForProject } from "@/lib/project-inquiry";
import "./lab.css";

/**
 * 자체 프로젝트 데모 전체화면 셸.
 * /lab/* 는 마케팅 껍데기 없이 열리므로, 실제 구동되는 독립 사이트처럼 보이도록
 * 얇은 상단 데모 바(AXONE 마크 + 프로젝트명 + 도입 문의)만 얹고 본문은 전체폭으로 채웁니다.
 */
export default function LabShell({
  path,
  category,
  title,
  en,
  tagline,
  stack,
  children,
  scope,
}: {
  path: string;
  category: string;
  title: string;
  en: string;
  tagline?: string;
  stack?: string[];
  children: React.ReactNode;
  scope?: string;
}) {
  const project = projects.find(p => p.demoUrl === path);
  const contactHref = project ? contactForProject(project.id) : "/contact";
  return (
    <div className="labx">
      {/* 슬림 데모 바 (sticky) */}
      <div className="labx__bar">
        <div className="labx__bar-left">
          <Link href="/projects" className="labx__home" title="프로젝트 목록">
            <AxoneMark size={24} />
          </Link>
          <span className="labx__demo-pill">DEMO</span>
          <h1 className="labx__bar-title">{title}</h1>
          <span className="labx__bar-cat">{category}</span>
        </div>
        <div className="labx__bar-right">
          <Link href="/projects" className="labx__bar-link">← 프로젝트 목록</Link>
          <Link href={contactHref} className="labx__cta-sm">도입 문의 →</Link>
        </div>
      </div>

      <PageSeo path={path} title={title} description={tagline} parent={{ path: "/projects", title: "자체 프로젝트" }} entities={[
        { "@type": "CreativeWork", "@id": `${absoluteUrl(path)}#demo`, name: title, description: tagline, url: absoluteUrl(path), genre: "자체 제작 인터랙티브 데모", creator: { "@id": absoluteUrl("/#organization") }, inLanguage: "ko-KR" },
      ]} />
      {tagline && (
        <p className="labx__subline">
          <b>{en}</b> · {tagline}
          {stack && stack.length > 0 && (
            <span className="labx__subline-stack">
              {stack.map((s) => <span key={s}>{s}</span>)}
            </span>
          )}
        </p>
      )}

      <div className="labx__scope"><b>체험 범위</b><span>{scope ?? "사용 흐름을 살펴보는 자체 제작 데모입니다. 예시 데이터와 일부 외부 조회를 사용하며, 실제 주문·발송·외부 시스템 저장은 수행하지 않습니다. 실제 도입 범위는 상담에서 확정합니다."}</span></div>
      {/* 데모 본체 — 전체폭 */}
      <main className="labx__stage"><h2 className="visually-hidden">{title} 체험 화면</h2>{children}</main>

      {/* 미니 푸터 */}
      <div className="labx__foot">
        <span className="labx__foot-note">
          <AxoneMark size={16} /> 에이엑스원(AXONE) 자체 제작 데모 · 예시 데이터로 동작하며 실제 도입 시 귀사 환경에 맞춰 구축됩니다.
        </span>
        <Link href={contactHref} className="labx__cta-sm">도입 희망 시 문의하기</Link>
      </div>
    </div>
  );
}
