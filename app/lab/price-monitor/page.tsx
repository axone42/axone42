import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = pageMetadata({
  title: "가격·재고 모니터링 스크래퍼 데모",
  description:
    "경쟁사·쇼핑몰의 가격과 재고 변동을 자동으로 감지해 하락·품절·최저가 알림을 보내는 가격 모니터링 스크래퍼 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/price-monitor" },
});

export default function Page() {
  return (
    <LabShell
      path="/lab/price-monitor"
      category="자동화"
      title="가격·재고 모니터링 스크래퍼"
      en="Price & Stock Monitor"
      tagline="경쟁사·쇼핑몰의 가격·재고 변동을 감지해 알림을 보냅니다."
      stack={["Python", "스크래핑", "n8n"]}
    >
      <Demo />
    </LabShell>
  );
}
