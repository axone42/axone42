// 실시간 시세 서버 유틸 — Yahoo Finance(무료·무키) 프록시. 서버 전용.
// CORS 회피 + UA 헤더 + 20초 재검증 캐시로 안정적으로 실데이터를 제공합니다.

const YAHOO = "https://query1.finance.yahoo.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export type RangeKey = "1D" | "1W" | "1M" | "1Y";

export const RANGE_MAP: Record<RangeKey, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
};

// 관심 종목 (한국·미국 대표주)
export const WATCHLIST = [
  { symbol: "005930.KS", name: "삼성전자" },
  { symbol: "000660.KS", name: "SK하이닉스" },
  { symbol: "035420.KS", name: "NAVER" },
  { symbol: "035720.KS", name: "카카오" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "TSLA", name: "Tesla" },
];

// 상단 KPI용 지수·환율
export const INDICES = [
  { symbol: "^KS11", name: "KOSPI" },
  { symbol: "^KQ11", name: "KOSDAQ" },
  { symbol: "KRW=X", name: "USD/KRW" },
  { symbol: "^IXIC", name: "NASDAQ" },
];

// 종목 뉴스 검색용 질의어(한글명 → 검색어)
export const NEWS_QUERY: Record<string, string> = {
  "005930.KS": "Samsung Electronics",
  "000660.KS": "SK Hynix",
  "035420.KS": "Naver",
  "035720.KS": "Kakao",
  AAPL: "Apple stock",
  TSLA: "Tesla stock",
};

export type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  currency: string;
  spark: number[];
};

export type HistoryPoint = { t: number; c: number };

export type HistoryMeta = {
  currency: string;
  price: number | null;
  prevClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  open: number | null;
  volume: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  marketTime: number | null;
};

export type NewsItem = { title: string; publisher: string; link: string; time: number };

type YChartMeta = {
  currency?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketTime?: number;
};

type YChartResult = {
  meta?: YChartMeta;
  timestamp?: number[];
  indicators?: { quote?: { open?: (number | null)[]; close?: (number | null)[] }[] };
};

async function fetchChart(symbol: string, range: string, interval: string): Promise<YChartResult> {
  const url = `${YAHOO}/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=${range}&interval=${interval}&includePrePost=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 20 },
  });
  if (!res.ok) throw new Error(`yahoo chart ${res.status}`);
  const json = (await res.json()) as { chart?: { result?: YChartResult[]; error?: unknown } };
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("yahoo: empty chart result");
  return result;
}

export async function getQuotes(pairs: { symbol: string; name: string }[]): Promise<Quote[]> {
  const out = await Promise.all(
    pairs.map(async ({ symbol, name }) => {
      try {
        const r = await fetchChart(symbol, "1d", "5m");
        const m = r.meta ?? {};
        const closes = (r.indicators?.quote?.[0]?.close ?? []).filter(
          (c): c is number => c != null
        );
        const price = m.regularMarketPrice ?? closes[closes.length - 1] ?? null;
        const prevClose = m.chartPreviousClose ?? m.previousClose ?? null;
        const change = price != null && prevClose != null ? price - prevClose : null;
        const changePct =
          change != null && prevClose ? (change / prevClose) * 100 : null;
        return {
          symbol,
          name,
          price,
          prevClose,
          change,
          changePct,
          currency: m.currency ?? "",
          spark: closes.slice(-40),
        } satisfies Quote;
      } catch {
        return {
          symbol,
          name,
          price: null,
          prevClose: null,
          change: null,
          changePct: null,
          currency: "",
          spark: [],
        } satisfies Quote;
      }
    })
  );
  return out;
}

export async function getHistory(
  symbol: string,
  rangeKey: RangeKey
): Promise<{ points: HistoryPoint[]; meta: HistoryMeta }> {
  const { range, interval } = RANGE_MAP[rangeKey] ?? RANGE_MAP["1D"];
  const r = await fetchChart(symbol, range, interval);
  const m = r.meta ?? {};
  const ts = r.timestamp ?? [];
  const closes = r.indicators?.quote?.[0]?.close ?? [];
  const points: HistoryPoint[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (c != null) points.push({ t: ts[i], c });
  }
  return {
    points,
    meta: {
      currency: m.currency ?? "",
      price: m.regularMarketPrice ?? null,
      prevClose: m.chartPreviousClose ?? m.previousClose ?? null,
      dayHigh: m.regularMarketDayHigh ?? null,
      dayLow: m.regularMarketDayLow ?? null,
      open: r.indicators?.quote?.[0]?.open?.find((o): o is number => o != null) ?? null,
      volume: m.regularMarketVolume ?? null,
      fiftyTwoWeekHigh: m.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: m.fiftyTwoWeekLow ?? null,
      marketTime: m.regularMarketTime ?? null,
    },
  };
}

export type CryptoQuote = { id: string; name: string; symbol: string; krw: number | null; usd: number | null; changePct: number | null };

export const CRYPTOS = [
  { id: "bitcoin", name: "비트코인", symbol: "BTC" },
  { id: "ethereum", name: "이더리움", symbol: "ETH" },
  { id: "solana", name: "솔라나", symbol: "SOL" },
  { id: "ripple", name: "리플", symbol: "XRP" },
];

export async function getCrypto(): Promise<CryptoQuote[]> {
  try {
    const ids = CRYPTOS.map((c) => c.id).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=krw,usd&include_24hr_change=true`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 20 } });
    if (!res.ok) return [];
    const json = (await res.json()) as Record<string, { krw?: number; usd?: number; krw_24h_change?: number }>;
    return CRYPTOS.map((c) => {
      const d = json[c.id] ?? {};
      return { id: c.id, name: c.name, symbol: c.symbol, krw: d.krw ?? null, usd: d.usd ?? null, changePct: d.krw_24h_change ?? null };
    });
  } catch {
    return [];
  }
}

export type FxQuote = { pair: string; name: string; rate: number | null };

export async function getFx(): Promise<FxQuote[]> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { rates?: Record<string, number> };
    const r = json.rates ?? {};
    const krw = r.KRW ?? null;
    const jpy = r.JPY ?? null;
    const eur = r.EUR ?? null;
    return [
      { pair: "USD/KRW", name: "달러/원", rate: krw },
      { pair: "EUR/KRW", name: "유로/원", rate: krw && eur ? krw / eur : null },
      { pair: "JPY/KRW", name: "엔/원(100엔)", rate: krw && jpy ? (krw / jpy) * 100 : null },
      { pair: "USD/JPY", name: "달러/엔", rate: jpy },
    ];
  } catch {
    return [];
  }
}

export async function getNews(query: string): Promise<NewsItem[]> {
  try {
    const url = `${YAHOO}/v1/finance/search?q=${encodeURIComponent(
      query
    )}&newsCount=6&quotesCount=0&enableFuzzyQuery=false`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      news?: { title: string; publisher: string; link: string; providerPublishTime: number }[];
    };
    return (json.news ?? [])
      .filter((n) => n.title && n.link)
      .slice(0, 6)
      .map((n) => ({
        title: n.title,
        publisher: n.publisher ?? "",
        link: n.link,
        time: n.providerPublishTime ?? 0,
      }));
  } catch {
    return [];
  }
}
