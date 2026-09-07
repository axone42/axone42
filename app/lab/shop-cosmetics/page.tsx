import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "화장품 쇼핑몰 데모",
  description: "피부 고민별 추천·성분·리뷰와 장바구니·결제 흐름까지 갖춘 화장품 자사몰을 재현한 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/shop-cosmetics" },
};

export default function Page() {
  return (
    <LabShell
      category="웹·커머스"
      title="화장품 쇼핑몰"
      en="Cosmetics Storefront"
      tagline="피부 고민별 추천·성분·리뷰와 장바구니·결제 흐름까지 갖춘 화장품 자사몰."
      stack={["Next.js", "커머스", "PG 연동", "반응형"]}
    >
      <Demo />
    </LabShell>
  );
}
