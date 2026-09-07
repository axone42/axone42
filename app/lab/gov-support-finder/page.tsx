import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "정부지원사업 추천 데모",
  description:
    "여러 기관의 정부지원사업 공고를 자동 수집하고 업종·규모·지역 조건에 맞춰 매칭·추천하는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/gov-support-finder" },
};

export default function Page() {
  return (
    <LabShell
      category="자동화"
      title="정부지원사업 스크래핑 & 추천"
      en="Gov Grant Finder"
      tagline="여러 기관의 정부지원사업 공고를 자동 수집하고, 업종·규모·지역 조건에 맞는 사업을 추천합니다."
      stack={["n8n", "스크래핑", "GPT", "Next.js"]}
    >
      <Demo />
    </LabShell>
  );
}
