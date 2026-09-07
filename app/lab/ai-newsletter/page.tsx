import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "AI 뉴스레터 자동 생성기 데모",
  description:
    "주제 소재 수집부터 GPT 초안 작성, 자동 검수, 발송 준비까지 뉴스레터 제작 전 과정을 자동화하는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/ai-newsletter" },
};

export default function Page() {
  return (
    <LabShell
      category="자동화"
      title="AI 뉴스레터 자동 생성기"
      en="AI Newsletter Generator"
      tagline="주제 소재 수집 → GPT 초안 → 검수 → 발송까지 한 번에 자동화합니다."
      stack={["n8n", "GPT", "Email"]}
    >
      <Demo />
    </LabShell>
  );
}
