import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "전략 백테스팅 엔진 데모",
  description:
    "골든크로스·RSI 반전·볼린저 밴드 등 매매 전략을 과거 데이터로 시뮬레이션하고 수익률·MDD·샤프지수로 성과를 검증하는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/backtester" },
};

export default function Page() {
  return (
    <LabShell
      category="주식·금융"
      title="전략 백테스팅 엔진"
      en="Trading Strategy Backtester"
      tagline="매매 전략을 과거 데이터로 시뮬레이션하고 수익률·MDD·샤프 지표로 성과를 검증합니다."
      stack={["Python", "pandas", "backtest"]}
    >
      <Demo />
    </LabShell>
  );
}
