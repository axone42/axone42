"use client";

import { useMemo, useRef, useState } from "react";

/* =========================================================
   전략 백테스팅 엔진 — REAL 데이터 백테스터
   /api/market?symbol=SYM&range=1Y (≈250 일봉) 를 받아
   실제 전략 수식으로 시뮬레이션한다. 프리셋/목데이터 없음.
   ========================================================= */

type StratKey = "golden" | "rsi" | "bollinger";

const STRATEGIES: { key: StratKey; name: string; desc: string }[] = [
  { key: "golden", name: "골든크로스", desc: "단기·장기 SMA 교차 매매 (골든크로스 매수 / 데드크로스 매도)" },
  { key: "rsi", name: "RSI 반전", desc: "RSI 과매도 상향 돌파 매수 / 과매수 하향 돌파 매도" },
  { key: "bollinger", name: "볼린저 밴드", desc: "하단 밴드 이탈 후 회귀 매수 / 상단 밴드 도달 매도" },
];

const TICKERS: { symbol: string; name: string }[] = [
  { symbol: "005930.KS", name: "삼성전자" },
  { symbol: "000660.KS", name: "SK하이닉스" },
  { symbol: "035420.KS", name: "NAVER" },
  { symbol: "035720.KS", name: "카카오" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "TSLA", name: "Tesla" },
];

type Point = { t: number; c: number };

/* ---------------- 지표 계산 (실데이터) ---------------- */

function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

