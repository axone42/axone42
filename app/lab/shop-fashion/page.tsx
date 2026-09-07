import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "의류 쇼핑몰 데모",
  description:
    "룩북·사이즈/컬러 옵션·코디 추천·위시리스트·장바구니를 갖춘 의류 자사몰 UX를 브라우저 창 안에서 시연하는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/shop-fashion" },
};

export default function Page() {
  return (
    <LabShell
      category="웹·커머스"
      title="의류 쇼핑몰"
      en="Fashion Storefront"
      tagline="룩북·사이즈/컬러 옵션·코디 추천을 갖춘 의류 자사몰. 위시리스트·장바구니 포함."
      scope="AI 생성 상품·룩북 사진과 가상 상품으로 구성한 쇼핑몰입니다. 대표 색상 사진이며 옵션에 따라 사진이 바뀌지는 않습니다. 실제 결제·주문은 진행되지 않습니다."
      stack={["Next.js", "커머스", "PG 연동", "반응형"]}
    >
      <Demo />
    </LabShell>
  );
}
