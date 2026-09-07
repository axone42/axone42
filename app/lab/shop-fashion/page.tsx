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
      stack={["Next.js", "커머스", "PG 연동", "반응형"]}
    >
      <Demo />
    </LabShell>
  );
}
