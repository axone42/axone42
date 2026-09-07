"use client";

import { useEffect, useMemo, useState } from "react";

/* ---------- 옵션 정의 ---------- */
const INDUSTRIES = ["IT·소프트웨어", "제조", "서비스", "바이오·헬스", "유통·물류", "전체"] as const;
type Industry = (typeof INDUSTRIES)[number];

const STAGES = ["예비창업", "초기창업(3년 이내)", "중소기업"] as const;
type Stage = (typeof STAGES)[number];

const REGIONS = ["전국", "서울", "경기·인천", "부산·경남", "대전·충청", "광주·호남", "대구·경북"] as const;
type Region = (typeof REGIONS)[number];

const INTERESTS = ["R&D", "수출", "고용", "시설·설비"] as const;
type Interest = (typeof INTERESTS)[number];

/* ---------- 데이터 모델 (고정 시드 — 렌더 시 무작위 없음) ---------- */
type Grant = {
  id: string;
  name: string;
  org: string;
  amount: string;
  // 마감까지 남은 일수(고정) — 하이드레이션 안전용 기준값
  daysLeft: number;
  industries: Industry[];
  stages: Stage[];
  regions: Region[];
  interests: Interest[];
  target: string;
  content: string;
  how: string;
};

const GRANTS: Grant[] = [
  {
    id: "g1",
    name: "창업성장기술개발사업 (디딤돌)",
    org: "중소벤처기업부 · 창업진흥원",
    amount: "최대 1.2억원",
    daysLeft: 6,
    industries: ["IT·소프트웨어", "바이오·헬스"],
    stages: ["예비창업", "초기창업(3년 이내)"],
    regions: ["전국"],
    interests: ["R&D"],
    target: "업력 7년 이하 창업기업 및 예비창업자",
    content: "혁신 제품·서비스 개발에 필요한 R&D 자금과 시제품 제작비를 지원합니다.",
    how: "K-Startup 포털 온라인 접수 → 서면·대면 평가 → 협약 체결",
  },
  {
    id: "g2",
    name: "수출바우처 지원사업",
    org: "산업통상자원부 · KOTRA",
    amount: "최대 5,000만원",
    daysLeft: 12,
    industries: ["제조", "IT·소프트웨어", "유통·물류"],
    stages: ["초기창업(3년 이내)", "중소기업"],
    regions: ["전국"],
    interests: ["수출"],
    target: "수출 실적 보유 또는 수출 희망 중소·중견기업",
    content: "해외 마케팅, 바이어 발굴, 통번역, 인증 등 수출 서비스를 바우처로 지원합니다.",
    how: "수출바우처 누리집 신청 → 수출역량 진단 → 서비스 메뉴판 이용",
  },
  {
    id: "g3",
    name: "청년 일자리 도약 장려금",
    org: "고용노동부",
    amount: "1인당 최대 720만원",
    daysLeft: 3,
    industries: ["서비스", "제조", "유통·물류"],
    stages: ["중소기업"],
    regions: ["전국"],
    interests: ["고용"],
    target: "취업애로 청년을 정규직 채용한 5인 이상 우선지원대상기업",
    content: "청년 정규직 채용 시 인건비를 최대 2년간 분할 지원합니다.",
    how: "고용24 사업 신청 → 채용 → 6개월 근속 후 장려금 신청",
  },
  {
    id: "g4",
    name: "스마트공장 구축·고도화 지원",
    org: "중소벤처기업부 · 스마트제조혁신추진단",
    amount: "최대 1억원 (50% 매칭)",
    daysLeft: 21,
    industries: ["제조"],
    stages: ["중소기업"],
    regions: ["전국"],
    interests: ["시설·설비", "R&D"],
    target: "제조 현장을 보유한 중소·중견 제조기업",
    content: "생산 설비에 IoT·MES 등 스마트 솔루션을 도입해 생산성을 높입니다.",
    how: "스마트공장 사업관리시스템 접수 → 진단 → 공급기업 매칭 → 구축",
  },
  {
    id: "g5",
    name: "예비창업패키지",
    org: "중소벤처기업부 · 창업진흥원",
    amount: "최대 1억원",
    daysLeft: 9,
    industries: ["IT·소프트웨어", "바이오·헬스", "서비스"],
    stages: ["예비창업"],
    regions: ["전국"],
    interests: ["R&D", "시설·설비"],
    target: "사업자등록 이력이 없는 예비창업자",
    content: "사업화 자금, 창업교육, 전담 멘토링을 패키지로 제공합니다.",
    how: "K-Startup 신청 → 사업계획 발표평가 → 선정 후 협약",
  },
  {
    id: "g6",
    name: "지역 중소기업 육성자금 (융자)",
    org: "각 지자체 · 지역신용보증재단",
    amount: "최대 3억원 융자",
    daysLeft: 30,
    industries: ["제조", "서비스", "유통·물류"],
    stages: ["초기창업(3년 이내)", "중소기업"],
    regions: ["서울", "경기·인천", "부산·경남", "대전·충청"],
    interests: ["시설·설비"],
    target: "관내 사업장을 둔 중소기업 및 소상공인",
    content: "운전·시설 자금을 저리로 융자하고 이차보전을 지원합니다.",
    how: "지자체 공고 확인 → 보증재단 상담 → 추천서 발급 → 은행 실행",
  },
  {
    id: "g7",
    name: "바이오·헬스 사업화 R&D",
    org: "보건복지부 · 한국보건산업진흥원",
    amount: "최대 2억원",
    daysLeft: 15,
    industries: ["바이오·헬스"],
    stages: ["초기창업(3년 이내)", "중소기업"],
    regions: ["전국"],
    interests: ["R&D"],
    target: "의료기기·디지털헬스 분야 중소기업",
    content: "임상·인허가 및 사업화 연계 R&D 비용을 지원합니다.",
    how: "범부처 통합연구지원시스템 접수 → 평가 → 협약",
  },
  {
    id: "g8",
    name: "소상공인 스마트상점 기술보급",
    org: "중소벤처기업부 · 소상공인시장진흥공단",
    amount: "최대 500만원",
    daysLeft: 5,
    industries: ["서비스", "유통·물류"],
    stages: ["중소기업"],
    regions: ["전국"],
    interests: ["시설·설비"],
    target: "상시근로자 5인 미만 소상공인",
    content: "키오스크, 스마트오더 등 비대면 상점 기술 도입비를 지원합니다.",
    how: "소상공인마당 신청 → 공급기업 선택 → 설치 후 정산",
  },
];

