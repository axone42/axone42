import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "배당 포트폴리오 트래커 데모",
  description:
    "보유 종목의 배당 일정·수익률·현금흐름을 자동으로 추적하고 월별 예상 배당금을 계산해 주는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/dividend-tracker" },
};

export default function Page() {
  return (
    <LabShell
      category="주식·금융"
      title="배당 포트폴리오 트래커"
      en="Dividend Portfolio Tracker"
      tagline="보유 종목의 배당 일정·수익률·현금흐름을 자동으로 추적하고 예상 배당금을 계산합니다."
      stack={["Next.js", "DB", "증권 API"]}
    >
      <Demo />
    </LabShell>
  );
}
