import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = pageMetadata({
  title: "부동산 매물정보 스크래핑 데모",
  description:
    "네이버·직방·다방 등 여러 부동산 플랫폼의 매물을 자동 수집·정리해 한눈에 비교하고, 신규·가격변동 매물을 알려주는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/realestate-scraper" },
});

export default function Page() {
  return (
    <LabShell
      path="/lab/realestate-scraper"
      category="자동화"
      title="부동산 매물정보 스크래핑"
      en="Real Estate Listing Scraper"
      tagline="여러 부동산 플랫폼의 매물 정보를 자동 수집·정리해 한눈에 비교하고, 신규·가격변동 매물을 알립니다."
      stack={["Python", "스크래핑", "n8n", "Sheets"]}
    >
      <Demo />
    </LabShell>
  );
}
