import Link from "next/link";
import AxoneMark from "@/components/AxoneMark";
import "./lab.css";

/**
 * 자체 프로젝트 데모 전체화면 셸.
 * /lab/* 는 마케팅 껍데기 없이 열리므로, 실제 구동되는 독립 사이트처럼 보이도록
 * 얇은 상단 데모 바(AXONE 마크 + 프로젝트명 + 도입 문의)만 얹고 본문은 전체폭으로 채웁니다.
 */
export default function LabShell({
  category,
  title,
  en,
  tagline,
  stack,
  children,
}: {
  category: string;
  title: string;
  en: string;
  tagline?: string;
  stack?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="labx">
      {/* 슬림 데모 바 (sticky) */}
      <div className="labx__bar">
        <div className="labx__bar-left">
          <Link href="/projects" className="labx__home" title="프로젝트 목록">
            <AxoneMark size={24} />
          </Link>
          <span className="labx__demo-pill">DEMO</span>
          <span className="labx__bar-title">{title}</span>
          <span className="labx__bar-cat">{category}</span>
        </div>
        <div className="labx__bar-right">
          <Link href="/projects" className="labx__bar-link">← 프로젝트 목록</Link>
          <Link href="/contact" className="labx__cta-sm">도입 문의 →</Link>
        </div>
      </div>

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

      {/* 데모 본체 — 전체폭 */}
      <div className="labx__stage">{children}</div>

      {/* 미니 푸터 */}
      <div className="labx__foot">
        <span className="labx__foot-note">
          <AxoneMark size={16} /> 에이엑스원(AXONE) 자체 제작 데모 · 예시 데이터로 동작하며 실제 도입 시 귀사 환경에 맞춰 구축됩니다.
        </span>
        <Link href="/contact" className="labx__cta-sm">도입 희망 시 문의하기</Link>
      </div>
    </div>
  );
}
