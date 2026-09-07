"use client";

import { useMemo, useState } from "react";
import DemoPhoto from "@/components/lab/DemoPhoto";

/* ── 데이터 모델 ─────────────────────────────────────────── */

type Deal = "매매" | "전세" | "월세";
type Source = "네이버" | "직방" | "다방" | "국토부 실거래";

type Listing = {
  id: string;
  name: string; // 아파트/단지명
  complex: string; // 세부 동/단지 라벨
  gu: string; // 지역구
  deal: Deal;
  price: number; // 만원 단위 (월세는 보증금 기준)
  monthly?: number; // 월세 (만원)
  area: number; // 전용 평형(평)
  floor: number;
  totalFloor: number;
  source: Source;
  isNew: boolean;
  change: number; // 가격변동 (만원). 음수=하락, 양수=상승, 0=없음
  hue: number; // 썸네일 그라디언트 색상
};

// API가 지원하는 8개 지역구 (실데이터 매핑용)
const GU_LIST = ["강남구", "서초구", "송파구", "마포구", "성동구", "용산구", "영등포구", "강동구"] as const;
const DEALS: Deal[] = ["매매", "전세", "월세"];

/* 국토부 실거래가 API 응답 타입 */
type ApiListing = {
  apt: string;
  dong: string;
  amount: number; // 만원
  area: number; // 전용 ㎡
  floor: string;
  buildYear: string;
  date: string; // "YYYY.MM.DD"
};
type ApiResponse = { live: boolean; region: string; dealYmd: string; listings: ApiListing[] };

// 문자열 해시 → 안정적인 hue (하이드레이션/렌더 일관성 보장, 랜덤 미사용)
function hueOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

// 국토부 실거래 응답 → 카드 그리드용 Listing 매핑
function mapApiListings(region: string, rows: ApiListing[]): Listing[] {
  return rows.map((r, i) => ({
    id: `GOV-${i}`,
    name: r.apt,
    complex: `${r.dong} · ${r.buildYear ? r.buildYear + "년" : "건축년 미상"} · ${r.date}`,
    gu: region,
    deal: "매매" as Deal, // 국토부 아파트 매매 실거래
    price: r.amount,
    area: r.area, // ㎡ (표기 시 평 환산)
    floor: Number(r.floor) || 0,
    totalFloor: 0,
    source: "국토부 실거래" as Source,
    isNew: false,
    change: 0,
    hue: hueOf(r.apt || String(i)),
  }));
}

// 전용 ㎡ → 평 (1평 ≈ 3.3058㎡)
function pyeong(m2: number): number {
  return Math.round((m2 / 3.3058) * 10) / 10;
}

/* 고정 시드 데이터 (초기 렌더에 랜덤/시간 사용 안 함) */
const LISTINGS: Listing[] = [
  { id: "L1", name: "래미안 퍼스티지", complex: "101동 · 고층", gu: "강남구", deal: "매매", price: 289000, area: 34, floor: 18, totalFloor: 25, source: "네이버", isNew: true, change: 0, hue: 258 },
  { id: "L2", name: "마포 프레스티지 자이", complex: "3단지 · 중층", gu: "마포구", deal: "매매", price: 174000, area: 25, floor: 11, totalFloor: 20, source: "직방", isNew: false, change: -2000, hue: 210 },
  { id: "L3", name: "서울숲 트리마제", complex: "B동 · 한강뷰", gu: "성동구", deal: "전세", price: 132000, area: 29, floor: 22, totalFloor: 47, source: "다방", isNew: false, change: 1000, hue: 168 },
  { id: "L4", name: "헬리오시티", complex: "204동 · 남향", gu: "송파구", deal: "매매", price: 198000, area: 33, floor: 9, totalFloor: 35, source: "네이버", isNew: true, change: 0, hue: 24 },
  { id: "L5", name: "한남더힐", complex: "관리동 인접", gu: "용산구", deal: "전세", price: 245000, area: 41, floor: 5, totalFloor: 12, source: "직방", isNew: false, change: -3000, hue: 288 },
  { id: "L6", name: "마포래미안 푸르지오", complex: "112동 · 로열층", gu: "마포구", deal: "월세", price: 20000, monthly: 180, area: 24, floor: 14, totalFloor: 30, source: "다방", isNew: false, change: 0, hue: 340 },
  { id: "L7", name: "옥수 하이츠", complex: "2차 · 리모델링", gu: "성동구", deal: "매매", price: 121000, area: 22, floor: 7, totalFloor: 18, source: "네이버", isNew: true, change: 0, hue: 132 },
  { id: "L8", name: "잠실 엘스", complex: "308동 · 중층", gu: "송파구", deal: "전세", price: 98000, area: 24, floor: 12, totalFloor: 33, source: "직방", isNew: false, change: 500, hue: 45 },
];

