import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "개인 브랜딩 자동화 데모",
  description: "하나의 글을 채널별 톤·형식에 맞게 자동 리라이팅하고 예약 발행·성과를 예측하는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/personal-branding" },
};

export default function Page() {
  return (
    <LabShell
      category="생산성·콘텐츠"
      title="개인 브랜딩 자동화"
      en="Personal Branding Automation"
      tagline="한 번 작성한 글을 LinkedIn·Threads·X·Instagram 톤에 맞춰 자동 변환하고, 발행 시점과 성과까지 예측합니다."
      stack={["n8n", "GPT", "LinkedIn API", "Threads"]}
    >
      <Demo />
    </LabShell>
  );
}
