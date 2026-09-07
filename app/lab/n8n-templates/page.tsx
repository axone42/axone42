import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "n8n 워크플로우 템플릿 갤러리 데모",
  description:
    "바로 가져다 쓰는 실무 자동화 레시피 모음. 카테고리·검색으로 원하는 워크플로우를 찾고 원클릭으로 임포트하는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/n8n-templates" },
};

export default function Page() {
  return (
    <LabShell
      category="자동화"
      title="n8n 워크플로우 템플릿 갤러리"
      en="n8n Workflow Template Gallery"
      tagline="바로 가져다 쓰는 실무 자동화 레시피 모음. 원클릭 임포트로 시작합니다."
      stack={["n8n", "JSON 템플릿"]}
    >
      <Demo />
    </LabShell>
  );
}