/* ── 옵션/헬퍼 ──────────────────────────────────────────── */

const PRICE_BANDS = [
  { key: "all", label: "전체 가격대", min: 0, max: Infinity },
  { key: "u10", label: "10억 이하", min: 0, max: 100000 },
  { key: "10-20", label: "10~20억", min: 100000, max: 200000 },
  { key: "o20", label: "20억 이상", min: 200000, max: Infinity },
] as const;

const AREA_BANDS = [
  { key: "all", label: "전체 평형", min: 0, max: Infinity },
  { key: "s", label: "~24평", min: 0, max: 24 },
  { key: "m", label: "25~33평", min: 25, max: 33 },
  { key: "l", label: "34평~", min: 34, max: Infinity },
] as const;

const SORTS = [
  { key: "new", label: "최신순" },
  { key: "priceUp", label: "가격 ↑" },
  { key: "priceDown", label: "가격 ↓" },
] as const;

const SOURCE_STYLE: Record<Source, { bg: string; fg: string }> = {
  네이버: { bg: "#e7f5ea", fg: "#1f8a3b" },
  직방: { bg: "#e8f0fd", fg: "#2f6bd6" },
  다방: { bg: "#fdeaf3", fg: "#c13584" },
  "국토부 실거래": { bg: "#eef0f5", fg: "#3a4a63" },
};

function eok(manwon: number): string {
  // 만원 → "n억 m,mmm" 표기
  const eokPart = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eokPart === 0) return `${manwon.toLocaleString("ko-KR")}만`;
  if (rest === 0) return `${eokPart}억`;
  return `${eokPart}억 ${rest.toLocaleString("ko-KR")}`;
}

function priceLabel(l: Listing): string {
  if (l.deal === "월세" && l.monthly != null) {
    return `${eok(l.price)} / ${l.monthly.toLocaleString("ko-KR")}만`;
  }
  return eok(l.price);
}

/* 알림 피드 (고정 시드 — 상대시간 라벨은 문자열 상수) */
const ALERTS: { icon: string; text: string; ago: string; tone: "new" | "down" | "up" }[] = [
  { icon: "🆕", text: "강남구 래미안 퍼스티지 신규 매물 등록", ago: "3분 전", tone: "new" },
  { icon: "▼", text: "용산구 한남더힐 3,000만 하락", ago: "18분 전", tone: "down" },
  { icon: "▼", text: "마포구 프레스티지 자이 2,000만 하락", ago: "41분 전", tone: "down" },
  { icon: "🆕", text: "송파구 헬리오시티 신규 매물 등록", ago: "1시간 전", tone: "new" },
  { icon: "▲", text: "성동구 트리마제 1,000만 상승", ago: "2시간 전", tone: "up" },
];

/* ── 컴포넌트 ───────────────────────────────────────────── */

