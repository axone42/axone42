"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  currency: string;
  spark: number[];
};
type HistoryPoint = { t: number; c: number };
type HistoryMeta = {
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
type NewsItem = { title: string; publisher: string; link: string; time: number };

const RANGES = ["1D", "1W", "1M", "1Y"] as const;
type RangeKey = (typeof RANGES)[number];

// 고정 보유 내역 (실시간 시세로 평가손익 계산)
const HOLDINGS: Record<string, { qty: number; avg: number }> = {
  "005930.KS": { qty: 40, avg: 71000 },
  "000660.KS": { qty: 15, avg: 128000 },
  "035420.KS": { qty: 20, avg: 210000 },
  AAPL: { qty: 12, avg: 185.4 },
  TSLA: { qty: 8, avg: 240.1 },
};

const GREEN = "#22c07a";
const RED = "#ff5c6c";

// 실시간 "라이브 틱" 설정 — 실제 시세를 앵커로 두고 아주 작은 평균회귀 랜덤워크를 얹어 화면 숫자가 살아있게 보이게 함.
const TICK_MS = 900;            // 틱 주기
const JITTER_STEP = 0.0006;     // 틱당 최대 이동폭 (±0.06%)
const REVERT = 0.12;            // 앵커(실제값) 방향으로 되돌아가는 강도
const CLAMP = 0.0018;           // 앵커 대비 최대 이탈폭 (±0.18%) — 실제값에서 절대 멀어지지 않음

// 결정론적이지 않아도 되지만, 마운트 이후에만 호출됨(하이드레이션 안전).
function walk(prev: number): number {
  // 평균회귀 랜덤워크: 0(앵커) 쪽으로 당기면서 작은 노이즈 추가
  const noise = (Math.random() * 2 - 1) * JITTER_STEP;
  let next = prev * (1 - REVERT) + noise;
  if (next > CLAMP) next = CLAMP;
  if (next < -CLAMP) next = -CLAMP;
  return next;
}

function fmtStock(v: number | null, currency: string): string {
  if (v == null) return "—";
  if (currency === "KRW") return "₩" + Math.round(v).toLocaleString("ko-KR");
  if (currency === "USD") return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
function fmtNum(v: number | null, digits = 2): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtPct(v: number | null): string {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}
function fmtVol(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1e8) return (v / 1e8).toFixed(1) + "억";
  if (v >= 1e4) return (v / 1e4).toFixed(0) + "만";
  return v.toLocaleString();
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return <span style={{ width: 64, height: 22, display: "inline-block" }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const W = 64, H = 22;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * W},${H - ((d - min) / span) * H}`).join(" ");
  return (
    <svg width={W} height={H} style={{ display: "block" }} aria-hidden>
      <polyline points={pts} fill="none" stroke={up ? GREEN : RED} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function AreaChart({ points, up }: { points: HistoryPoint[]; up: boolean }) {
  const W = 720, H = 320, padL = 8, padR = 8, padT = 12, padB = 20;
  const geom = useMemo(() => {
    if (points.length < 2) return null;
    const cs = points.map((p) => p.c);
    const min = Math.min(...cs);
    const max = Math.max(...cs);
    const span = max - min || 1;
    const iw = W - padL - padR;
    const ih = H - padT - padB;
    const x = (i: number) => padL + (i / (points.length - 1)) * iw;
    const y = (c: number) => padT + (1 - (c - min) / span) * ih;
    const line = points.map((p, i) => `${x(i)},${y(p.c)}`).join(" ");
    const area = `${padL},${H - padB} ${line} ${padL + iw},${H - padB}`;
    const last = points[points.length - 1];
    return { min, max, x, y, line, area, lastX: x(points.length - 1), lastY: y(last.c), iw, ih };
  }, [points]);

  if (!geom) return <div className="lx-skel" style={{ height: H, borderRadius: 12 }} />;
  const color = up ? GREEN : RED;
  const grid = [0.25, 0.5, 0.75];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="가격 차트">
      <defs>
        <linearGradient id="mkt-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((g) => (
        <line key={g} x1={padL} x2={W - padR} y1={padT + g * geom.ih} y2={padT + g * geom.ih} stroke="#262838" strokeWidth="1" />
      ))}
      <polygon points={geom.area} fill="url(#mkt-fill)" />
      <polyline points={geom.line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <line x1={geom.lastX} x2={geom.lastX} y1={padT} y2={H - padB} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      <circle cx={geom.lastX} cy={geom.lastY} r="4" fill={color} />
      <circle cx={geom.lastX} cy={geom.lastY} r="8" fill={color} opacity="0.2" />
    </svg>
  );
}

export default function Demo() {
  const [watch, setWatch] = useState<Quote[]>([]);
  const [indices, setIndices] = useState<Quote[]>([]);
  const [selected, setSelected] = useState("005930.KS");
  const [range, setRange] = useState<RangeKey>("1D");
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [meta, setMeta] = useState<HistoryMeta | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<string>("");
  const [pulse, setPulse] = useState(0);
  const mounted = useRef(true);

  // ── 라이브 틱(코스메틱) 레이어 ─────────────────────────────
  // 실제 fetch 값은 그대로 앵커로 유지하고, 심볼별 작은 오프셋(비율)을 굴려 화면 값만 살짝 흔든다.
  // 하이드레이션 안전: 초기 렌더에서는 tick=0 → 오프셋 0 → 실제/앵커 값 그대로 그린다. 틱은 마운트 후 useEffect에서만 시작.
  const [tick, setTick] = useState(0);
  const offsets = useRef<Map<string, number>>(new Map()); // 심볼별 현재 오프셋(비율)
  const dirs = useRef<Map<string, number>>(new Map());     // 마지막 방향(색 플래시용): 1=up, -1=down

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // 새 실제 데이터가 들어오면 오프셋을 앵커(실제값)로 리셋 — 절대 실제값에서 드리프트하지 않도록.
  useEffect(() => {
    offsets.current.clear();
    dirs.current.clear();
  }, [pulse]);

  // 마운트 이후에만 도는 틱 인터벌 — 심볼별 오프셋을 평균회귀 랜덤워크로 갱신.
  useEffect(() => {
    const id = setInterval(() => {
      if (!mounted.current) return;
      const off = offsets.current;
      const dir = dirs.current;
      // 화면에 등장하는 모든 심볼(관심종목+지수+포트폴리오+선택 종목)에 대해 오프셋 갱신
      const keys = new Set<string>([
        ...watch.map((q) => q.symbol),
        ...indices.map((q) => q.symbol),
        ...Object.keys(HOLDINGS),
        selected,
      ]);
      keys.forEach((k) => {
        const prev = off.get(k) ?? 0;
        const nextOff = walk(prev);
        dir.set(k, nextOff > prev ? 1 : nextOff < prev ? -1 : dir.get(k) ?? 0);
        off.set(k, nextOff);
      });
      setTick((t) => t + 1);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [watch, indices, selected]);

  // 앵커(실제값)에 심볼별 오프셋을 적용해 "표시용" 가격 계산.
  // tick 파라미터는 사용하지 않지만, 매 틱마다 아래 useMemo들이 재계산되도록 의존성에 넣는다.
  const offsetOf = (symbol: string): number => offsets.current.get(symbol) ?? 0;
  const applyOffset = (symbol: string, real: number | null): number | null =>
    real == null ? null : real * (1 + offsetOf(symbol));

  const loadQuotes = useCallback(async () => {
    try {
      const [w, idx] = await Promise.all([
        fetch("/api/market?quotes=1").then((r) => r.json()),
        fetch("/api/market?quotes=1&group=indices").then((r) => r.json()),
      ]);
      if (!mounted.current) return;
      if (w.quotes) setWatch(w.quotes);
      if (idx.quotes) setIndices(idx.quotes);
      setError(null);
      setUpdated(new Date().toLocaleTimeString("ko-KR"));
      setPulse((p) => p + 1);
    } catch {
      if (mounted.current) setError("시세 데이터를 불러오지 못했습니다. 잠시 후 다시 시도됩니다.");
    }
  }, []);

  const loadChart = useCallback(async (sym: string, rg: RangeKey) => {
    setLoadingChart(true);
    try {
      const data = await fetch(`/api/market?symbol=${encodeURIComponent(sym)}&range=${rg}`).then((r) => r.json());
      if (!mounted.current) return;
      setHistory(data.points ?? []);
      setMeta(data.meta ?? null);
    } catch {
      if (mounted.current) { setHistory([]); setMeta(null); }
    } finally {
      if (mounted.current) setLoadingChart(false);
    }
  }, []);

  const loadNews = useCallback(async (sym: string) => {
    try {
      const data = await fetch(`/api/market?news=${encodeURIComponent(sym)}`).then((r) => r.json());
      if (mounted.current) setNews(data.news ?? []);
    } catch {
      if (mounted.current) setNews([]);
    }
  }, []);

  // 최초 로드 + 20초 폴링
  useEffect(() => {
    loadQuotes();
    const id = setInterval(loadQuotes, 20000);
    return () => clearInterval(id);
  }, [loadQuotes]);

  // 선택/기간 변경 시 차트, 선택 변경 시 뉴스
  useEffect(() => { loadChart(selected, range); }, [selected, range, loadChart]);
  useEffect(() => { loadNews(selected); }, [selected, loadNews]);
  // 1D일 때 차트도 20초마다 갱신
  useEffect(() => {
    if (range !== "1D") return;
    const id = setInterval(() => loadChart(selected, "1D"), 20000);
    return () => clearInterval(id);
  }, [range, selected, loadChart]);

  // 수동 새로고침 — 기존 로더만 재호출 (데이터 로직 변경 없음)
  const refresh = useCallback(() => {
    loadQuotes();
    loadChart(selected, range);
    loadNews(selected);
  }, [loadQuotes, loadChart, loadNews, selected, range]);

  // 표시용 관심종목: 실제 change/prevClose는 앵커로 두고, 현재가에만 오프셋을 얹어 change/changePct를 재계산.
  // tick이 바뀔 때마다(=매 틱) 재계산되어 화면 숫자가 살아 움직인다. 하이드레이션 안전: 최초 tick=0 → 오프셋 0 → 실제값 그대로.
  const watchDisplay = useMemo<Quote[]>(
    () =>
      watch.map((q) => {
        if (q.price == null) return q;
        const price = q.price * (1 + offsetOf(q.symbol));
        const base = q.prevClose ?? (q.change != null ? q.price - q.change : null);
        const change = base != null ? price - base : q.change;
        const changePct = base ? (price - base) / base * 100 : q.changePct;
        return { ...q, price, change, changePct };
      }),
    [watch, tick], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const indicesDisplay = useMemo<Quote[]>(
    () =>
      indices.map((q) => {
        if (q.price == null) return q;
        const price = q.price * (1 + offsetOf(q.symbol));
        const base = q.prevClose ?? (q.change != null ? q.price - q.change : null);
        const change = base != null ? price - base : q.change;
        const changePct = base ? (price - base) / base * 100 : q.changePct;
        return { ...q, price, change, changePct };
      }),
    [indices, tick], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const selQuote = watchDisplay.find((q) => q.symbol === selected);
  const selRealQuote = watch.find((q) => q.symbol === selected);
  const selCurrency = meta?.currency || selQuote?.currency || "";
  // 선택 종목 현재가: meta.price(실제)에도 동일 오프셋 적용, 없으면 표시용 관심종목가 사용.
  const selPrice = useMemo(
    () => applyOffset(selected, meta?.price ?? null) ?? selQuote?.price ?? null,
    [selected, meta?.price, selQuote?.price, tick], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // change/changePct: 표시가 기준으로 재계산 → 함께 움직인다.
  const selBase = selRealQuote?.prevClose
    ?? (selRealQuote?.change != null && selRealQuote?.price != null ? selRealQuote.price - selRealQuote.change : null);
  const selChange = selPrice != null && selBase != null ? selPrice - selBase : selQuote?.change ?? null;
  const selPct = selPrice != null && selBase ? (selPrice - selBase) / selBase * 100 : selQuote?.changePct ?? null;
  const up = (selChange ?? (history.length > 1 ? history[history.length - 1].c - history[0].c : 0)) >= 0;
  // 선택 종목의 마지막 틱 방향 → 현재가 색 플래시(1=상승 초록, -1=하락 빨강, 0=기본 흰색).
  const selFlash = useMemo(() => dirs.current.get(selected) ?? 0, [selected, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // 차트 마지막 점도 선택 종목 오프셋으로 살짝 흔든다(엣지 위글). 실제 history는 그대로 유지.
  const historyDisplay = useMemo<HistoryPoint[]>(() => {
    if (history.length < 2) return history;
    const o = offsetOf(selected);
    if (o === 0) return history;
    const out = history.slice();
    const last = out[out.length - 1];
    out[out.length - 1] = { t: last.t, c: last.c * (1 + o) };
    return out;
  }, [history, selected, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // 포트폴리오 평가손익 (실시간) — 표시용(오프셋 적용) 관심종목가로 계산되어 P/L도 함께 움직인다.
  const priceBy = useMemo(() => {
    const m = new Map<string, Quote>();
    watchDisplay.forEach((q) => m.set(q.symbol, q));
    return m;
  }, [watchDisplay]);
  const portfolio = useMemo(() => {
    let value = 0, cost = 0;
    const rows = Object.entries(HOLDINGS).map(([sym, h]) => {
      const q = priceBy.get(sym);
      const price = q?.price ?? null;
      const cur = q?.currency ?? "KRW";
      // 통화 혼합 방지: 원화 환산 없이 각 통화 그대로, 합계는 KRW 종목만
      const rowValue = price != null ? price * h.qty : null;
      const rowCost = h.avg * h.qty;
      const pl = rowValue != null ? rowValue - rowCost : null;
      const plPct = rowValue != null ? (pl! / rowCost) * 100 : null;
      if (cur === "KRW" && rowValue != null) { value += rowValue; cost += rowCost; }
      return { sym, name: q?.name ?? sym, qty: h.qty, avg: h.avg, price, cur, pl, plPct };
    });
    const totalPl = value - cost;
    const totalPct = cost ? (totalPl / cost) * 100 : 0;
    return { rows, value, totalPl, totalPct };
  }, [priceBy]);

  return (
    <div className="lx-win mkt-win">
      {/* 앱 툴바 */}
      <div className="lx-win__bar mkt-bar">
        <div className="mkt-brand">
          <span className="mkt-brand__mark" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 11.5 L5 6.5 L8.5 9.5 L15 2" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="15" cy="2" r="1.6" fill={GREEN} />
            </svg>
          </span>
          <span className="mkt-brand__name">AXONE Markets</span>
          <span className="mkt-brand__sub">Terminal</span>
        </div>
        <div className="mkt-toolbar">
          <span key={pulse} className="mkt-live">
            <span className="mkt-live__dot" />
            LIVE
          </span>
          <span className="mkt-updated">
            {updated ? `업데이트 ${updated}` : "연결 중…"}
          </span>
          <button type="button" className="mkt-refresh" onClick={refresh} aria-label="새로고침" title="새로고침">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13.7 2.2 V5 H10.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="mkt-refresh__t">새로고침</span>
          </button>
        </div>
      </div>

      <div className="lx-win__body">
        <div className="lx-dark mkt-surface">
          {error && (
            <div className="lx-card mkt-error">
              {error}
            </div>
          )}

          {/* 지수 KPI 스트립 */}
          <div className="lx-grid lx-grid-4 mkt-indices">
            {(indicesDisplay.length ? indicesDisplay : Array.from({ length: 4 })).map((it, i) => {
              const q = indicesDisplay[i];
              if (!q) return <div key={i} className="lx-stat"><div className="lx-skel" style={{ height: 40 }} /></div>;
              const iu = (q.changePct ?? 0) >= 0;
              const isFx = q.symbol === "KRW=X";
              return (
                <div key={q.symbol} className="lx-stat mkt-index">
                  <span className="lx-stat__label">{q.name}</span>
                  <strong className="lx-stat__value lx-mono">{fmtNum(q.price, isFx ? 2 : 2)}</strong>
                  <span className="lx-stat__delta" style={{ color: iu ? GREEN : RED }}>
                    {iu ? "▲" : "▼"} {fmtPct(q.changePct)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 트레이딩 터미널 3-존 그리드 */}
          <div className="mkt-terminal">
            {/* 좌측 워치리스트 레일 */}
            <aside className="lx-card mkt-watch">
              <div className="lx-h mkt-watch__h">
                관심 종목
                <span className="lx-sub">{watch.length || ""}</span>
              </div>
              <div className="mkt-watch__list">
                {(watchDisplay.length ? watchDisplay : Array.from({ length: 6 })).map((q, i) => {
                  const quote = watchDisplay[i];
                  if (!quote) return <div key={i} className="lx-skel" style={{ height: 48, margin: "3px 0" }} />;
                  const qu = (quote.changePct ?? 0) >= 0;
                  const active = quote.symbol === selected;
                  return (
                    <button
                      key={quote.symbol}
                      onClick={() => setSelected(quote.symbol)}
                      className={`mkt-watch__row${active ? " is-active" : ""}`}
                    >
                      <div className="mkt-watch__main">
                        <div className="mkt-watch__name">{quote.name}</div>
                        <div className="lx-mono mkt-watch__px">{fmtStock(quote.price, quote.currency)}</div>
                      </div>
                      <div className="mkt-watch__right">
                        <Sparkline data={quote.spark} up={qu} />
                        <div className="lx-mono mkt-watch__pct" style={{ color: qu ? GREEN : RED }}>{fmtPct(quote.changePct)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* 중앙: 대형 차트 + 상세 지표 */}
            <section className="mkt-center">
              <div className="lx-card mkt-chartcard">
                <div className="mkt-chart-head">
                  <div>
                    <div className="mkt-chart-title">
                      <b>{selQuote?.name ?? selected}</b>
                      <span className="lx-mono mkt-sym">{selected}</span>
                    </div>
                    <div className="mkt-price-row">
                      <span className="lx-mono mkt-price" style={{ color: selFlash === 1 ? GREEN : selFlash === -1 ? RED : "#fff" }}>{fmtStock(selPrice, selCurrency)}</span>
                      <span className="lx-mono mkt-price-delta" style={{ color: up ? GREEN : RED }}>
                        {selChange != null ? (selChange >= 0 ? "+" : "") + fmtStock(Math.abs(selChange) * (selChange < 0 ? -1 : 1), selCurrency).replace("-", "") : ""} ({fmtPct(selPct)})
                      </span>
                    </div>
                  </div>
                  <div className="lx-tabs mkt-tabs">
                    {RANGES.map((r) => (
                      <button key={r} className={`lx-tab${range === r ? " is-active" : ""}`} style={range === r ? { background: "#262838", color: "#fff" } : { color: "#8a8ca6" }} onClick={() => setRange(r)}>{r}</button>
                    ))}
                  </div>
                </div>

                <div className="mkt-chart-area">
                  {loadingChart ? (
                    <div className="lx-skel" style={{ height: 320, borderRadius: 12 }} />
                  ) : (
                    <AreaChart points={historyDisplay} up={up} />
                  )}
                </div>

                {/* 상세 지표 (실데이터) */}
                <div className="mkt-detail">
                  {[
                    ["시가", fmtStock(meta?.open ?? null, selCurrency)],
                    ["고가", fmtStock(meta?.dayHigh ?? null, selCurrency)],
                    ["저가", fmtStock(meta?.dayLow ?? null, selCurrency)],
                    ["거래량", fmtVol(meta?.volume ?? null)],
                    ["52주 최고", fmtStock(meta?.fiftyTwoWeekHigh ?? null, selCurrency)],
                    ["52주 최저", fmtStock(meta?.fiftyTwoWeekLow ?? null, selCurrency)],
                  ].map(([k, v]) => (
                    <div key={k} className="mkt-detail__cell">
                      <div className="mkt-detail__k">{k}</div>
                      <div className="lx-mono mkt-detail__v">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 우측: 포트폴리오 + 뉴스 */}
            <aside className="mkt-side">
              {/* 포트폴리오 */}
              <div className="lx-card mkt-port">
                <div className="lx-h mkt-port__h">
                  내 포트폴리오
                  <span className="lx-mono mkt-port__pl" style={{ color: portfolio.totalPl >= 0 ? GREEN : RED }}>
                    {portfolio.totalPl >= 0 ? "+" : ""}₩{Math.round(portfolio.totalPl).toLocaleString("ko-KR")} ({fmtPct(portfolio.totalPct)})
                  </span>
                </div>
                <div className="mkt-port__scroll">
                  <table className="lx-table">
                    <thead><tr><th>종목</th><th style={{ textAlign: "right" }}>수량</th><th style={{ textAlign: "right" }}>현재가</th><th style={{ textAlign: "right" }}>손익</th></tr></thead>
                    <tbody>
                      {portfolio.rows.map((r) => (
                        <tr key={r.sym}>
                          <td className="lx-strong">{r.name}</td>
                          <td className="lx-mono" style={{ textAlign: "right" }}>{r.qty}</td>
                          <td className="lx-mono" style={{ textAlign: "right" }}>{fmtStock(r.price, r.cur)}</td>
                          <td className="lx-mono" style={{ textAlign: "right", color: (r.plPct ?? 0) >= 0 ? GREEN : RED }}>{fmtPct(r.plPct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 뉴스 (실시간) */}
              <div className="lx-card mkt-news">
                <div className="lx-h">종목 뉴스 <span className="lx-sub">실시간</span></div>
                {news.length === 0 ? (
                  <div className="mkt-news__skel">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="lx-skel" style={{ height: 34 }} />)}
                  </div>
                ) : (
                  <div className="mkt-news__list">
                    {news.map((n, i) => (
                      <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="mkt-news__item">
                        <div className="mkt-news__title">{n.title}</div>
                        <div className="mkt-news__pub">{n.publisher}</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>

          <div className="mkt-foot">
            <span>데이터: Yahoo Finance · 시세는 최대 15분 지연될 수 있습니다</span>
            <span>{updated && `최근 업데이트 ${updated}`}</span>
          </div>
        </div>
      </div>

      <style>{`
        /* 앱 툴바 (다크) */
        .mkt-win .lx-win__bar.mkt-bar {
          background: #0b0c14; border-bottom: 1px solid #20222f; min-height: 54px;
        }
        .mkt-brand { display: flex; align-items: center; gap: 9px; min-width: 0; }
        .mkt-brand__mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(34,192,122,0.12); border: 1px solid rgba(34,192,122,0.28);
        }
        .mkt-brand__name { font-family: var(--font-geist); font-weight: 800; font-size: 15px; color: #fff; letter-spacing: -0.01em; }
        .mkt-brand__sub {
          font-family: var(--font-geist); font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          color: #8a8ca6; text-transform: uppercase; border-left: 1px solid #2a2c3c; padding-left: 8px;
        }
        .mkt-toolbar { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
        .mkt-live { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: ${GREEN}; }
        .mkt-live__dot {
          width: 7px; height: 7px; border-radius: 50%; background: ${GREEN};
          box-shadow: 0 0 0 0 rgba(34,192,122,0.5); animation: mkt-pulse 1.8s ease-out infinite;
        }
        @keyframes mkt-pulse {
          0% { box-shadow: 0 0 0 0 rgba(34,192,122,0.45); }
          70% { box-shadow: 0 0 0 6px rgba(34,192,122,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,192,122,0); }
        }
        .mkt-updated { font-family: var(--font-geist); font-size: 11.5px; color: #8a8ca6; font-variant-numeric: tabular-nums; }
        .mkt-refresh {
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
          font-family: var(--font-geist); font-size: 12px; font-weight: 700; color: #c7c8db;
          background: #171826; border: 1px solid #2a2c3c; border-radius: 9px; padding: 6px 11px;
          transition: background .15s ease, border-color .15s ease, color .15s ease;
        }
        .mkt-refresh:hover { background: #1f2130; border-color: #3a3d52; color: #fff; }
        .mkt-refresh:active { transform: translateY(1px); }

        /* 실시간 숫자: 폭 고정으로 레이아웃 흔들림 방지 + 값 변화 시 부드러운 전환 */
        .mkt-index .lx-stat__value, .mkt-index .lx-stat__delta,
        .mkt-watch__px, .mkt-watch__pct, .mkt-price, .mkt-price-delta,
        .mkt-port__pl, .mkt-port .lx-table td { font-variant-numeric: tabular-nums; }
        .mkt-price, .mkt-price-delta { transition: color .25s ease; }

        /* 서피스 */
        .mkt-surface { padding: 16px; border-radius: 0; }
        .mkt-error { margin-bottom: 12px; border-color: rgba(255,92,108,0.4); color: #ffb4bc; font-size: 13px; }

        .mkt-indices { margin-bottom: 14px; }
        .mkt-index { transition: border-color .15s ease, transform .15s ease; }
        .mkt-index:hover { border-color: #34364a; }

        /* 터미널 그리드: 워치 | 차트 | 사이드 */
        .mkt-terminal {
          display: grid; grid-template-columns: 248px minmax(0, 1fr) 340px; gap: 14px; align-items: start;
        }

        /* 워치리스트 */
        .mkt-watch { padding: 10px; position: sticky; top: 66px; }
        .mkt-watch__h { margin-bottom: 8px; padding: 2px 4px; }
        .mkt-watch__list { display: flex; flex-direction: column; gap: 2px; }
        .mkt-watch__row {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 8px 10px; border-radius: 10px; cursor: pointer; text-align: left;
          border: 1px solid transparent; background: transparent; width: 100%;
          transition: background .13s ease, border-color .13s ease;
        }
        .mkt-watch__row:hover { background: rgba(255,255,255,0.04); }
        .mkt-watch__row.is-active { border-color: rgba(107,98,242,0.6); background: rgba(107,98,242,0.16); }
        .mkt-watch__main { min-width: 0; }
        .mkt-watch__name { font-weight: 700; font-size: 13px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mkt-watch__px { font-size: 12px; color: #c7c8db; margin-top: 1px; }
        .mkt-watch__right { text-align: right; flex-shrink: 0; }
        .mkt-watch__pct { font-size: 11px; font-weight: 700; margin-top: 1px; }

        /* 중앙 차트 */
        .mkt-center { min-width: 0; display: flex; flex-direction: column; gap: 14px; }
        .mkt-chartcard { display: flex; flex-direction: column; }
        .mkt-chart-head {
          display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;
        }
        .mkt-chart-title { display: flex; align-items: center; gap: 8px; }
        .mkt-chart-title b { font-size: 18px; color: #fff; font-family: var(--font-geist); }
        .mkt-sym { font-size: 12px; color: #8a8ca6; }
        .mkt-price-row { display: flex; align-items: baseline; gap: 10px; margin-top: 5px; }
        .mkt-price { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
        .mkt-price-delta { font-size: 14px; font-weight: 700; }
        .mkt-tabs { background: #0f1018; flex: 0 0 auto; }
        .mkt-chart-area {
          background: #0b0c14; border: 1px solid #1c1e2c; border-radius: 12px; padding: 8px 8px 4px;
        }
        .mkt-detail { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
        .mkt-detail__cell {
          background: #0f1018; border: 1px solid #1c1e2c; border-radius: 9px; padding: 9px 11px;
          transition: border-color .15s ease;
        }
        .mkt-detail__cell:hover { border-color: #2a2c3c; }
        .mkt-detail__k { font-size: 11px; color: #8a8ca6; }
        .mkt-detail__v { font-size: 13px; font-weight: 700; color: #e6e6f0; margin-top: 2px; }

        /* 우측 사이드 */
        .mkt-side { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        .mkt-port__h, .mkt-news .lx-h { margin-bottom: 10px; }
        .mkt-port__pl { font-size: 13px; font-weight: 800; }
        .mkt-port__scroll { overflow-x: auto; }
        .mkt-news__skel { display: flex; flex-direction: column; gap: 8px; }
        .mkt-news__list { display: flex; flex-direction: column; }
        .mkt-news__item {
          display: block; padding: 10px 6px; border-bottom: 1px solid #20222f; text-decoration: none;
          border-radius: 8px; transition: background .13s ease;
        }
        .mkt-news__item:last-child { border-bottom: none; }
        .mkt-news__item:hover { background: rgba(255,255,255,0.03); }
        .mkt-news__title { font-size: 12.5px; color: #e6e6f0; line-height: 1.4; }
        .mkt-news__pub { font-size: 11px; color: #8a8ca6; margin-top: 3px; }

        .mkt-foot {
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;
          margin-top: 14px; padding-top: 12px; border-top: 1px solid #20222f;
          font-size: 11px; color: #8a8ca6;
        }

        /* 반응형: 사이드가 먼저 아래로, 그 다음 워치가 위로 */
        @media (max-width: 1080px) {
          .mkt-terminal { grid-template-columns: 240px minmax(0, 1fr); }
          .mkt-side { grid-column: 1 / -1; flex-direction: row; }
          .mkt-side > * { flex: 1 1 0; min-width: 0; }
        }
        @media (max-width: 760px) {
          .mkt-terminal { grid-template-columns: 1fr; }
          .mkt-watch { position: static; }
          .mkt-side { flex-direction: column; }
          .mkt-detail { grid-template-columns: repeat(2, 1fr); }
          .mkt-brand__sub { display: none; }
          .mkt-refresh__t { display: none; }
          .mkt-refresh { padding: 6px 8px; }
        }
        @media (max-width: 480px) {
          .mkt-indices { grid-template-columns: repeat(2, 1fr); }
          .mkt-updated { display: none; }
        }
      `}</style>
    </div>
  );
}