/* ---------- 매칭 점수 (결정적 계산) ---------- */
type Filters = {
  industry: Industry;
  stage: Stage;
  region: Region;
  interests: Interest[];
};

function scoreOf(g: Grant, f: Filters): number {
  let score = 40; // 기본점

  // 업종
  if (f.industry === "전체" || g.industries.includes(f.industry)) score += 22;
  else score -= 18;

  // 규모
  if (g.stages.includes(f.stage)) score += 18;
  else score -= 14;

  // 지역
  if (g.regions.includes("전국") || g.regions.includes(f.region) || f.region === "전국") score += 12;
  else score -= 12;

  // 관심 분야 — 겹치는 개수에 비례
  if (f.interests.length > 0) {
    const overlap = g.interests.filter((i) => f.interests.includes(i)).length;
    score += overlap * 9;
    if (overlap === 0) score -= 8;
  } else {
    score += 4;
  }

  // 마감 임박 소폭 가점(추천 우선 노출)
  if (g.daysLeft <= 7) score += 3;

  return Math.max(12, Math.min(99, score));
}

function pillClassForDays(d: number): string {
  if (d <= 3) return "lx-pill--danger";
  if (d <= 7) return "lx-pill--warn";
  return "lx-pill--info";
}

function scoreColor(s: number): string {
  if (s >= 80) return "#1f9d57";
  if (s >= 60) return "#2f6bd6";
  if (s >= 45) return "#c98a12";
  return "#8b8b9a";
}

/* ---------- 실시간(기업마당) 데이터 모델 ---------- */
type LiveGrant = {
  title: string;
  agency: string;
  period: string;
  field: string;
  url: string;
  summary: string;
};