export default function Demo() {
  const [gu, setGu] = useState<string>("전체");
  const [deal, setDeal] = useState<Deal | "전체">("전체");
  const [priceBand, setPriceBand] = useState<string>("all");
  const [areaBand, setAreaBand] = useState<string>("all");
  const [sort, setSort] = useState<string>("new");
  const [loading, setLoading] = useState(false);
  // 실데이터 상태: live면 국토부 실거래, 아니면 시뮬레이션 유지
  const [live, setLive] = useState(false);
  const [rows, setRows] = useState<Listing[]>(LISTINGS);

  // 실데이터는 전용면적이 ㎡ 기준이므로 평형 밴드를 ㎡로 비교
  const filtered = useMemo(() => {
    const pb = PRICE_BANDS.find((p) => p.key === priceBand)!;
    const ab = AREA_BANDS.find((a) => a.key === areaBand)!;
    const areaOf = (l: Listing) => (l.source === "국토부 실거래" ? pyeong(l.area) : l.area);
    const source = rows.filter((l) => {
      if (gu !== "전체" && l.gu !== gu) return false;
      if (deal !== "전체" && l.deal !== deal) return false;
      if (l.price < pb.min || l.price > pb.max) return false;
      const a = areaOf(l);
      if (a < ab.min || a > ab.max) return false;
      return true;
    });
    const sorted = [...source];
    if (sort === "priceUp") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "priceDown") sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew)); // 최신: 신규 우선
    return sorted;
  }, [rows, gu, deal, priceBand, areaBand, sort]);

  /* 통계 (필터 결과 기준) */
  const stats = useMemo(() => {
    const count = filtered.length;
    const newCount = filtered.filter((l) => l.isNew).length;
    const downCount = filtered.filter((l) => l.change < 0).length;
    const avg = count === 0 ? 0 : Math.round(filtered.reduce((s, l) => s + l.price, 0) / count);
    return { count, newCount, downCount, avg };
  }, [filtered]);

  const run = async () => {
    setLoading(true);
    // 실데이터 조회 지역: 필터가 "전체"면 기본값(강남구)로 조회
    const region = gu !== "전체" && GU_LIST.includes(gu as (typeof GU_LIST)[number]) ? gu : GU_LIST[0];
    try {
      const res = await fetch("/api/lab/realestate-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region }),
      });
      const data: ApiResponse = await res.json();
      if (data.live && Array.isArray(data.listings) && data.listings.length) {
        setRows(mapApiListings(data.region, data.listings));
        setGu(data.region); // 실데이터 지역으로 필터 고정 → 카드 노출 보장
        setLive(true);
      } else {
        // 키 없음/무데이터 → 기존 시뮬레이션 유지
        setRows(LISTINGS);
        setLive(false);
      }
    } catch {
      setRows(LISTINGS);
      setLive(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lx-win res">
      <style>{RES_CSS}</style>

      {/* ── 앱 툴바 ── */}
      <div className="lx-win__bar res-bar">
        <div className="res-brand">
          <span className="res-brand__logo" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
              <path d="M10 21v-6h4v6" />
            </svg>
          </span>
          <span className="res-brand__name">RealScope</span>
          <span className="res-brand__sub">부동산 매물 스크래퍼</span>
        </div>

        <div className="res-bar__right">
          <span className={`res-live ${live ? "is-live" : "is-sample"}`}>
            <span className="res-live__dot" />
            {live ? "실시간 국토부 연동" : "샘플 데이터"}
          </span>
          <button type="button" className="res-tbtn" onClick={run} disabled={loading} title="다시 수집">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "res-spin" : ""}>
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            새로고침
          </button>
          <button type="button" className="res-tbtn res-tbtn--primary" onClick={run} disabled={loading}>
            {loading ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="res-spin">
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                </svg>
                수집 중…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                스크래핑 실행
              </>
            )}
          </button>
        </div>
      </div>

      <div className="lx-win__body res-body">
        {/* ── 필터/툴바 바 ── */}
        <div className="res-toolbar">
          <div className="res-toolbar__deals" role="tablist" aria-label="거래유형">
            <button type="button" className={`res-seg${deal === "전체" ? " is-on" : ""}`} onClick={() => setDeal("전체")}>
              전체
            </button>
            {DEALS.map((d) => (
              <button key={d} type="button" className={`res-seg${deal === d ? " is-on" : ""}`} onClick={() => setDeal(d)}>
                {d}
              </button>
            ))}
          </div>

          <div className="res-toolbar__fields">
            <label className="res-field">
              <span className="res-field__ico" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <select className="res-select" value={gu} onChange={(e) => setGu(e.target.value)} aria-label="지역">
                <option value="전체">전체 지역</option>
                {GU_LIST.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="res-field">
              <span className="res-field__ico" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <select className="res-select" value={priceBand} onChange={(e) => setPriceBand(e.target.value)} aria-label="가격대">
                {PRICE_BANDS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="res-field">
              <span className="res-field__ico" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 3v18" />
                </svg>
              </span>
              <select className="res-select" value={areaBand} onChange={(e) => setAreaBand(e.target.value)} aria-label="평형">
                {AREA_BANDS.map((a) => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className="res-field">
              <span className="res-field__ico" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l3 3M17 20l-3-3" />
                </svg>
              </span>
              <select className="res-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="정렬">
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* ── 통계 행 ── */}
        <div className="res-stats">
          <div className="res-stat">
            <span className="res-stat__ico res-stat__ico--v">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M6 21V9l6-4 6 4v12M10 21v-5h4v5" /></svg>
            </span>
            <div className="res-stat__body">
              <span className="res-stat__label">수집 매물</span>
              <span className="res-stat__value lx-mono">{stats.count}<em>건</em></span>
            </div>
          </div>
          <div className="res-stat">
            <span className="res-stat__ico res-stat__ico--g">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20" /></svg>
            </span>
            <div className="res-stat__body">
              <span className="res-stat__label">신규 등록</span>
              <span className="res-stat__value lx-mono">{stats.newCount}<em>건</em></span>
            </div>
          </div>
          <div className="res-stat">
            <span className="res-stat__ico res-stat__ico--r">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17 13.5 8.5 8.5 13.5 2 7" /><path d="M16 17h6v-6" /></svg>
            </span>
            <div className="res-stat__body">
              <span className="res-stat__label">가격 하락</span>
              <span className="res-stat__value lx-mono">{stats.downCount}<em>건</em></span>
            </div>
          </div>
          <div className="res-stat">
            <span className="res-stat__ico res-stat__ico--b">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </span>
            <div className="res-stat__body">
              <span className="res-stat__label">평균가</span>
              <span className="res-stat__value lx-mono res-stat__value--sm">{stats.avg === 0 ? "-" : eok(stats.avg)}</span>
            </div>
          </div>
        </div>

        {/* ── 메인 스플릿: 그리드 + 알림 ── */}
        <div className="res-main">
          {/* 매물 그리드 */}
          <section className="res-col">
            <div className="res-sech">
              <div className="res-sech__l">
                <h3 className="res-sech__title">매물 목록</h3>
                <span className="res-sech__count">{loading ? "수집 중…" : `${filtered.length}건`}</span>
              </div>
              {live && !loading && <span className="res-sech__tag">국토부 실거래 · {gu}</span>}
            </div>

            {loading ? (
              <div className="res-grid">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="res-card res-card--skel">
                    <div className="lx-skel res-card__thumb" />
                    <div className="res-card__pad">
                      <div className="lx-skel" style={{ height: 16, width: "60%", marginBottom: 10 }} />
                      <div className="lx-skel" style={{ height: 12, width: "80%", marginBottom: 8 }} />
                      <div className="lx-skel" style={{ height: 12, width: "50%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="res-empty">
                <div className="res-empty__ico" aria-hidden>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <p className="res-empty__title">조건에 맞는 매물이 없습니다</p>
                <p className="res-empty__sub">지역·가격대·평형 필터를 조정하거나 스크래핑을 다시 실행해 보세요.</p>
              </div>
            ) : (
              <div className="res-grid">
                {filtered.map((l) => {
                  const src = SOURCE_STYLE[l.source];
                  return (
                    <article key={l.id} className="res-card">
                      {/* AI 공간 예시 썸네일 */}
                      <div
                        className="res-card__thumb"
                        style={{ background: `linear-gradient(135deg, hsl(${l.hue} 62% 58%), hsl(${(l.hue + 40) % 360} 58% 42%))` }}
                      >
                        <DemoPhoto src={`/lab-img/realestate/p${l.hue % 3 + 1}.webp`} alt="AI 생성 주거 공간 예시 · 실제 매물 사진 아님" className="res-card__photo" />
                        <span className="res-card__image-label">AI 공간 예시</span>
                        <div aria-hidden className="res-card__glow" />
                        <div className="res-card__badges">
                          {l.isNew && <span className="res-badge res-badge--new">NEW</span>}
                          {l.change < 0 && (
                            <span className="res-badge res-badge--down">▼ {Math.abs(l.change).toLocaleString("ko-KR")}만</span>
                          )}
                          {l.change > 0 && (
                            <span className="res-badge res-badge--up">▲ {l.change.toLocaleString("ko-KR")}만</span>
                          )}
                        </div>
                        <span className="res-card__src" style={{ background: src.bg, color: src.fg }}>{l.source}</span>
                        <span className="res-card__name">{l.name}</span>
                      </div>

                      <div className="res-card__pad">
                        <div className="res-card__priceRow">
                          <b className="res-card__price lx-mono">{priceLabel(l)}</b>
                          <span className="res-deal">{l.deal}</span>
                        </div>
                        <div className="res-card__spec">
                          {l.source === "국토부 실거래"
                            ? `전용 ${l.area}㎡ · ${pyeong(l.area)}평 · ${l.floor}층`
                            : `${l.area}평 · ${l.floor}/${l.totalFloor}층`}
                        </div>
                        <div className="res-card__loc">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                          {l.gu} · {l.complex}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* 사이드: 알림 + 소스 현황 */}
          <aside className="res-side">
            <div className="res-sech">
              <div className="res-sech__l">
                <h3 className="res-sech__title">신규 · 변동 알림</h3>
              </div>
              <span className="res-sech__live"><span className="res-sech__livedot" />실시간</span>
            </div>

            <div className="res-feed">
              {ALERTS.map((a, i) => (
                <div key={i} className={`res-feed__item res-feed__item--${a.tone}`}>
                  <span className="res-feed__ico">{a.icon}</span>
                  <div className="res-feed__body">
                    <div className="res-feed__text">{a.text}</div>
                    <div className="res-feed__ago">{a.ago}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="res-sech" style={{ marginTop: 22 }}>
              <div className="res-sech__l">
                <h3 className="res-sech__title">수집 소스 현황</h3>
              </div>
            </div>
            <div className="res-sources">
              {live ? (
                <div className="res-srow">
                  <span className="res-srow__dot" style={{ background: SOURCE_STYLE["국토부 실거래"].fg }} />
                  <span className="res-srow__name">국토부 실거래</span>
                  <span className="res-srow__count lx-mono">{rows.length}</span>
                  <span className="res-srow__status">완료</span>
                </div>
              ) : (
                (["네이버", "직방", "다방"] as Source[]).map((s) => {
                  const n = rows.filter((l) => l.source === s).length;
                  return (
                    <div key={s} className="res-srow">
                      <span className="res-srow__dot" style={{ background: SOURCE_STYLE[s].fg }} />
                      <span className="res-srow__name">{s}</span>
                      <span className="res-srow__count lx-mono">{n}</span>
                      <span className="res-srow__status">완료</span>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ── 스코프드 스타일 (res- 프리픽스, 공유파일 미변경) ────── */
const RES_CSS = `
.res.lx-win { box-shadow: 0 18px 50px -30px rgba(20,20,50,0.35); }

/* 툴바 */
.res-bar { padding: 0 16px; min-height: 56px; background: linear-gradient(180deg,#fff,#fbfbff); }
.res-brand { display: flex; align-items: center; gap: 9px; min-width: 0; }
.res-brand__logo { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9px; color: #fff; background: linear-gradient(135deg,#6b62f2,#8a63f0); box-shadow: 0 6px 14px -6px rgba(107,98,242,0.7); }
.res-brand__name { font-family: var(--font-geist); font-weight: 800; font-size: 15px; color: var(--color-ink); letter-spacing: -0.01em; }
.res-brand__sub { font-size: 12px; color: var(--color-slate); border-left: 1px solid var(--color-hairline-strong); padding-left: 9px; white-space: nowrap; }
.res-bar__right { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }

.res-live { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; border-radius: 20px; padding: 5px 11px; }
.res-live.is-live { color: #1f9d57; background: #e7f7ee; }
.res-live.is-sample { color: var(--color-slate); background: var(--color-tint); }
.res-live__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.res-live.is-live .res-live__dot { animation: res-pulse 1.6s ease-in-out infinite; }
@keyframes res-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(31,157,87,0.5); } 50% { box-shadow: 0 0 0 5px rgba(31,157,87,0); } }

.res-tbtn, .res-tbtn.res-tbtn { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-geist); font-size: 13px; font-weight: 700; cursor: pointer; border-radius: 9px; padding: 8px 13px; border: 1px solid var(--color-hairline-strong); background: #fff; color: var(--color-ink); transition: background .15s ease, filter .15s ease, transform .1s ease; }
.res-tbtn:hover:not(:disabled) { background: var(--color-tint); }
.res-tbtn--primary { background: linear-gradient(135deg,#6b62f2,#7d63f0); color: #fff; border-color: transparent; box-shadow: 0 8px 18px -10px rgba(107,98,242,0.8); }
.res-tbtn--primary:hover:not(:disabled) { filter: brightness(1.07); }
.res-tbtn:active:not(:disabled) { transform: translateY(1px); }
.res-tbtn:disabled { opacity: .6; cursor: not-allowed; }
.res-spin { animation: res-rot 0.9s linear infinite; }
@keyframes res-rot { to { transform: rotate(360deg); } }

/* 본문 */
.res-body { padding: 18px; background: linear-gradient(180deg,#fafaff,#fff 140px); }

/* 필터 툴바 */
.res-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; background: #fff; border: 1px solid var(--color-hairline); border-radius: 14px; padding: 12px 14px; margin-bottom: 14px; box-shadow: 0 4px 14px -12px rgba(20,20,50,0.25); }
.res-toolbar__deals { display: inline-flex; gap: 3px; background: var(--color-tint); border-radius: 10px; padding: 3px; }
.res-seg { font-family: var(--font-geist); font-size: 13px; font-weight: 700; color: var(--color-slate); cursor: pointer; border: none; background: transparent; border-radius: 8px; padding: 7px 15px; transition: all .15s ease; }
.res-seg.is-on { background: #fff; color: var(--color-dusk-violet); box-shadow: 0 2px 6px -2px rgba(20,20,50,0.18); }
.res-seg:not(.is-on):hover { color: var(--color-ash); }

.res-toolbar__fields { display: flex; gap: 8px; flex-wrap: wrap; }
.res-field { position: relative; display: inline-flex; align-items: center; }
.res-field__ico { position: absolute; left: 11px; color: var(--color-slate); pointer-events: none; display: inline-flex; }
.res-select { font-family: var(--font-dm-sans); font-size: 13.5px; font-weight: 600; color: var(--color-ink); background: #fff; border: 1px solid var(--color-hairline-strong); border-radius: 10px; padding: 9px 30px 9px 32px; outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b8b9a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; transition: border-color .15s ease, box-shadow .15s ease; }
.res-select:focus { border-color: var(--color-dusk-violet); box-shadow: 0 0 0 3px rgba(107,98,242,0.15); }
.res-select:hover { border-color: var(--color-slate); }

/* 통계 */
.res-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
.res-stat { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid var(--color-hairline); border-radius: 14px; padding: 14px 16px; box-shadow: 0 4px 14px -12px rgba(20,20,50,0.25); }
.res-stat__ico { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 11px; flex: 0 0 auto; }
.res-stat__ico--v { color: #6b62f2; background: #eeecfe; }
.res-stat__ico--g { color: #1f9d57; background: #e7f7ee; }
.res-stat__ico--r { color: #d64545; background: #fdeaea; }
.res-stat__ico--b { color: #2f6bd6; background: #e8f0fd; }
.res-stat__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.res-stat__label { font-size: 12px; color: var(--color-slate); }
.res-stat__value { font-family: var(--font-geist); font-size: 24px; font-weight: 800; color: var(--color-ink); line-height: 1.05; }
.res-stat__value em { font-style: normal; font-size: 13px; font-weight: 700; color: var(--color-slate); margin-left: 2px; }
.res-stat__value--sm { font-size: 18px; }

/* 메인 스플릿 */
.res-main { display: grid; grid-template-columns: minmax(0,1fr) 316px; gap: 18px; align-items: start; }

/* 섹션 헤더 */
.res-sech { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
.res-sech__l { display: flex; align-items: baseline; gap: 9px; }
.res-sech__title { font-family: var(--font-geist); font-size: 15px; font-weight: 800; color: var(--color-ink); margin: 0; letter-spacing: -0.01em; }
.res-sech__count { font-size: 12.5px; font-weight: 700; color: var(--color-dusk-violet); background: var(--color-violet-soft); border-radius: 20px; padding: 2px 9px; }
.res-sech__tag { font-size: 11.5px; font-weight: 700; color: #3a4a63; background: #eef0f5; border-radius: 20px; padding: 3px 10px; }
.res-sech__live { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #1f9d57; }
.res-sech__livedot { width: 7px; height: 7px; border-radius: 50%; background: #1f9d57; animation: res-pulse 1.6s ease-in-out infinite; }

/* 그리드 */
.res-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }

/* 카드 */
.res-card { background: #fff; border: 1px solid var(--color-hairline); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
.res-card:not(.res-card--skel):hover { transform: translateY(-4px); box-shadow: 0 16px 30px -18px rgba(20,20,50,0.4); border-color: var(--color-hairline-strong); }
.res-card__thumb { position: relative; height: 108px; display: flex; align-items: flex-end; padding: 11px; overflow: hidden; }
.res-card__grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px); background-size: 24px 24px; }
.res-card__photo { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.res-card__image-label { position:absolute; bottom:8px; right:8px; z-index:1; color:#fff; background:#14132b99; font-size:9px; padding:2px 5px; border-radius:4px; }
.res-card__glow { position:absolute; inset:0; background:linear-gradient(transparent 35%,#0009); }
.res-card__name { position: relative; color: #fff; font-family: var(--font-geist); font-weight: 800; font-size: 14.5px; text-shadow: 0 1px 4px rgba(0,0,0,0.4); line-height: 1.2; }
.res-card__badges { position: absolute; top: 9px; left: 9px; display: flex; gap: 5px; flex-wrap: wrap; }
.res-badge { font-size: 10.5px; font-weight: 800; border-radius: 7px; padding: 3px 7px; letter-spacing: 0.02em; box-shadow: 0 2px 6px -2px rgba(0,0,0,0.3); }
.res-badge--new { color: #1f8a3b; background: rgba(255,255,255,0.95); }
.res-badge--down { color: #d64545; background: rgba(255,255,255,0.95); }
.res-badge--up { color: #c98a12; background: rgba(255,255,255,0.95); }
.res-card__src { position: absolute; top: 9px; right: 9px; font-size: 10.5px; font-weight: 800; border-radius: 7px; padding: 3px 8px; box-shadow: 0 2px 6px -2px rgba(0,0,0,0.25); }
.res-card__pad { padding: 12px 13px 13px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.res-card__priceRow { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.res-card__price { font-size: 17px; font-weight: 800; color: var(--color-ink); }
.res-deal { font-size: 11px; font-weight: 700; color: var(--color-slate); background: var(--color-tint); border-radius: 6px; padding: 2px 8px; }
.res-card__spec { font-size: 12.5px; color: var(--color-ash); }
.res-card__loc { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-slate); }
.res-card__loc svg { flex: 0 0 auto; opacity: .8; }

/* 스켈레톤 */
.res-card--skel .res-card__thumb { padding: 0; }
.res-card--skel { pointer-events: none; }

/* 빈 상태 */
.res-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 54px 20px; background: #fff; border: 1px dashed var(--color-hairline-strong); border-radius: 14px; }
.res-empty__ico { display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: 16px; color: var(--color-slate); background: var(--color-tint); margin-bottom: 14px; }
.res-empty__title { font-family: var(--font-geist); font-size: 15px; font-weight: 800; color: var(--color-ink); margin: 0 0 6px; }
.res-empty__sub { font-size: 13px; color: var(--color-slate); margin: 0; max-width: 340px; line-height: 1.5; }

/* 사이드 */
.res-side { position: sticky; top: 66px; }
.res-feed { background: #fff; border: 1px solid var(--color-hairline); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px -12px rgba(20,20,50,0.25); }
.res-feed__item { display: flex; gap: 11px; align-items: flex-start; padding: 12px 13px; border-bottom: 1px solid var(--color-tint); position: relative; }
.res-feed__item:last-child { border-bottom: none; }
.res-feed__item::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.res-feed__item--new::before { background: #1f9d57; }
.res-feed__item--down::before { background: #d64545; }
.res-feed__item--up::before { background: #c98a12; }
.res-feed__ico { font-size: 13px; line-height: 1.5; flex: 0 0 auto; }
.res-feed__body { flex: 1; min-width: 0; }
.res-feed__text { font-size: 12.5px; color: var(--color-ink); line-height: 1.45; }
.res-feed__ago { font-size: 11px; color: var(--color-slate); margin-top: 3px; }

/* 소스 현황 */
.res-sources { background: #fff; border: 1px solid var(--color-hairline); border-radius: 14px; padding: 6px 4px; box-shadow: 0 4px 14px -12px rgba(20,20,50,0.25); }
.res-srow { display: flex; align-items: center; gap: 9px; padding: 10px 11px; border-radius: 9px; }
.res-srow:hover { background: #fafaff; }
.res-srow__dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
.res-srow__name { font-family: var(--font-geist); font-size: 13px; font-weight: 700; color: var(--color-ink); flex: 1; }
.res-srow__count { font-size: 13px; font-weight: 700; color: var(--color-ash); }
.res-srow__status { font-size: 11px; font-weight: 700; color: #1f9d57; background: #e7f7ee; border-radius: 20px; padding: 2px 9px; }

/* 반응형 */
@media (max-width: 980px) {
  .res-main { grid-template-columns: 1fr; }
  .res-side { position: static; }
}
@media (max-width: 720px) {
  .res-stats { grid-template-columns: repeat(2, 1fr); }
  .res-brand__sub { display: none; }
}
@media (max-width: 560px) {
  .res-toolbar { align-items: stretch; }
  .res-toolbar__deals { justify-content: space-between; }
  .res-select { flex: 1; }
  .res-field { flex: 1 1 130px; }
  .res-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .res-bar__right .res-tbtn:not(.res-tbtn--primary) { display: none; }
}
`;
