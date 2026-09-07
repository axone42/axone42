import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = pageMetadata({
  title: "영수증·인보이스 OCR 추출기 데모",
  description:
    "영수증·세금계산서·명함 이미지에서 상호·사업자번호·품목·합계를 자동 추출해 신뢰도와 함께 시트·ERP로 입력하는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/ocr-extractor" },
});

export default function Page() {
  return (
    <LabShell
      path="/lab/ocr-extractor"
      category="자동화"
      title="영수증·인보이스 OCR 추출기"
      en="Receipt/Invoice OCR"
      tagline="문서 이미지에서 항목을 추출해 시트·ERP로 자동 입력합니다."
      stack={["OCR", "GPT", "Sheets"]}
    >
      <Demo />
    </LabShell>
  );
}
