import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = pageMetadata({
  title: "AI 이력서 스크리너 데모",
  description:
    "채용 공고 기준으로 지원서를 자동 평가·스코어링하여 순위를 매기는 AI 이력서 스크리너 데모입니다. 직무별로 경력·기술·학력·문화적합을 분석해 추천 후보를 제시합니다.",
  alternates: { canonical: "/lab/resume-screener" },
});

export default function Page() {
  return (
    <LabShell
      path="/lab/resume-screener"
      category="AI 앱"
      title="AI 이력서 스크리너"
      en="AI Resume Screener"
      tagline="채용 공고 기준으로 지원서를 평가·스코어링해 순위를 매깁니다."
      stack={["GPT", "Next.js"]}
    >
      <Demo />
    </LabShell>
  );
}