// 실시간 공고에 대해 선택 필터 기반의 결정적 관련도 점수(하이드레이션 안전).
function liveScore(g: LiveGrant, f: Filters): number {
  let score = 45;
  const hay = `${g.title} ${g.field} ${g.summary} ${g.agency}`;

  if (f.industry !== "전체" && hay.includes(f.industry.split("·")[0])) score += 16;
  if (hay.includes(f.region) && f.region !== "전국") score += 10;
  if (f.region === "전국") score += 4;

  const interestHints: Record<Interest, string[]> = {
    "R&D": ["R&D", "기술", "개발", "연구"],
    수출: ["수출", "해외", "글로벌"],
    고용: ["고용", "일자리", "채용", "인력"],
    "시설·설비": ["시설", "설비", "구축", "장비"],
  };
  for (const it of f.interests) {
    if (interestHints[it].some((w) => hay.includes(w))) score += 8;
  }

  return Math.max(20, Math.min(99, score));
}

/* ---------- 스코프 스타일 (이 데모 전용, .gsf 네임스페이스) ---------- */
const GSF_CSS = `
.gsf { display: flex; flex-direction: column; }
.gsf-toolbar { min-height: 56px; background: linear-gradient(180deg, #fff, #fcfcff); }
.gsf-brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
.gsf-brand__mark {
  width: 34px; height: 34px; flex: 0 0 34px; display: inline-flex; align-items: center; justify-content: center;
  font-size: 18px; border-radius: 9px; background: var(--color-violet-soft);
  box-shadow: inset 0 0 0 1px rgba(107,98,242,0.18);
}
.gsf-brand__wrap { display: flex; flex-direction: column; line-height: 1.1; min-width: 0; }
.gsf-brand__title { font-family: var(--font-geist); font-weight: 800; font-size: 15px; color: var(--color-ink); }
.gsf-brand__sub { font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-slate); }
.gsf-toolbar__right { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }

.gsf-live {
  display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700;
  color: var(--color-slate); background: var(--color-tint); border: 1px solid var(--color-hairline);
  border-radius: 20px; padding: 4px 11px 4px 9px;
}
.gsf-live__dot { width: 7px; height: 7px; border-radius: 50%; background: #b8b8cc; }
.gsf-live.is-live { color: #1f9d57; background: #e7f7ee; border-color: rgba(31,157,87,0.25); }
.gsf-live.is-live .gsf-live__dot { background: #1f9d57; box-shadow: 0 0 0 0 rgba(31,157,87,0.5); animation: gsfPulse 1.8s infinite; }
@keyframes gsfPulse { 0% { box-shadow: 0 0 0 0 rgba(31,157,87,0.45); } 70% { box-shadow: 0 0 0 6px rgba(31,157,87,0); } 100% { box-shadow: 0 0 0 0 rgba(31,157,87,0); } }

.gsf-refresh {
  display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-geist);
  font-size: 12.5px; font-weight: 700; color: var(--color-ash); cursor: pointer;
  background: #fff; border: 1px solid var(--color-hairline-strong); border-radius: 9px; padding: 6px 12px;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.gsf-refresh:hover:not(:disabled) { background: var(--color-tint); color: var(--color-ink); border-color: var(--color-slate); }
.gsf-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.gsf-refresh__icon { font-size: 14px; line-height: 1; display: inline-block; }
.gsf-refresh__icon.is-spin { animation: gsfSpin 0.9s linear infinite; }
@keyframes gsfSpin { to { transform: rotate(360deg); } }

.gsf-body { padding: 20px; background:
  radial-gradient(120% 90% at 100% 0%, rgba(107,98,242,0.05), transparent 60%),
  var(--color-void-canvas);
}

.gsf-layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
.gsf-rail { position: sticky; top: 16px; display: flex; flex-direction: column; gap: 14px; }

.gsf-filters { padding: 16px 16px 18px; }
.gsf-filters .lx-h { margin-bottom: 4px; }
.gsf-filters__hint { margin: 0 0 14px; font-size: 12px; line-height: 1.5; color: var(--color-slate); }
.gsf-field { margin-bottom: 13px; }
.gsf-field:last-of-type { margin-bottom: 0; }
.gsf-chips { display: flex; gap: 7px; flex-wrap: wrap; }
.gsf-chips .lx-toggle { padding: 6px 12px; font-size: 12.5px; }
.gsf-run { width: 100%; margin-top: 16px; }

.gsf-stats { display: grid; grid-template-columns: 1fr; gap: 10px; }
.gsf-stat { padding: 13px 14px; position: relative; overflow: hidden; }
.gsf-stat::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--color-hairline-strong); }
.gsf-stat:nth-child(1)::before { background: #1f9d57; }
.gsf-stat:nth-child(2)::before { background: #d64545; }
.gsf-stat:nth-child(3)::before { background: var(--color-dusk-violet); }
.gsf-stat .lx-stat__value { font-size: 20px; }

.gsf-results { min-width: 0; }
.gsf-results__head { margin-bottom: 14px; }
.gsf-count {
  display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px;
  margin-left: 8px; padding: 0 6px; font-size: 11.5px; font-weight: 800; color: var(--color-dusk-violet);
  background: var(--color-violet-soft); border-radius: 20px; vertical-align: middle;
}

.gsf-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.gsf-card {
  transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease;
  cursor: pointer; display: flex; flex-direction: column;
}
.gsf-card:hover { border-color: rgba(107,98,242,0.45); box-shadow: 0 12px 26px -18px rgba(30,25,90,0.35); transform: translateY(-2px); }
.gsf-card:focus-visible { outline: none; border-color: var(--color-dusk-violet); box-shadow: 0 0 0 3px rgba(107,98,242,0.18); }
.gsf-card.is-open { border-color: rgba(107,98,242,0.5); box-shadow: 0 12px 26px -18px rgba(30,25,90,0.32); }
.gsf-card--skel { cursor: default; }
.gsf-card--skel:hover { transform: none; box-shadow: none; border-color: var(--color-hairline); }

@media (max-width: 1080px) {
  .gsf-layout { grid-template-columns: 1fr; }
  .gsf-rail { position: static; }
}
@media (max-width: 620px) {
  .gsf-cards { grid-template-columns: 1fr; }
  .gsf-body { padding: 14px; }
}
`;

