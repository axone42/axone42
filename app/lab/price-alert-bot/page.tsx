import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "코인·환율 알림 봇 데모",
  description:
    "BTC·ETH·환율·금·나스닥 시세를 실시간 감시하고, 가격 임계치·변동률에 도달하면 텔레그램·카톡으로 즉시 알리는 AXONE 자체 프로젝트 데모.",
  alternates: { canonical: "/lab/price-alert-bot" },
};

export default function Page() {
  return (
    <LabShell
      category="주식·금융"
      title="코인·환율 알림 봇"
      en="Crypto & FX Alert Bot"
      tagline="가격 임계치·변동률에 도달하면 텔레그램·카톡으로 즉시 알립니다."
      stack={["n8n", "Telegram", "시세 API"]}
    >
      <Demo />
    </LabShell>
  );
}
