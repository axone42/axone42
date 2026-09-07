import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = pageMetadata({
  title: "크리에이티브 스튜디오 홈페이지 데모",
  description:
    "다크 시네마틱 에디토리얼 감성의 크리에이티브 스튜디오 홈페이지 샘플 · 오버사이즈 워드마크·프로젝트 릴·풀스크린 메뉴로 구성한 AXONE 자체 제작 데모.",
  alternates: { canonical: "/lab/corporate-site" },
});

export default function Page() {
  return (
    <LabShell
      path="/lab/corporate-site"
      category="웹·브랜딩"
      title="크리에이티브 스튜디오 홈페이지"
      en="Creative Studio Website"
      tagline="다크 시네마틱 에디토리얼 · 오버사이즈 워드마크·프로젝트 릴·풀스크린 메뉴로 브랜드를 영화 타이틀처럼."
      scope="AI 생성 작품·인물 사진으로 구성한 가상 스튜디오입니다. 프로젝트·팀·고객사·수상 내역은 화면 구성을 위한 예시입니다."
      stack={["Next.js", "TypeScript", "반응형", "시네마틱"]}
    >
      <Demo />
    </LabShell>
  );
}