export default function Demo() {
  const [industry, setIndustry] = useState<Industry>("IT·소프트웨어");
  const [stage, setStage] = useState<Stage>("초기창업(3년 이내)");
  const [region, setRegion] = useState<Region>("서울");
  const [interests, setInterests] = useState<Interest[]>(["R&D"]);

  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // 실시간(기업마당) 결과 상태 — 최초 렌더는 시뮬레이션.
  const [live, setLive] = useState(false);
  const [liveGrants, setLiveGrants] = useState<LiveGrant[]>([]);

  // 하이드레이션 안전: 마운트 여부에 따라 D-day 표기.
  // 초기 렌더는 고정 "D-{daysLeft}", 마운트 후에도 동일 시드값을 사용해 라벨만 명확화.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const filters: Filters = { industry, stage, region, interests };

  const ranked = useMemo(() => {
    return GRANTS.map((g) => ({ g, score: scoreOf(g, filters) }))
      .sort((a, b) => b.score - a.score || a.g.daysLeft - b.g.daysLeft)
      .slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, stage, region, interests]);

  // 실시간 공고를 관련도 순으로 정렬 (결정적)
  const rankedLive = useMemo(() => {
    return liveGrants
      .map((g, idx) => ({ g, score: liveScore(g, filters), id: `live-${idx}` }))
      .sort((a, b) => b.score - a.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveGrants, industry, stage, region, interests]);

  const showLive = live && rankedLive.length > 0;

  const dLabel = (d: number) => (mounted ? `D-${d}` : `D-${d}`);

  // 실시간 공고 신청기간 문자열에서 마감일(D-day) 계산. 마운트 후에만 Date 사용.
  const dLabelLive = (period: string): string => {
    const digits = period.match(/(\d{4})[.\-\/]?(\d{2})[.\-\/]?(\d{2})/g);
    if (!mounted || !digits || digits.length === 0) return "상시";
    const last = digits[digits.length - 1].replace(/[.\-\/]/g, "");
    const y = Number(last.slice(0, 4));
    const mo = Number(last.slice(4, 6)) - 1;
    const d = Number(last.slice(6, 8));
    const end = new Date(y, mo, d);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.round((end.getTime() - now.getTime()) / 86400000);
    if (diff < 0) return "마감";
    if (diff === 0) return "D-DAY";
    return `D-${diff}`;
  };

  const livePillClass = (period: string): string => {
    const label = dLabelLive(period);
    const m = label.match(/D-(\d+)/);
    if (label === "D-DAY" || (m && Number(m[1]) <= 3)) return "lx-pill--danger";
    if (m && Number(m[1]) <= 7) return "lx-pill--warn";
    return "lx-pill--info";
  };

  // 스탯 (결정적)
  const totalCollected = showLive ? liveGrants.length : GRANTS.length * 47 + 12; // 수집된 공고
  const closingSoon = showLive
    ? rankedLive.filter((r) => {
        const m = dLabelLive(r.g.period).match(/D-(\d+)/);
        return (m && Number(m[1]) <= 7) || dLabelLive(r.g.period) === "D-DAY";
      }).length
    : GRANTS.filter((g) => g.daysLeft <= 7).length;
  const matchedCount = showLive
    ? rankedLive.filter((r) => r.score >= 60).length
    : ranked.filter((r) => r.score >= 60).length;

  const toggleInterest = (i: Interest) => {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const run = async () => {
    setLoading(true);
    setExpanded(null);
    try {
      const res = await fetch("/api/lab/gov-support-finder", { method: "POST" });
      const data = (await res.json()) as { live?: boolean; grants?: LiveGrant[] };
      if (data.live && Array.isArray(data.grants) && data.grants.length) {
        setLiveGrants(data.grants);
        setLive(true);
      } else {
        setLiveGrants([]);
        setLive(false);
      }
    } catch {
      setLiveGrants([]);
      setLive(false);
    } finally {
      setLoading(false);
    }
  };

  const resultCount = showLive ? rankedLive.length : ranked.length;

  return (
    <div className="lx-win gsf">
      <style>{GSF_CSS}</style>
      {/* 실제 앱 툴바 */}
      <div className="lx-win__bar gsf-toolbar">
        <div className="gsf-brand">
          <span className="gsf-brand__mark" aria-hidden>🏛️</span>
          <span className="gsf-brand__wrap">
            <span className="gsf-brand__title">지원사업 파인더</span>
            <span className="gsf-brand__sub">GovGrant Finder</span>
          </span>
        </div>
        <div className="gsf-toolbar__right">
          <span className={`gsf-live ${showLive ? "is-live" : ""}`}>
            <span className="gsf-live__dot" aria-hidden />
            {showLive ? "실시간 기업마당" : "샘플 데이터"}
          </span>
          <button
            type="button"
            className="gsf-refresh"
            onClick={run}
            disabled={loading}
            title="최신 공고 다시 불러오기"
          >
            <span className={`gsf-refresh__icon ${loading ? "is-spin" : ""}`} aria-hidden>↻</span>
            {loading ? "불러오는 중" : "새로고침"}
          </button>
        </div>
      </div>

      <div className="lx-win__body gsf-body">
        <div className="gsf-layout">
          {/* ===== 왼쪽: 필터 + 스탯 레일 (sticky) ===== */}
          <aside className="gsf-rail">
            {/* 필터 패널 */}
            <div className="lx-panel gsf-filters">
              <div className="lx-h">
                <span>내 조건 입력</span>
              </div>
              <p className="gsf-filters__hint">조건을 바꾸면 추천이 실시간으로 재정렬됩니다.</p>

              <div className="gsf-field">
                <label className="lx-label">업종</label>
                <select className="lx-select" value={industry} onChange={(e) => setIndustry(e.target.value as Industry)}>
                  {INDUSTRIES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="gsf-field">
                <label className="lx-label">기업 규모</label>
                <select className="lx-select" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
                  {STAGES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="gsf-field">
                <label className="lx-label">지역</label>
                <select className="lx-select" value={region} onChange={(e) => setRegion(e.target.value as Region)}>
                  {REGIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="gsf-field">
                <label className="lx-label">관심 분야</label>
                <div className="gsf-chips">
                  {INTERESTS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      className={`lx-toggle${interests.includes(i) ? " is-on" : ""}`}
                      onClick={() => toggleInterest(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="lx-btn lx-btn--primary gsf-run"
                onClick={run}
                disabled={loading}
              >
                {loading ? "매칭 분석 중…" : "✦ 맞춤 추천 실행"}
              </button>
            </div>

            {/* 요약 스탯 */}
            <div className="gsf-stats">
              <div className="lx-stat gsf-stat">
                <span className="lx-stat__label">수집된 공고 수</span>
                <span className="lx-stat__value lx-mono">{totalCollected.toLocaleString()}건</span>
                <span className="lx-stat__delta lx-up">▲ 자동 수집 · 매일 갱신</span>
              </div>
              <div className="lx-stat gsf-stat">
                <span className="lx-stat__label">마감 임박 (7일 이내)</span>
                <span className="lx-stat__value lx-mono" style={{ color: "#d64545" }}>
                  {closingSoon}건
                </span>
                <span className="lx-stat__delta lx-down">서두르면 지원 가능</span>
              </div>
              <div className="lx-stat gsf-stat">
                <span className="lx-stat__label">내 조건 매칭 수</span>
                <span className="lx-stat__value lx-mono" style={{ color: "var(--color-dusk-violet)" }}>
                  {matchedCount}건
                </span>
                <span className="lx-stat__delta" style={{ color: "var(--color-slate)" }}>
                  매칭 60% 이상 기준
                </span>
              </div>
            </div>
          </aside>

          {/* ===== 오른쪽: 추천 결과 ===== */}
          <section className="gsf-results">
            <div className="lx-h gsf-results__head">
              <span>
                맞춤 추천 사업
                {!loading && <span className="gsf-count">{resultCount}</span>}
              </span>
              <span className="lx-sub">{showLive ? "기업마당 실시간 공고 · 관련도 순" : "매칭 점수 순 정렬"}</span>
            </div>

            {loading ? (
          <div className="lx-grid gsf-cards">
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <div key={k} className="lx-card gsf-card gsf-card--skel">
                <div className="lx-skel" style={{ height: 16, width: "60%", marginBottom: 12 }} />
                <div className="lx-skel" style={{ height: 12, width: "40%", marginBottom: 14 }} />
                <div className="lx-skel" style={{ height: 8, marginBottom: 10 }} />
                <div className="lx-skel" style={{ height: 12, width: "80%" }} />
              </div>
            ))}
          </div>
        ) : showLive ? (
          <div className="lx-grid gsf-cards">
            {rankedLive.map(({ g, score, id }) => {
              const open = expanded === id;
              const dl = dLabelLive(g.period);
              return (
                <div
                  key={id}
                  className={`lx-card gsf-card${open ? " is-open" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpanded(open ? null : id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpanded(open ? null : id);
                    }
                  }}
                  style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <b style={{ fontFamily: "var(--font-geist)", fontSize: 14.5, color: "var(--color-ink)", lineHeight: 1.35 }}>
                      {g.title}
                    </b>
                    <span className={`lx-pill ${livePillClass(g.period)}`} style={{ flexShrink: 0 }}>
                      {dl}
                    </span>
                  </div>

                  <div className="lx-muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                    {g.agency || "주관기관 미상"}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0 12px", fontSize: 12.5 }}>
                    {g.field && <span className="lx-pill lx-pill--muted">🏷️ {g.field}</span>}
                    {g.period && <span className="lx-pill lx-pill--muted">🗓️ {g.period}</span>}
                  </div>

                  {/* 관련도 점수 바 */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                      <span className="lx-muted">내 조건 관련도</span>
                      <b className="lx-mono" style={{ color: scoreColor(score) }}>
                        매칭 {score}%
                      </b>
                    </div>
                    <div className="lx-track">
                      <span className="lx-fill" style={{ width: `${score}%`, background: scoreColor(score) }} />
                    </div>
                  </div>

                  {open && (
                    <div
                      style={{
                        borderTop: "1px dashed var(--color-hairline-strong)",
                        marginTop: 4,
                        paddingTop: 12,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "var(--color-ash)",
                      }}
                    >
                      <p style={{ margin: "0 0 8px" }}>
                        <b style={{ color: "var(--color-ink)" }}>지원분야</b>
                        <br />
                        {g.field || "정보 없음"}
                      </p>
                      <p style={{ margin: "0 0 8px" }}>
                        <b style={{ color: "var(--color-ink)" }}>사업개요</b>
                        <br />
                        {g.summary || "요약 정보가 제공되지 않았습니다. 상세 보기에서 원문을 확인하세요."}
                      </p>
                      <p style={{ margin: "0 0 8px" }}>
                        <b style={{ color: "var(--color-ink)" }}>신청기간</b>
                        <br />
                        {g.period || "상시"}
                      </p>
                      <a
                        href={g.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lx-btn lx-btn--primary"
                        style={{ display: "inline-block", padding: "8px 14px", fontSize: 13, textDecoration: "none" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        상세 보기 ↗
                      </a>
                    </div>
                  )}

                  <div
                    className="lx-muted"
                    style={{ fontSize: 11.5, marginTop: open ? 12 : "auto", paddingTop: 8 }}
                  >
                    {open ? "▲ 접기" : "▼ 클릭하면 상세 · 신청 링크 보기"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="lx-grid gsf-cards">
            {ranked.map(({ g, score }) => {
              const open = expanded === g.id;
              return (
                <div
                  key={g.id}
                  className={`lx-card gsf-card${open ? " is-open" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpanded(open ? null : g.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpanded(open ? null : g.id);
                    }
                  }}
                  style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <b style={{ fontFamily: "var(--font-geist)", fontSize: 14.5, color: "var(--color-ink)", lineHeight: 1.35 }}>
                      {g.name}
                    </b>
                    <span className={`lx-pill ${pillClassForDays(g.daysLeft)}`} style={{ flexShrink: 0 }}>
                      {dLabel(g.daysLeft)}
                    </span>
                  </div>

                  <div className="lx-muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                    {g.org}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0 12px", fontSize: 12.5 }}>
                    <span className="lx-pill lx-pill--muted">💰 {g.amount}</span>
                    <span className="lx-pill lx-pill--muted">📍 {g.regions.includes("전국") ? "전국" : g.regions[0]}</span>
                  </div>

                  {/* 매칭 점수 바 */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                      <span className="lx-muted">매칭 점수</span>
                      <b className="lx-mono" style={{ color: scoreColor(score) }}>
                        매칭 {score}%
                      </b>
                    </div>
                    <div className="lx-track">
                      <span className="lx-fill" style={{ width: `${score}%`, background: scoreColor(score) }} />
                    </div>
                  </div>

                  {open && (
                    <div
                      style={{
                        borderTop: "1px dashed var(--color-hairline-strong)",
                        marginTop: 4,
                        paddingTop: 12,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "var(--color-ash)",
                      }}
                    >
                      <p style={{ margin: "0 0 8px" }}>
                        <b style={{ color: "var(--color-ink)" }}>지원대상</b>
                        <br />
                        {g.target}
                      </p>
                      <p style={{ margin: "0 0 8px" }}>
                        <b style={{ color: "var(--color-ink)" }}>지원내용</b>
                        <br />
                        {g.content}
                      </p>
                      <p style={{ margin: 0 }}>
                        <b style={{ color: "var(--color-ink)" }}>신청방법</b>
                        <br />
                        {g.how}
                      </p>
                    </div>
                  )}

                  <div
                    className="lx-muted"
                    style={{ fontSize: 11.5, marginTop: open ? 12 : "auto", paddingTop: 8 }}
                  >
                    {open ? "▲ 접기" : "▼ 클릭하면 상세 조건 보기"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </section>
        </div>
      </div>
    </div>
  );
}
