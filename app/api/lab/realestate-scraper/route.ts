import { NextResponse } from "next/server";
import { getRealEstate, LAWD } from "@/lib/gov";

export const dynamic = "force-dynamic";

// 최근(전월) 거래월 YYYYMM
function recentYmd(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  let body: { region?: string; dealYmd?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const region = body.region && body.region in LAWD ? body.region : "강남구";
  const dealYmd = body.dealYmd && /^\d{6}$/.test(body.dealYmd) ? body.dealYmd : recentYmd();

  const { listings, live } = await getRealEstate({ region, dealYmd, rows: 40 });
  return NextResponse.json({ live, region, dealYmd, listings });
}
