import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "n8n 워크플로우 템플릿 갤러리 데모",
  description:
    "실무 자동화 구현 예시를 카테고리와 검색으로 살펴보는 AXONE 워크플로우 갤러리 데모.",
  alternates: { canonical: "/lab/n8n-templates" },
};

export default function Page() {
  return (
    <LabShell
      category="자동화"
      title="n8n 워크플로우 템플릿 갤러리"
      en="n8n Workflow Template Gallery"
      tagline="업무별 자동화 흐름을 찾아보고 검토 목록에 담아보세요."
      scope="구현 예시 검색·상세 보기·현재 화면의 검토 목록을 체험합니다. 실행 가능한 JSON 다운로드나 n8n으로의 실제 임포트는 제공하지 않습니다."
      stack={["n8n", "JSON 템플릿"]}
    >
      <Demo />
    </LabShell>
  );
}