// Wilder RSI
function rsi(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

// Bollinger bands: {mid, upper, lower}
function bollinger(values: number[], period: number, mult: number) {
  const mid: (number | null)[] = new Array(values.length).fill(null);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    const m = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (values[j] - m) ** 2;
    const sd = Math.sqrt(variance / period);
    mid[i] = m;
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { mid, upper, lower };
}

/* ---------------- 시그널 생성 ---------------- */
// signals[i] === 1 (매수 진입 신호), -1 (매도 청산 신호), 0 (없음)

function goldenSignals(closes: number[], shortP: number, longP: number): number[] {
  const s = sma(closes, shortP);
  const l = sma(closes, longP);
  const sig = new Array(closes.length).fill(0);
  for (let i = 1; i < closes.length; i++) {
    const sa = s[i], la = l[i], sp = s[i - 1], lp = l[i - 1];
    if (sa == null || la == null || sp == null || lp == null) continue;
    if (sp <= lp && sa > la) sig[i] = 1; // 골든크로스
    else if (sp >= lp && sa < la) sig[i] = -1; // 데드크로스
  }
  return sig;
}

function rsiSignals(closes: number[], period: number, overbought: number, oversold: number): number[] {
  const r = rsi(closes, period);
  const sig = new Array(closes.length).fill(0);
  for (let i = 1; i < closes.length; i++) {
    const ra = r[i], rp = r[i - 1];
    if (ra == null || rp == null) continue;
    if (rp <= oversold && ra > oversold) sig[i] = 1; // 과매도 상향 돌파 → 매수
    else if (rp >= overbought && ra < overbought) sig[i] = -1; // 과매수 하향 돌파 → 매도
  }
  return sig;
}

function bollingerSignals(closes: number[], period: number, mult: number): number[] {
  const { upper, lower } = bollinger(closes, period, mult);
  const sig = new Array(closes.length).fill(0);
  for (let i = 1; i < closes.length; i++) {
    const lo = lower[i], loP = lower[i - 1], up = upper[i];
    if (lo == null || loP == null || up == null) continue;
    // 하단 이탈 후 회귀(다시 하단 위로 복귀)하면 매수
    if (closes[i - 1] < loP && closes[i] >= lo) sig[i] = 1;
    // 상단 도달/돌파 시 매도
    else if (closes[i] >= up) sig[i] = -1;
  }
  return sig;
}

/* ---------------- 시뮬레이션 ---------------- */

type Trade = {
  entryDate: string;
  exitDate: string | null;
  entryPrice: number;
  exitPrice: number | null;
  pnlPct: number | null;
};

type SimResult = {
  equity: number[]; // 전략 자산 곡선
  bench: number[]; // 벤치마크(buy&hold) 자산 곡선
  dates: number[]; // unix 초
  totalReturn: number;
  benchReturn: number;
  mdd: number;
  sharpe: number;
  winRate: number;
  tradeCount: number;
  finalValue: number;
  trades: Trade[];
};

function fmtDate(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function simulate(points: Point[], signals: number[], capital: number): SimResult {
  const closes = points.map((p) => p.c);
  const dates = points.map((p) => p.t);
  const n = closes.length;

  let cash = capital;
  let shares = 0;
  let inPos = false;
  let entryPrice = 0;
  let entryDate = 0;

  const equity: number[] = new Array(n);
  const trades: Trade[] = [];

  for (let i = 0; i < n; i++) {
    const price = closes[i];
    if (!inPos && signals[i] === 1) {
      // 전량 매수
      shares = cash / price;
      cash = 0;
      inPos = true;
      entryPrice = price;
      entryDate = dates[i];
    } else if (inPos && signals[i] === -1) {
      // 전량 매도(청산)
      cash = shares * price;
      shares = 0;
      inPos = false;
      trades.push({
        entryDate: fmtDate(entryDate),
        exitDate: fmtDate(dates[i]),
        entryPrice: entryPrice,
        exitPrice: price,
        pnlPct: ((price - entryPrice) / entryPrice) * 100,
      });
    }
    equity[i] = cash + shares * price;
  }
  // 마지막까지 보유 중이면 미청산 거래로 기록
  if (inPos) {
    const lastPrice = closes[n - 1];
    trades.push({
      entryDate: fmtDate(entryDate),
      exitDate: null,
      entryPrice: entryPrice,
      exitPrice: lastPrice,
      pnlPct: ((lastPrice - entryPrice) / entryPrice) * 100,
    });
  }

  // 벤치마크: buy & hold
  const bench: number[] = closes.map((c) => (capital * c) / closes[0]);

  // 지표
  const finalValue = equity[n - 1];
  const totalReturn = (finalValue / capital - 1) * 100;
  const benchReturn = (bench[n - 1] / capital - 1) * 100;

  // MDD (전략 곡선 기준)
  let peak = equity[0];
  let mdd = 0;
  for (let i = 0; i < n; i++) {
    if (equity[i] > peak) peak = equity[i];
    const dd = (equity[i] - peak) / peak;
    if (dd < mdd) mdd = dd;
  }
  mdd *= 100;

  // 일간 수익률 → 샤프(연율화 √252)
  const rets: number[] = [];
  for (let i = 1; i < n; i++) {
    if (equity[i - 1] > 0) rets.push(equity[i] / equity[i - 1] - 1);
  }
  const mean = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const variance = rets.length
    ? rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length
    : 0;
  const sd = Math.sqrt(variance);
  const sharpe = sd > 0 ? (mean / sd) * Math.sqrt(252) : 0;

  // 승률 (청산/평가 완료 거래 기준)
  const closed = trades.filter((t) => t.pnlPct != null);
  const wins = closed.filter((t) => (t.pnlPct as number) > 0).length;
  const winRate = closed.length ? (wins / closed.length) * 100 : 0;

  return {
    equity,
    bench,
    dates,
    totalReturn,
    benchReturn,
    mdd,
    sharpe,
    winRate,
    tradeCount: trades.length,
    finalValue,
    trades,
  };
}

/* ---------------- 포맷 ---------------- */
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const won = (n: number, currency: string) =>
  currency === "USD"
    ? "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : "₩" + Math.round(n).toLocaleString("ko-KR");
const price = (n: number, currency: string) =>
  currency === "USD"
    ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "₩" + Math.round(n).toLocaleString("ko-KR");

/* ---------------- SVG 차트 ---------------- */
function buildLine(values: number[], w: number, h: number, pad: number, min: number, max: number) {
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const span = max - min || 1;
  const denom = values.length - 1 || 1;
  return values.map((v, i) => {
    const x = pad + (innerW * i) / denom;
    const y = pad + innerH - (innerH * (v - min)) / span;
    return { x, y };
  });
}
function toPath(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${round1(p.x)},${round1(p.y)}`).join(" ");
}

type Applied = {
  symbol: string;
  strat: StratKey;
  currency: string;
  sim: SimResult;
};

export default function Demo() {
  // 설정
  const [strat, setStrat] = useState<StratKey>("golden");
  const [symbol, setSymbol] = useState("005930.KS");
  const [capital, setCapital] = useState(10000000);
  // SMA
  const [shortMA, setShortMA] = useState(5);
  const [longMA, setLongMA] = useState(60);
  // RSI
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [overbought, setOverbought] = useState(70);
  const [oversold, setOversold] = useState(30);
  // Bollinger
  const [bbPeriod, setBbPeriod] = useState(20);
  const [bbMult, setBbMult] = useState(2);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<Applied | null>(null);
  const reqRef = useRef(0);

  const run = async () => {
    if (loading) return;
    const rid = ++reqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&range=1Y`);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      const points: Point[] = (data.points ?? []).filter(
        (p: Point) => typeof p.c === "number" && p.c > 0
      );
      if (rid !== reqRef.current) return; // 최신 요청만 반영
      if (points.length < 40) {
        setError("데이터가 충분하지 않습니다. 다른 종목을 선택해 보세요.");
        setLoading(false);
        return;
      }
      const closes = points.map((p) => p.c);
      let signals: number[];
      if (strat === "golden") {
        const sp = Math.min(shortMA, longMA - 1);
        signals = goldenSignals(closes, sp, longMA);
      } else if (strat === "rsi") {
        signals = rsiSignals(closes, rsiPeriod, overbought, oversold);
      } else {
        signals = bollingerSignals(closes, bbPeriod, bbMult);
      }
      const sim = simulate(points, signals, capital);
      const currency: string = data.meta?.currency ?? "KRW";
      setApplied({ symbol, strat, currency, sim });
      setLoading(false);
    } catch {
      if (rid !== reqRef.current) return;
      setError("시세 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  // ---- 차트 좌표 ----
  const W = 900;
  const H = 320;
  const PAD = 30;

  const chart = useMemo(() => {
    if (!applied) return null;
    const { equity, bench } = applied.sim;
    const all = [...equity, ...bench];
    const min = Math.min(...all);
    const max = Math.max(...all);
    const stratPts = buildLine(equity, W, H, PAD, min, max);
    const benchPts = buildLine(bench, W, H, PAD, min, max);
    const stratLine = toPath(stratPts);
    const benchLine = toPath(benchPts);
    const area = `${stratLine} L${round1(stratPts[stratPts.length - 1].x)},${H - PAD} L${round1(
      stratPts[0].x
    )},${H - PAD} Z`;
    return { stratPts, benchPts, stratLine, benchLine, area };
  }, [applied]);

  const activeStratName = STRATEGIES.find((s) => s.key === strat)!.name;
  const activeTickerName = TICKERS.find((t) => t.symbol === symbol)!.name;

  const sim = applied?.sim ?? null;
  const currency = applied?.currency ?? "KRW";

  // 적용된 결과의 종목/전략 라벨 (설정과 별개)
  const appliedTickerName = applied
    ? TICKERS.find((t) => t.symbol === applied.symbol)?.name ?? applied.symbol
    : activeTickerName;
  const appliedStratName = applied
    ? STRATEGIES.find((s) => s.key === applied.strat)!.name
    : activeStratName;

  const dateRange = applied
    ? `${fmtDate(applied.sim.dates[0])} ~ ${fmtDate(applied.sim.dates[applied.sim.dates.length - 1])}`
    : "";

  // 툴바 우측 상태
  const runStatus: { label: string; cls: string } = loading
    ? { label: "시뮬레이션 실행 중", cls: "bt-status--run" }
    : error
    ? { label: "실행 실패", cls: "bt-status--err" }
    : applied
    ? { label: "백테스트 완료", cls: "bt-status--ok" }
    : { label: "대기 중", cls: "bt-status--idle" };

  return (
    <div className="lx-win bt-root">
      <style>{BT_CSS}</style>

      {/* ===== 앱 툴바 ===== */}
      <div className="lx-win__bar bt-bar">
        <div className="bt-bar__brand">
          <span className="bt-bar__glyph" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M3 17.5 9 11l3.5 3.5L21 6"
                stroke="#6b62f2"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="21" cy="6" r="2" fill="#6b62f2" />
            </svg>
          </span>
          <span className="bt-bar__title">백테스팅 엔진</span>
          <span className="bt-bar__ver">Quant Studio</span>
        </div>
        <div className="bt-bar__meta">
          <span className="bt-bar__symbol">
            <b>{appliedTickerName}</b>
            <span className="bt-bar__ticker">{applied ? applied.symbol : symbol}</span>
          </span>
          <span className={`bt-status ${runStatus.cls}`}>
            <span className="bt-status__dot" />
            {runStatus.label}
          </span>
        </div>
      </div>

      <div className="lx-win__body">
        <div className="bt-layout">
          {/* ===== 좌: 설정 패널 (sticky) ===== */}
          <aside className="bt-config">
            <div className="lx-panel bt-config__panel">
              <div className="bt-section-head">
                <span className="bt-section-head__title">전략 설정</span>
                <span className="bt-section-head__hint">1Y 일봉 · 롱온리</span>
              </div>

              {/* 전략 탭 */}
              <label className="lx-label">전략 선택</label>
              <div className="lx-tabs bt-tabs" style={{ marginBottom: 6 }}>
                {STRATEGIES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={`lx-tab${strat === s.key ? " is-active" : ""}`}
                    onClick={() => setStrat(s.key)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <p className="bt-strat-desc">{STRATEGIES.find((s) => s.key === strat)!.desc}</p>

              {/* 종목 선택 */}
              <label className="lx-label">종목 선택</label>
              <select
                className="lx-select"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                style={{ marginBottom: 18 }}
              >
                {TICKERS.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.name} ({t.symbol})
                  </option>
                ))}
              </select>

              {/* 전략별 파라미터 */}
              <div className="bt-params">
                <span className="bt-params__cap">파라미터</span>
                {strat === "golden" && (
                  <>
                    <label className="lx-label bt-slabel">
                      <span>단기 SMA 기간</span>
                      <b>{shortMA}일</b>
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={30}
                      step={1}
                      value={shortMA}
                      onChange={(e) => setShortMA(Number(e.target.value))}
                      className="bt-range"
                    />
                    <label className="lx-label bt-slabel">
                      <span>장기 SMA 기간</span>
                      <b>{longMA}일</b>
                    </label>
                    <input
                      type="range"
                      min={20}
                      max={120}
                      step={5}
                      value={longMA}
                      onChange={(e) => setLongMA(Number(e.target.value))}
                      className="bt-range"
                    />
                  </>
                )}

                {strat === "rsi" && (
                  <>
                    <label className="lx-label bt-slabel">
                      <span>RSI 기간</span>
                      <b>{rsiPeriod}일</b>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={1}
                      value={rsiPeriod}
                      onChange={(e) => setRsiPeriod(Number(e.target.value))}
                      className="bt-range"
                    />
                    <label className="lx-label bt-slabel">
                      <span>과매수 기준</span>
                      <b>{overbought}</b>
                    </label>
                    <input
                      type="range"
                      min={55}
                      max={90}
                      step={1}
                      value={overbought}
                      onChange={(e) => setOverbought(Number(e.target.value))}
                      className="bt-range"
                    />
                    <label className="lx-label bt-slabel">
                      <span>과매도 기준</span>
                      <b>{oversold}</b>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={45}
                      step={1}
                      value={oversold}
                      onChange={(e) => setOversold(Number(e.target.value))}
                      className="bt-range"
                    />
                  </>
                )}

                {strat === "bollinger" && (
                  <>
                    <label className="lx-label bt-slabel">
                      <span>볼린저 기간</span>
                      <b>{bbPeriod}일</b>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={40}
                      step={1}
                      value={bbPeriod}
                      onChange={(e) => setBbPeriod(Number(e.target.value))}
                      className="bt-range"
                    />
                    <label className="lx-label bt-slabel">
                      <span>표준편차 배수</span>
                      <b>{bbMult.toFixed(1)}σ</b>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={bbMult}
                      onChange={(e) => setBbMult(Number(e.target.value))}
                      className="bt-range"
                    />
                  </>
                )}
              </div>

              <label className="lx-label">초기 자본</label>
              <select
                className="lx-select"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                style={{ marginBottom: 18 }}
              >
                <option value={5000000}>5,000,000</option>
                <option value={10000000}>10,000,000</option>
                <option value={30000000}>30,000,000</option>
                <option value={50000000}>50,000,000</option>
                <option value={100000000}>100,000,000</option>
              </select>

              <button
                type="button"
                className="lx-btn lx-btn--primary bt-run"
                onClick={run}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="bt-spinner" aria-hidden />
                    시뮬레이션 중…
                  </>
                ) : (
                  <>▶ 백테스트 실행</>
                )}
              </button>

              <p className="bt-config__foot">최근 1년 일봉(실데이터) · 롱온리 · 전량 매수/매도</p>
            </div>
          </aside>

          {/* ===== 우: 결과 영역 ===== */}
          <section className="bt-results">
            {/* 차트 */}
            <div className="lx-panel bt-chart-panel">
              <div className="bt-section-head">
                <span className="bt-section-head__title">자산 곡선 (Equity Curve)</span>
                <span className="bt-section-head__hint">
                  {appliedTickerName} · {appliedStratName}
                  {dateRange ? ` · ${dateRange}` : ""}
                </span>
              </div>

              {loading ? (
                <div>
                  <div className="lx-skel bt-chart-skel" />
                  <div className="lx-track" style={{ marginTop: 12 }}>
                    <span className="lx-fill bt-fill-anim" />
                  </div>
                  <p className="bt-loading-note">
                    <span className="lx-typing">
                      <i />
                      <i />
                      <i />
                    </span>
                    실제 과거 데이터로 시뮬레이션 중…
                  </p>
                </div>
              ) : error ? (
                <div className="bt-error">
                  <span className="bt-error__icon">⚠</span>
                  {error}
                </div>
              ) : !applied || !chart ? (
                <div className="bt-empty">
                  <div className="bt-empty__art" aria-hidden>
                    <svg viewBox="0 0 200 90" width="200" height="90" fill="none">
                      {[0, 1, 2, 3].map((g) => (
                        <line
                          key={g}
                          x1="6"
                          y1={12 + g * 22}
                          x2="194"
                          y2={12 + g * 22}
                          stroke="#ececf5"
                          strokeWidth="1"
                        />
                      ))}
                      <path
                        d="M6 74 L40 60 L74 66 L108 40 L142 46 L176 18 L194 22"
                        stroke="#c7c4f2"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="4 5"
                      />
                    </svg>
                  </div>
                  <p className="bt-empty__title">아직 실행된 백테스트가 없습니다</p>
                  <p className="bt-empty__desc">
                    좌측에서 종목·전략·파라미터를 설정하고
                    <br />
                    <b>▶ 백테스트 실행</b>을 눌러 실제 데이터로 검증하세요.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bt-chart-scroll">
                    <svg
                      viewBox={`0 0 ${W} ${H}`}
                      className="bt-svg"
                      role="img"
                      aria-label="전략 대비 벤치마크 자산 곡선"
                    >
                      <defs>
                        <linearGradient id="bt-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6b62f2" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#6b62f2" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                        const y = PAD + (H - PAD * 2) * g;
                        return (
                          <line key={g} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#ececf5" strokeWidth={1} />
                        );
                      })}

                      <path d={chart.area} fill="url(#bt-area)" />

                      <path
                        d={chart.benchLine}
                        fill="none"
                        stroke="#a6a6b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={chart.stratLine}
                        fill="none"
                        stroke="#6b62f2"
                        strokeWidth={2.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx={chart.stratPts[chart.stratPts.length - 1].x}
                        cy={chart.stratPts[chart.stratPts.length - 1].y}
                        r={4.5}
                        fill="#6b62f2"
                      />
                    </svg>
                  </div>

                  <div className="bt-legend">
                    <span className="bt-legend__item">
                      <span className="bt-legend__swatch" style={{ background: "#6b62f2" }} />
                      <b>{appliedStratName} 전략</b>
                    </span>
                    <span className="bt-legend__item lx-muted">
                      <span className="bt-legend__swatch bt-legend__swatch--dash" />
                      벤치마크 (Buy &amp; Hold)
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* 지표 그리드 */}
            {sim && !loading && !error && (
              <>
                <div className="bt-section-label">성과 지표</div>
                <div className="lx-grid lx-grid-3 bt-metrics">
                  <div className="lx-stat bt-stat">
                    <span className="lx-stat__label">총 수익률</span>
                    <span
                      className="lx-stat__value"
                      style={{ color: sim.totalReturn >= 0 ? "#1f9d57" : "#d64545" }}
                    >
                      {sim.totalReturn >= 0 ? "+" : ""}
                      {round1(sim.totalReturn)}%
                    </span>
                    <span
                      className={`lx-stat__delta ${sim.totalReturn >= sim.benchReturn ? "lx-up" : "lx-down"}`}
                    >
                      벤치 대비 {round1(sim.totalReturn - sim.benchReturn) >= 0 ? "+" : ""}
                      {round1(sim.totalReturn - sim.benchReturn)}%p
                    </span>
                  </div>
                  <div className="lx-stat bt-stat">
                    <span className="lx-stat__label">벤치마크 수익률</span>
                    <span
                      className="lx-stat__value"
                      style={{ color: sim.benchReturn >= 0 ? "#1f9d57" : "#d64545" }}
                    >
                      {sim.benchReturn >= 0 ? "+" : ""}
                      {round1(sim.benchReturn)}%
                    </span>
                    <span className="lx-stat__delta lx-muted">Buy &amp; Hold</span>
                  </div>
                  <div className="lx-stat bt-stat">
                    <span className="lx-stat__label">MDD (최대낙폭)</span>
                    <span className="lx-stat__value" style={{ color: "#d64545" }}>
                      {round1(sim.mdd)}%
                    </span>
                    <span className={`lx-stat__delta ${sim.mdd > -15 ? "lx-up" : "lx-down"}`}>
                      {sim.mdd > -15 ? "양호" : "주의"}
                    </span>
                  </div>
                  <div className="lx-stat bt-stat">
                    <span className="lx-stat__label">샤프지수</span>
                    <span className="lx-stat__value">{round2(sim.sharpe)}</span>
                    <span className={`lx-stat__delta ${sim.sharpe >= 1 ? "lx-up" : "lx-down"}`}>
                      {sim.sharpe >= 1 ? "우수" : "보통"}
                    </span>
                  </div>
                  <div className="lx-stat bt-stat">
                    <span className="lx-stat__label">승률</span>
                    <span className="lx-stat__value">{round1(sim.winRate)}%</span>
                    <span className={`lx-stat__delta ${sim.winRate >= 50 ? "lx-up" : "lx-down"}`}>
                      {sim.winRate >= 50 ? "우세" : "열세"}
                    </span>
                  </div>
                  <div className="lx-stat bt-stat">
                    <span className="lx-stat__label">거래횟수</span>
                    <span className="lx-stat__value">{sim.tradeCount}회</span>
                    <span className="lx-stat__delta lx-muted">
                      청산 {sim.trades.filter((t) => t.exitDate != null).length}건
                    </span>
                  </div>
                </div>

                <div className="lx-grid lx-grid-2 bt-metrics" style={{ marginTop: 14 }}>
                  <div className="lx-stat bt-stat">
                    <span className="lx-stat__label">최종 평가액</span>
                    <span className="lx-stat__value lx-mono" style={{ fontSize: 18 }}>
                      {won(sim.finalValue, currency)}
                    </span>
                    <span className="lx-stat__delta lx-muted">시작 {won(capital, currency)}</span>
                  </div>
                  <div className="lx-stat bt-stat">
                    <span className="lx-stat__label">벤치 평가액</span>
                    <span className="lx-stat__value lx-mono" style={{ fontSize: 18 }}>
                      {won(sim.bench[sim.bench.length - 1], currency)}
                    </span>
                    <span className="lx-stat__delta lx-muted">Buy &amp; Hold</span>
                  </div>
                </div>

                {/* 거래 로그 */}
                <div className="lx-panel bt-log-panel" style={{ marginTop: 18 }}>
                  <div className="bt-section-head">
                    <span className="bt-section-head__title">거래 로그</span>
                    <span className="bt-section-head__hint">
                      {appliedStratName} · {appliedTickerName} · {sim.trades.length}건
                    </span>
                  </div>
                  {sim.trades.length === 0 ? (
                    <p className="bt-strat-desc" style={{ margin: "6px 0 0" }}>
                      해당 기간·파라미터에서 발생한 거래가 없습니다. 파라미터를 조정해 보세요.
                    </p>
                  ) : (
                    <div className="bt-table-scroll">
                      <table className="lx-table bt-table">
                        <thead>
                          <tr>
                            <th>진입 일자</th>
                            <th>청산 일자</th>
                            <th style={{ textAlign: "right" }}>진입가</th>
                            <th style={{ textAlign: "right" }}>청산가</th>
                            <th style={{ textAlign: "right" }}>수익률</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sim.trades.map((t, i) => (
                            <tr key={i}>
                              <td className="lx-mono">{t.entryDate}</td>
                              <td className="lx-mono">
                                {t.exitDate ?? <span className="lx-pill lx-pill--info">보유중</span>}
                              </td>
                              <td className="lx-strong lx-mono" style={{ textAlign: "right" }}>
                                {price(t.entryPrice, currency)}
                              </td>
                              <td className="lx-mono" style={{ textAlign: "right" }}>
                                {t.exitPrice != null ? price(t.exitPrice, currency) : "—"}
                              </td>
                              <td
                                className="lx-mono"
                                style={{
                                  textAlign: "right",
                                  fontWeight: 700,
                                  color:
                                    t.pnlPct == null
                                      ? "var(--color-slate)"
                                      : t.pnlPct >= 0
                                      ? "#1f9d57"
                                      : "#d64545",
                                }}
                              >
                                {t.pnlPct == null
                                  ? "—"
                                  : `${t.pnlPct >= 0 ? "+" : ""}${round1(t.pnlPct)}%`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 스코프 스타일 (bt- 프리픽스) ---------------- */
const BT_CSS = `
.bt-root { display: flex; flex-direction: column; }

/* 툴바 */
.bt-bar { padding: 0 20px; min-height: 56px; background: linear-gradient(180deg,#ffffff,#fbfbff); }
.bt-bar__brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.bt-bar__glyph { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9px; background: var(--color-violet-soft); border: 1px solid rgba(107,98,242,0.22); }
.bt-bar__title { font-family: var(--font-geist); font-weight: 800; font-size: 15px; color: var(--color-ink); white-space: nowrap; }
.bt-bar__ver { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; color: var(--color-dusk-violet); background: var(--color-violet-soft); border-radius: 6px; padding: 3px 7px; text-transform: uppercase; }
.bt-bar__meta { display: flex; align-items: center; gap: 14px; flex: 0 0 auto; }
.bt-bar__symbol { display: inline-flex; align-items: baseline; gap: 7px; font-size: 13px; }
.bt-bar__symbol b { font-family: var(--font-geist); color: var(--color-ink); font-weight: 700; }
.bt-bar__ticker { font-family: var(--font-geist); font-variant-numeric: tabular-nums; font-size: 11.5px; color: var(--color-slate); background: var(--color-tint); border-radius: 6px; padding: 2px 7px; }
.bt-status { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; border-radius: 20px; padding: 5px 12px; border: 1px solid transparent; }
.bt-status__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.bt-status--idle { color: var(--color-slate); background: var(--color-tint); }
.bt-status--run { color: #6b62f2; background: var(--color-violet-soft); }
.bt-status--run .bt-status__dot { animation: bt-pulse 1s infinite; }
.bt-status--ok { color: #1f9d57; background: #e7f7ee; }
.bt-status--err { color: #d64545; background: #fdeaea; }
@keyframes bt-pulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }

/* 본문 레이아웃 */
.bt-layout { display: grid; grid-template-columns: 340px minmax(0,1fr); gap: 18px; padding: 18px; align-items: start; background: var(--color-tint); }
.bt-config { position: sticky; top: 70px; }
.bt-config__panel { padding: 18px; }
.bt-results { min-width: 0; display: flex; flex-direction: column; }
@media (max-width: 900px) {
  .bt-layout { grid-template-columns: 1fr; padding: 14px; }
  .bt-config { position: static; top: auto; }
}

/* 섹션 헤더 */
.bt-section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--color-hairline); flex-wrap: wrap; }
.bt-section-head__title { font-family: var(--font-geist); font-size: 15px; font-weight: 800; color: var(--color-ink); }
.bt-section-head__hint { font-size: 12px; color: var(--color-slate); }
.bt-section-label { font-family: var(--font-geist); font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-slate); margin: 20px 0 12px; }

/* 전략 설명 */
.bt-strat-desc { font-size: 12.5px; line-height: 1.5; color: var(--color-slate); margin: 0 0 16px; }

/* 파라미터 그룹 */
.bt-params { position: relative; border: 1px solid var(--color-hairline); border-radius: 12px; padding: 16px 14px 6px; margin-bottom: 18px; background: #fdfdff; }
.bt-params__cap { position: absolute; top: -9px; left: 12px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-slate); background: #fdfdff; padding: 0 6px; }
.bt-slabel { display: flex; align-items: baseline; justify-content: space-between; }
.bt-slabel b { font-family: var(--font-geist); font-variant-numeric: tabular-nums; color: var(--color-dusk-violet); font-size: 13px; }
.bt-range { width: 100%; margin-bottom: 14px; accent-color: #6b62f2; cursor: pointer; }

/* 실행 버튼 */
.bt-run { width: 100%; padding: 12px 18px; font-size: 14.5px; }
.bt-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; animation: bt-spin .7s linear infinite; }
@keyframes bt-spin { to { transform: rotate(360deg); } }
.bt-config__foot { font-size: 11.5px; color: var(--color-slate); text-align: center; margin: 12px 0 0; line-height: 1.5; }

/* 차트 */
.bt-chart-panel { margin-bottom: 0; }
.bt-chart-scroll { width: 100%; overflow-x: auto; }
.bt-svg { width: 100%; min-width: 520px; height: auto; display: block; }
.bt-chart-skel { height: 240px; border-radius: 12px; }
.bt-fill-anim { width: 70%; animation: bt-load 1.4s ease-in-out infinite; }
@keyframes bt-load { 0% { width: 12%; } 60% { width: 82%; } 100% { width: 92%; } }
.bt-loading-note { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12.5px; color: var(--color-slate); margin: 12px 0 2px; }

.bt-legend { display: flex; gap: 18px; margin-top: 12px; font-size: 12px; flex-wrap: wrap; }
.bt-legend__item { display: inline-flex; align-items: center; gap: 7px; }
.bt-legend__swatch { width: 16px; height: 3px; border-radius: 2px; }
.bt-legend__swatch--dash { background: repeating-linear-gradient(90deg,#a6a6b8 0 4px,transparent 4px 7px); }

/* 빈 상태 */
.bt-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; padding: 34px 16px; }
.bt-empty__art { opacity: .9; }
.bt-empty__title { font-family: var(--font-geist); font-size: 15px; font-weight: 700; color: var(--color-ash); margin: 4px 0 0; }
.bt-empty__desc { font-size: 12.5px; line-height: 1.6; color: var(--color-slate); margin: 0; }
.bt-empty__desc b { color: var(--color-dusk-violet); }

/* 에러 */
.bt-error { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #d64545; background: #fdeaea; border: 1px solid rgba(214,69,69,0.28); border-radius: 12px; padding: 14px 16px; }
.bt-error__icon { font-size: 16px; }

/* 스탯 hover */
.bt-metrics .bt-stat { transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
.bt-metrics .bt-stat:hover { border-color: var(--color-hairline-strong); box-shadow: 0 6px 18px -12px rgba(20,20,50,0.28); transform: translateY(-1px); }

/* 로그 테이블 */
.bt-log-panel { padding: 18px; }
.bt-table-scroll { width: 100%; overflow-x: auto; }
.bt-table { min-width: 480px; }
.bt-table thead th { position: sticky; top: 0; background: #fff; }
`;
