// 공공데이터 연동 서버 유틸. 서버 전용.
// - 부동산: 국토교통부 아파트 매매 실거래가(RTMS, data.go.kr) → DATA_GO_KR_KEY
// - 정부지원: 기업마당(bizinfo) 지원사업정보 API → BIZINFO_API_KEY
// 키가 없거나 실패하면 live=false를 반환해 각 데모가 시뮬레이션으로 폴백합니다.
//
//   .env.local 예시:
//     DATA_GO_KR_KEY=...   # 공공데이터포털 '일반 인증키(Decoding)'
//     BIZINFO_API_KEY=...  # 기업마당 crtfcKey

export function hasRealEstateKey(): boolean {
  return !!process.env.DATA_GO_KR_KEY;
}
export function hasGovKey(): boolean {
  return !!process.env.BIZINFO_API_KEY;
}

// 자치구 → 법정동코드 앞 5자리(LAWD_CD)
export const LAWD: Record<string, string> = {
  강남구: "11680",
  서초구: "11650",
  송파구: "11710",
  마포구: "11440",
  성동구: "11200",
  용산구: "11170",
  영등포구: "11560",
  강동구: "11740",
};

export type Listing = {
  apt: string;
  dong: string;
  amount: number; // 만원
  area: number; // 전용면적 ㎡
  floor: string;
  buildYear: string;
  date: string; // YYYY.MM.DD
};

function xmlItems(xml: string): string[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
}
function xmlTag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : "";
}

export async function getRealEstate(opts: {
  region: string;
  dealYmd: string;
  rows?: number;
}): Promise<{ listings: Listing[]; live: boolean }> {
  const key = process.env.DATA_GO_KR_KEY;
  const lawd = LAWD[opts.region];
  if (!key || !lawd) return { listings: [], live: false };
  try {
    const url =
      `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev` +
      `?serviceKey=${encodeURIComponent(key)}&LAWD_CD=${lawd}&DEAL_YMD=${opts.dealYmd}` +
      `&pageNo=1&numOfRows=${opts.rows ?? 40}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { listings: [], live: false };
    const xml = await res.text();
    if (!xml.includes("<item>")) return { listings: [], live: false };
    const listings: Listing[] = xmlItems(xml).map((b) => {
      const y = xmlTag(b, "dealYear");
      const mo = xmlTag(b, "dealMonth").padStart(2, "0");
      const d = xmlTag(b, "dealDay").padStart(2, "0");
      return {
        apt: xmlTag(b, "aptNm"),
        dong: xmlTag(b, "umdNm"),
        amount: Number(xmlTag(b, "dealAmount").replace(/[,\s]/g, "")) || 0,
        area: Number(xmlTag(b, "excluUseAr")) || 0,
        floor: xmlTag(b, "floor"),
        buildYear: xmlTag(b, "buildYear"),
        date: `${y}.${mo}.${d}`,
      };
    });
    return { listings, live: listings.length > 0 };
  } catch {
    return { listings: [], live: false };
  }
}

export type Grant = {
  title: string;
  agency: string;
  period: string;
  field: string;
  url: string;
  summary: string;
};

type BizItem = {
  pblancNm?: string;
  jrsdInsttNm?: string;
  excInsttNm?: string;
  reqstBeginEndDe?: string;
  pblancUrl?: string;
  bsnsSumryCn?: string;
  pldirSportRealmLclasCodeNm?: string;
};

export async function getGovGrants(opts: { rows?: number }): Promise<{ grants: Grant[]; live: boolean }> {
  const key = process.env.BIZINFO_API_KEY;
  if (!key) return { grants: [], live: false };
  try {
    const url =
      `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do` +
      `?crtfcKey=${encodeURIComponent(key)}&dataType=json&searchCnt=${opts.rows ?? 30}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return { grants: [], live: false };
    const json = (await res.json()) as { jsonArray?: BizItem[]; item?: BizItem[] };
    const arr: BizItem[] = json.jsonArray ?? json.item ?? (Array.isArray(json) ? (json as BizItem[]) : []);
    const grants: Grant[] = arr
      .filter((g) => g.pblancNm)
      .slice(0, opts.rows ?? 30)
      .map((g) => ({
        title: g.pblancNm ?? "",
        agency: g.jrsdInsttNm ?? g.excInsttNm ?? "",
        period: g.reqstBeginEndDe ?? "",
        field: g.pldirSportRealmLclasCodeNm ?? "",
        url: g.pblancUrl ? `https://www.bizinfo.go.kr${g.pblancUrl}` : "https://www.bizinfo.go.kr",
        summary: (g.bsnsSumryCn ?? "").replace(/<[^>]+>/g, "").slice(0, 200),
      }));
    return { grants, live: grants.length > 0 };
  } catch {
    return { grants: [], live: false };
  }
}
