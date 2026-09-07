import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "실시간 주식 대시보드 데모",
  description:
    "관심 종목의 시세·차트·재무·뉴스를 한 화면에서 실시간으로 확인하는 다크 트레이딩 대시보드 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/stock-dashboard" },
};

export default function Page() {
  return (
    <LabShell
      category="주식·금융"
      title="실시간 주식 대시보드"
      en="Real-time Stock Dashboard"
      tagline="관심 종목의 시세·차트·재무·뉴스를 한 화면에서 조회하는 대시보드."
      scope="외부 시세를 조회하며 최대 15분 지연될 수 있습니다. 보유 종목·수량은 예시입니다. 종목과 기간별 차트를 살펴볼 수 있으며 매매 기능은 제공하지 않습니다."
      stack={["Next.js", "WebSocket", "Chart", "증권 API"]}
    >
      <Demo />
    </LabShell>
  );
}
