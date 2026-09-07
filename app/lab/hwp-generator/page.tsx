import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = pageMetadata({
  title: "한글문서 생성 시스템 데모",
  description: "공문·제안서·보고서의 내용을 편집하고 미리보기와 본문 텍스트 다운로드를 체험하는 문서 생성 데모.",
  alternates: { canonical: "/lab/hwp-generator" },
});

export default function Page() {
  return (
    <LabShell
      path="/lab/hwp-generator"
      category="생산성·콘텐츠"
      title="한글문서 생성 시스템"
      en="HWP Document Generator"
      tagline="문서 정보를 편집하고 초안·미리보기·텍스트 다운로드를 체험합니다."
      scope="공문·제안서·보고서 편집과 본문 .txt 다운로드를 제공합니다. HWPX 서식 파일 생성은 아직 지원하지 않습니다. AI 연결이 어려우면 샘플 초안으로 안내합니다."
      stack={["Python", "HWPX", "GPT"]}
    >
      <Demo />
    </LabShell>
  );
}
