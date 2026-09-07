import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "AI 주식 뉴스 감성분석 데모",
  description:
    "종목별 뉴스를 수집해 GPT로 긍·부정을 분석하고 매일 아침 매매 시그널을 요약하는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/stock-sentiment" },
};

export default function Page() {
  return (
    <LabShell
      category="주식·금융"
      title="AI 주식 뉴스 감성분석"
      en="Stock News Sentiment AI"
      tagline="종목별 뉴스를 수집해 GPT로 긍·부정을 분석하고 매일 아침 시그널을 요약합니다."
      stack={["Python", "GPT", "n8n", "크롤링"]}
    >
      <Demo />
    </LabShell>
  );
}
