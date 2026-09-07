"use client";

import { useEffect, useMemo, useState } from "react";

/* =========================================================
   배당 포트폴리오 트래커 — 데모 (클라이언트 목 데이터)
   ========================================================= */

type Holding = {
  ticker: string;
  name: string;
  sector: string;
  shares: number;
  avgPrice: number; // 평단 (원)
  yieldPct: number; // 배당수익률 %
  color: string;
  /** 월별 배당 배분 (1=1월 … 12=12월). 합이 1이 되도록 사용. */
  months: number[];
};

// 종목별 연 예상배당 = 평단 × 수량 × 수익률
function annualDividend(h: Holding): number {
  return Math.round(h.avgPrice * h.shares * (h.yieldPct / 100));
}

const KRW = (n: number) => "₩" + n.toLocaleString("ko-KR");

// 분기 배당 (3·6·9·12월)
const Q = [0, 0, 1 / 4, 0, 0, 1 / 4, 0, 0, 1 / 4, 0, 0, 1 / 4];
// 반기 배당 (6·12월)
const H = [0, 0, 0, 0, 0, 1 / 2, 0, 0, 0, 0, 0, 1 / 2];
// 연 배당 (4월)
const Y = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0];
// 월 배당 (매월 균등) — 리얼티인컴 등
const M = new Array(12).fill(1 / 12);

const SEED_HOLDINGS: Holding[] = [
  { ticker: "005930", name: "삼성전자", sector: "반도체", shares: 120, avgPrice: 71000, yieldPct: 2.1, color: "#6b62f2", months: Q },
  { ticker: "105560", name: "KB금융", sector: "금융", shares: 60, avgPrice: 58000, yieldPct: 5.4, color: "#8b7bff", months: H },
  { ticker: "055550", name: "신한지주", sector: "금융", shares: 80, avgPrice: 42000, yieldPct: 5.1, color: "#a48bff", months: Q },
  { ticker: "017670", name: "SK텔레콤", sector: "통신", shares: 40, avgPrice: 51000, yieldPct: 6.8, color: "#c084fc", months: Q },
  { ticker: "088980", name: "맥쿼리인프라", sector: "인프라", shares: 300, avgPrice: 12200, yieldPct: 6.2, color: "#7c93ff", months: H },
  { ticker: "O", name: "리얼티인컴(O)", sector: "리츠", shares: 45, avgPrice: 78000, yieldPct: 5.6, color: "#5ad1c8", months: M },
];

const MONTH_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

// 다가오는 배당 (고정 시드 — 초기 렌더 안전). daysFromNow 로 D-day 계산.
type Payout = {
  name: string;
  ticker: string;
  recordDate: string; // 배정기준일
  payDate: string; // 지급예정일
  amount: number;
  daysFromNow: number;
  color: string;
};

const UPCOMING: Payout[] = [
  { name: "리얼티인컴(O)", ticker: "O", recordDate: "08.15", payDate: "08.28", amount: 16380, daysFromNow: 5, color: "#5ad1c8" },
  { name: "SK텔레콤", ticker: "017670", recordDate: "09.06", payDate: "09.20", amount: 34680, daysFromNow: 12, color: "#c084fc" },
  { name: "삼성전자", ticker: "005930", recordDate: "09.10", payDate: "09.24", amount: 44730, daysFromNow: 16, color: "#6b62f2" },
  { name: "맥쿼리인프라", ticker: "088980", recordDate: "10.02", payDate: "10.16", amount: 113460, daysFromNow: 28, color: "#7c93ff" },
  { name: "신한지주", ticker: "055550", recordDate: "10.08", payDate: "10.22", amount: 42840, daysFromNow: 34, color: "#a48bff" },
];

