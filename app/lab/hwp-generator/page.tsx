import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "한글문서 생성 시스템 데모",
  description: "양식과 데이터만 입력하면 공문·제안서·보고서를 한글(HWPX) 문서로 자동 생성하고 AI가 초안 문구까지 채워 넣는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/hwp-generator" },
};

export default function Page() {
  return (
    <LabShell
      category="생산성·콘텐츠"
      title="한글문서 생성 시스템"
      en="HWP Document Generator"
      tagline="양식과 데이터만 넣으면 공문·제안서·보고서를 한글(HWPX) 문서로 자동 생성합니다. AI가 초안 문구까지 채워 넣습니다."
      stack={["Python", "HWPX", "GPT"]}
    >
      <Demo />
    </LabShell>
  );
}
