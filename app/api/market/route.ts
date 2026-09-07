import { NextResponse } from "next/server";
import {
  getQuotes,
  getHistory,
  getNews,
  getCrypto,
  getFx,
  WATCHLIST,
  INDICES,
  NEWS_QUERY,
  type RangeKey,
} from "@/lib/market";

// 실시간 시세 프록시. 예:
//   /api/market?quotes=1                → 관심종목 시세
//   /api/market?quotes=1&group=indices  → 지수·환율 시세
//   /api/market?symbol=005930.KS&range=1D → 차트 히스토리 + 메타
//   /api/market?news=005930.KS          → 종목 뉴스
export const dynamic = "force-dynamic";

const VALID_RANGES: RangeKey[] = ["1D", "1W", "1M", "1Y"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  try {
    // 뉴스
    const news = searchParams.get("news");
    if (news) {
      const query = NEWS_QUERY[news] ?? news;
      const items = await getNews(query);
      return NextResponse.json({ news: items });
    }

    // 코인 시세
    if (searchParams.get("crypto")) {
      const crypto = await getCrypto();
      return NextResponse.json({ crypto, updatedAt: Date.now() });
    }

    // 환율
    if (searchParams.get("fx")) {
      const fx = await getFx();
      return NextResponse.json({ fx, updatedAt: Date.now() });
    }

    // 차트 히스토리
    const symbol = searchParams.get("symbol");
    if (symbol) {
      const rangeParam = (searchParams.get("range") ?? "1D") as RangeKey;
      const range = VALID_RANGES.includes(rangeParam) ? rangeParam : "1D";
      const data = await getHistory(symbol, range);
      return NextResponse.json(data);
    }

    // 시세 (관심종목 or 지수)
    if (searchParams.get("quotes")) {
      const group = searchParams.get("group");
      const pairs = group === "indices" ? INDICES : WATCHLIST;
      const quotes = await getQuotes(pairs);
      return NextResponse.json({ quotes, updatedAt: Date.now() });
    }

    return NextResponse.json({ error: "bad request" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "market fetch failed" },
      { status: 502 }
    );
  }
}