export default function Demo() {
  const [holdings, setHoldings] = useState<Holding[]>(SEED_HOLDINGS);

  // add-holding 미니 폼
  const [form, setForm] = useState({ name: "", shares: "", avgPrice: "", yieldPct: "" });

  // 카운트다운은 마운트 후 계산 (hydration-safe). 초기엔 null.
  const [countdowns, setCountdowns] = useState<(number | null)[]>(() => UPCOMING.map(() => null));

  useEffect(() => {
    // 데모: 고정 시드 daysFromNow 를 그대로 표시 (실서비스에선 today 기준 계산).
    setCountdowns(UPCOMING.map((p) => p.daysFromNow));
  }, []);

  // ---- KPI 계산 ----
  const totalAnnual = useMemo(
    () => holdings.reduce((s, h) => s + annualDividend(h), 0),
    [holdings]
  );
  const totalCost = useMemo(
    () => holdings.reduce((s, h) => s + h.avgPrice * h.shares, 0),
    [holdings]
  );
  const avgYield = totalCost > 0 ? (totalAnnual / totalCost) * 100 : 0;

  // ---- 월별 현금흐름 ----
  const monthly = useMemo(() => {
    const arr = new Array(12).fill(0);
    for (const h of holdings) {
      const ann = annualDividend(h);
      for (let i = 0; i < 12; i++) arr[i] += ann * (h.months[i] ?? 0);
    }
    return arr.map((v) => Math.round(v));
  }, [holdings]);

  const maxMonthly = Math.max(1, ...monthly);
  const currentMonthIdx = 7; // 8월 (0-index) — 고정 시드로 hydration 안전
  const thisMonth = monthly[currentMonthIdx];

  // ---- 섹터 배분 (도넛) ----
  const allocation = useMemo(() => {
    const bySector = new Map<string, { value: number; color: string }>();
    for (const h of holdings) {
      const ann = annualDividend(h);
      const cur = bySector.get(h.sector);
      if (cur) cur.value += ann;
      else bySector.set(h.sector, { value: ann, color: h.color });
    }
    return Array.from(bySector.entries()).map(([sector, v]) => ({
      sector,
      value: v.value,
      color: v.color,
    }));
  }, [holdings]);

  const allocTotal = Math.max(1, allocation.reduce((s, a) => s + a.value, 0));

  // 도넛 stroke-dasharray 계산
  const R = 54;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const donutSegments = allocation.map((a) => {
    const frac = a.value / allocTotal;
    const seg = { color: a.color, dash: frac * C, gap: C - frac * C, offset: -acc * C };
    acc += frac;
    return seg;
  });

  const addHolding = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const shares = parseInt(form.shares, 10);
    const avgPrice = parseInt(form.avgPrice, 10);
    const yieldPct = parseFloat(form.yieldPct);
    if (!name || !shares || !avgPrice || !yieldPct) return;
    const palette = ["#6b62f2", "#8b7bff", "#a48bff", "#c084fc", "#7c93ff", "#5ad1c8"];
    setHoldings((prev) => [
      ...prev,
      {
        ticker: "NEW",
        name,
        sector: "기타",
        shares,
        avgPrice,
        yieldPct,
        color: palette[prev.length % palette.length],
        months: Q,
      },
    ]);
    setForm({ name: "", shares: "", avgPrice: "", yieldPct: "" });
  };

  const nextPayout = UPCOMING[0];

  return (
    <div className="lx-win dt">
      {/* ---------- 앱 툴바 ---------- */}
      <div className="lx-win__bar dt-bar">
        <div className="dt-bar__brand">
          <span className="dt-bar__logo" aria-hidden>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M4 15l4.5-5 3.5 3.5L19 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="19" cy="6" r="1.9" fill="#fff" />
            </svg>
          </span>
          <div className="dt-bar__titles">
            <span className="lx-win__title dt-bar__title">배당 트래커</span>
            <span className="dt-bar__sub">Dividend Portfolio</span>
          </div>
        </div>

        <div className="dt-bar__right">
          <div className="dt-seg" role="group" aria-label="기간">
            <button type="button" className="dt-seg__btn">1M</button>
            <button type="button" className="dt-seg__btn is-on">1Y</button>
            <button type="button" className="dt-seg__btn">전체</button>
          </div>
          <button type="button" className="dt-tool" title="새로고침">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 11a8 8 0 10-1.6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 4v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="dt-tool__label">새로고침</span>
          </button>
          <button type="button" className="dt-tool dt-tool--primary" title="내보내기">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v11M12 3l-4 4M12 3l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="dt-tool__label">내보내기</span>
          </button>
        </div>
      </div>

      <div className="lx-win__body dt-body">
        {/* ---------- KPI 타일 ---------- */}
        <div className="dt-kpis">
          <div className="lx-stat dt-stat dt-stat--accent">
            <span className="lx-stat__label">연간 예상 배당금</span>
            <span className="lx-stat__value lx-mono">{KRW(totalAnnual)}</span>
            <span className="lx-stat__delta lx-up">세전 기준</span>
          </div>
          <div className="lx-stat dt-stat">
            <span className="lx-stat__label">평균 배당수익률</span>
            <span className="lx-stat__value lx-mono">{avgYield.toFixed(2)}%</span>
            <span className="lx-stat__delta lx-up">▲ 시장 평균 상회</span>
          </div>
          <div className="lx-stat dt-stat">
            <span className="lx-stat__label">이번 달 배당 (8월)</span>
            <span className="lx-stat__value lx-mono">{KRW(thisMonth)}</span>
            <span className="lx-stat__delta lx-muted">지급 예정</span>
          </div>
          <div className="lx-stat dt-stat">
            <span className="lx-stat__label">보유 종목 수</span>
            <span className="lx-stat__value lx-mono">{holdings.length}</span>
            <span className="lx-stat__delta lx-muted">개 종목</span>
          </div>
        </div>

        {/* ---------- 메인 대시보드 그리드 ---------- */}
        <div className="dt-grid">
          {/* ===== 좌: 보유 종목 + 폼 ===== */}
          <div className="lx-panel dt-panel dt-holdings">
            <div className="lx-h">
              보유 종목
              <span className="lx-sub">{holdings.length}개 · 연 {KRW(totalAnnual)}</span>
            </div>
            <div className="dt-tablewrap">
              <table className="lx-table dt-table">
                <thead>
                  <tr>
                    <th>종목</th>
                    <th style={{ textAlign: "right" }}>수량</th>
                    <th style={{ textAlign: "right" }}>평단</th>
                    <th style={{ textAlign: "right" }}>배당수익률</th>
                    <th style={{ textAlign: "right" }}>연 예상배당</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.ticker + h.name}>
                      <td className="lx-strong">
                        <span className="dt-dot" style={{ background: h.color }} />
                        {h.name}
                        <span className="lx-muted dt-sector">{h.sector}</span>
                      </td>
                      <td className="lx-mono" style={{ textAlign: "right" }}>{h.shares.toLocaleString("ko-KR")}</td>
                      <td className="lx-mono" style={{ textAlign: "right" }}>{KRW(h.avgPrice)}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className="lx-pill lx-pill--ok">{h.yieldPct.toFixed(1)}%</span>
                      </td>
                      <td className="lx-mono lx-strong" style={{ textAlign: "right" }}>{KRW(annualDividend(h))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* add-holding 미니 폼 */}
            <form onSubmit={addHolding} className="dt-form">
              <div className="dt-form__head">종목 추가</div>
              <div className="dt-form__row">
                <div className="dt-field dt-field--grow">
                  <label className="lx-label">종목명</label>
                  <input
                    className="lx-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="예) 현대차"
                  />
                </div>
                <div className="dt-field">
                  <label className="lx-label">수량</label>
                  <input
                    className="lx-input"
                    inputMode="numeric"
                    value={form.shares}
                    onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))}
                    placeholder="50"
                  />
                </div>
                <div className="dt-field">
                  <label className="lx-label">평단(원)</label>
                  <input
                    className="lx-input"
                    inputMode="numeric"
                    value={form.avgPrice}
                    onChange={(e) => setForm((f) => ({ ...f, avgPrice: e.target.value }))}
                    placeholder="220000"
                  />
                </div>
                <div className="dt-field">
                  <label className="lx-label">수익률%</label>
                  <input
                    className="lx-input"
                    inputMode="decimal"
                    value={form.yieldPct}
                    onChange={(e) => setForm((f) => ({ ...f, yieldPct: e.target.value }))}
                    placeholder="4.5"
                  />
                </div>
                <button type="submit" className="lx-btn lx-btn--primary dt-form__btn">
                  + 추가
                </button>
              </div>
            </form>
          </div>

          {/* ===== 우: 사이드 스택 ===== */}
          <div className="dt-side">
            {/* 월별 현금흐름 차트 */}
            <div className="lx-panel dt-panel">
              <div className="lx-h">
                월별 예상 배당 현금흐름
                <span className="lx-sub">단위: 원</span>
              </div>
              <div className="dt-chart">
                {monthly.map((v, i) => {
                  const h = (v / maxMonthly) * 100;
                  const isNow = i === currentMonthIdx;
                  return (
                    <div
                      key={i}
                      className="dt-bar-col"
                      title={`${MONTH_LABELS[i]}월 · ${KRW(v)}`}
                    >
                      <span className="lx-mono dt-bar-val">
                        {v >= 10000 ? Math.round(v / 10000) + "만" : v > 0 ? Math.round(v / 1000) + "천" : "-"}
                      </span>
                      <div
                        className={`dt-bar-fill${isNow ? " is-now" : ""}`}
                        style={{ height: `${Math.max(2, h)}%` }}
                      />
                      <span className={`dt-bar-lbl${isNow ? " is-now" : ""}`}>{MONTH_LABELS[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 도넛 배분 */}
            <div className="lx-panel dt-panel">
              <div className="lx-h">섹터별 배당 배분</div>
              <div className="dt-donut">
                <svg width={150} height={150} viewBox="0 0 150 150">
                  <circle cx={75} cy={75} r={R} fill="none" stroke="var(--color-tint)" strokeWidth={16} />
                  <g transform="rotate(-90 75 75)">
                    {donutSegments.map((s, i) => (
                      <circle
                        key={i}
                        cx={75}
                        cy={75}
                        r={R}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={16}
                        strokeLinecap="butt"
                        strokeDasharray={`${s.dash} ${s.gap}`}
                        strokeDashoffset={s.offset}
                      />
                    ))}
                  </g>
                  <text x={75} y={70} textAnchor="middle" style={{ fontSize: 11, fill: "var(--color-slate)" }}>
                    연 배당
                  </text>
                  <text
                    x={75}
                    y={88}
                    textAnchor="middle"
                    style={{ fontSize: 14, fontWeight: 800, fill: "var(--color-ink)", fontFamily: "var(--font-geist)" }}
                  >
                    {Math.round(totalAnnual / 10000)}만
                  </text>
                </svg>
                <div className="dt-legend">
                  {allocation.map((a) => (
                    <div key={a.sector} className="dt-legend__row">
                      <span className="dt-legend__dot" style={{ background: a.color }} />
                      <span className="dt-legend__name">{a.sector}</span>
                      <span className="lx-mono lx-muted">{Math.round((a.value / allocTotal) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 다가오는 배당 (달력) */}
            <div className="lx-panel dt-panel">
              <div className="lx-h">
                다가오는 배당 일정
                {nextPayout && <span className="lx-sub">다음 지급 {nextPayout.payDate}</span>}
              </div>
              <div className="dt-payouts">
                {UPCOMING.map((p, i) => {
                  const d = countdowns[i];
                  return (
                    <div key={p.ticker + p.payDate} className="lx-card lx-card--tint dt-payout">
                      <span className="dt-payout__bar" style={{ background: p.color }} />
                      <div className="dt-payout__info">
                        <div className="lx-strong dt-payout__name">{p.name}</div>
                        <div className="lx-muted dt-payout__meta">
                          배정 {p.recordDate} · 지급 {p.payDate}
                        </div>
                      </div>
                      <div className="lx-mono lx-strong dt-payout__amt">{KRW(p.amount)}</div>
                      <span
                        className={`lx-pill dt-payout__dday ${d !== null && d <= 7 ? "lx-pill--warn" : "lx-pill--info"}`}
                      >
                        {d === null ? "D-…" : d === 0 ? "D-DAY" : `D-${d}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ---------- 툴바 ---------- */
        .dt :global(.lx-win__bar.dt-bar) {
          min-height: 58px;
          padding: 0 18px;
          background: linear-gradient(180deg, #fff, #fbfbff);
        }
        .dt-bar__brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }
        .dt-bar__logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: linear-gradient(140deg, #8b7bff, #6b62f2);
          box-shadow: 0 4px 12px -4px rgba(107, 98, 242, 0.6);
          flex: 0 0 auto;
        }
        .dt-bar__titles {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
          min-width: 0;
        }
        .dt :global(.dt-bar__title) {
          font-size: 15px;
        }
        .dt-bar__sub {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-slate);
        }
        .dt-bar__right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
        }
        .dt-seg {
          display: inline-flex;
          gap: 2px;
          padding: 3px;
          background: var(--color-tint);
          border-radius: 9px;
        }
        .dt-seg__btn {
          font-family: var(--font-geist);
          font-size: 12px;
          font-weight: 700;
          color: var(--color-slate);
          background: transparent;
          border: none;
          border-radius: 6px;
          padding: 5px 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dt-seg__btn:hover {
          color: var(--color-ink);
        }
        .dt-seg__btn.is-on {
          background: #fff;
          color: var(--color-dusk-violet);
          box-shadow: 0 1px 3px rgba(20, 20, 50, 0.1);
        }
        .dt-tool {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-geist);
          font-size: 12.5px;
          font-weight: 700;
          color: var(--color-ash);
          background: #fff;
          border: 1px solid var(--color-hairline-strong);
          border-radius: 9px;
          padding: 7px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dt-tool:hover {
          background: var(--color-tint);
          color: var(--color-ink);
        }
        .dt-tool--primary {
          color: #fff;
          background: var(--color-dusk-violet);
          border-color: var(--color-dusk-violet);
        }
        .dt-tool--primary:hover {
          background: var(--color-dusk-violet);
          color: #fff;
          filter: brightness(1.08);
        }

        /* ---------- 본체 ---------- */
        .dt-body {
          padding: 18px;
          background: var(--color-tint);
        }
        .dt-kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .dt-stat {
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.18s ease, transform 0.18s ease;
        }
        .dt-stat:hover {
          box-shadow: 0 8px 22px -14px rgba(20, 20, 50, 0.28);
          transform: translateY(-1px);
        }
        .dt-stat--accent {
          background: linear-gradient(155deg, #f3f1ff, #fff 60%);
          border-color: rgba(107, 98, 242, 0.28);
        }
        .dt-stat--accent::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--color-dusk-violet);
        }

        /* ---------- 대시보드 그리드 ---------- */
        .dt-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        .dt-side {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .dt-panel {
          transition: box-shadow 0.18s ease;
        }
        .dt-panel:hover {
          box-shadow: 0 10px 26px -18px rgba(20, 20, 50, 0.22);
        }

        /* ---------- 테이블 ---------- */
        .dt-tablewrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin: 0 -4px;
        }
        .dt-table {
          min-width: 480px;
        }
        .dt-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 3px;
          margin-right: 8px;
          vertical-align: middle;
        }
        .dt-sector {
          font-size: 11px;
          margin-left: 6px;
          font-weight: 400;
        }

        /* ---------- 폼 ---------- */
        .dt-form {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed var(--color-hairline-strong);
        }
        .dt-form__head {
          font-family: var(--font-geist);
          font-size: 12.5px;
          font-weight: 700;
          color: var(--color-ash);
          margin-bottom: 10px;
        }
        .dt-form__row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: flex-end;
        }
        .dt-field {
          flex: 1 1 72px;
          min-width: 0;
        }
        .dt-field--grow {
          flex: 2 1 130px;
        }
        .dt-form__btn {
          flex: 0 0 auto;
          padding: 10px 16px;
        }

        /* ---------- 차트 ---------- */
        .dt-chart {
          display: flex;
          align-items: flex-end;
          gap: 7px;
          height: 150px;
          padding-top: 8px;
        }
        .dt-bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          height: 100%;
          justify-content: flex-end;
        }
        .dt-bar-val {
          font-size: 9.5px;
          color: var(--color-slate);
          white-space: nowrap;
        }
        .dt-bar-fill {
          width: 100%;
          max-width: 30px;
          border-radius: 6px 6px 0 0;
          background: linear-gradient(180deg, #8b7bff, #6b62f2);
          transition: height 0.3s ease, filter 0.15s ease;
        }
        .dt-bar-col:hover .dt-bar-fill {
          filter: brightness(1.08);
        }
        .dt-bar-fill.is-now {
          background: var(--color-dusk-violet);
          box-shadow: 0 0 0 2px rgba(107, 98, 242, 0.25);
        }
        .dt-bar-lbl {
          font-size: 11px;
          font-weight: 500;
          color: var(--color-slate);
        }
        .dt-bar-lbl.is-now {
          font-weight: 800;
          color: var(--color-dusk-violet);
        }

        /* ---------- 도넛 ---------- */
        .dt-donut {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .dt-legend {
          display: flex;
          flex-direction: column;
          gap: 9px;
          flex: 1 1 120px;
          min-width: 120px;
        }
        .dt-legend__row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
        }
        .dt-legend__dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          flex: 0 0 auto;
        }
        .dt-legend__name {
          flex: 1;
          color: var(--color-ash);
        }

        /* ---------- 다가오는 배당 ---------- */
        .dt-payouts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dt-payout {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .dt-payout:hover {
          border-color: var(--color-hairline-strong);
          background: #fff;
        }
        .dt-payout__bar {
          width: 8px;
          height: 36px;
          border-radius: 4px;
          flex: 0 0 auto;
        }
        .dt-payout__info {
          flex: 1 1 120px;
          min-width: 0;
        }
        .dt-payout__name {
          font-size: 13.5px;
          color: var(--color-ink);
          font-family: var(--font-geist);
        }
        .dt-payout__meta {
          font-size: 11.5px;
        }
        .dt-payout__amt {
          font-size: 14px;
          color: var(--color-ink);
          text-align: right;
        }
        .dt-payout__dday {
          flex: 0 0 auto;
          min-width: 44px;
          text-align: center;
        }

        /* ---------- 반응형 ---------- */
        @media (max-width: 960px) {
          .dt-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .dt-kpis {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 560px) {
          .dt-tool__label {
            display: none;
          }
          .dt-tool {
            padding: 7px 9px;
          }
        }
        @media (max-width: 440px) {
          .dt-kpis {
            grid-template-columns: 1fr;
          }
          .dt-seg {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
