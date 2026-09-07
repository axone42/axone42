"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================
   실시간 가격 알림 봇 — REAL 시세.
   /api/market (crypto/fx/quotes) 를 15~20초 폴링하여
   사용자가 설정한 임계값이 실제로 교차되면 알림을 발화합니다.
   초기 렌더는 스켈레톤(하이드레이션 안전) — fetch/Date/random 은
   전부 useEffect / 핸들러 안에서만 사용.
   ============================================================ */

type Channel = "telegram" | "kakao";
const CHANNELS: { key: Channel; name: string; glyph: string; color: string }[] = [
  { key: "telegram", name: "Telegram", glyph: "✈", color: "#229ED9" },
  { key: "kakao", name: "KakaoTalk", glyph: "K", color: "#3C1E1E" },
];

type Cond = "gte" | "lte";
const COND_LABEL: Record<Cond, string> = { gte: "이상 ≥", lte: "이하 ≤" };

// 표시 대상 자산 (3개 엔드포인트에서 조합)
type AssetDef = {
  key: string; // 안정적 식별자
  name: string;
  symbol: string;
  unit: "KRW" | "USD";
  source: "crypto" | "fx" | "quotes";
  match: string; // 소스 응답에서 찾을 키 (symbol / pair)
};

const ASSET_DEFS: AssetDef[] = [
  { key: "BTC", name: "비트코인", symbol: "BTC", unit: "KRW", source: "crypto", match: "BTC" },
  { key: "ETH", name: "이더리움", symbol: "ETH", unit: "KRW", source: "crypto", match: "ETH" },
  { key: "SOL", name: "솔라나", symbol: "SOL", unit: "KRW", source: "crypto", match: "SOL" },
  { key: "USDKRW", name: "달러/원", symbol: "USD/KRW", unit: "KRW", source: "fx", match: "USD/KRW" },
  { key: "005930.KS", name: "삼성전자", symbol: "005930", unit: "KRW", source: "quotes", match: "005930.KS" },
  { key: "AAPL", name: "Apple", symbol: "AAPL", unit: "USD", source: "quotes", match: "AAPL" },
];

// 라이브 계산된 자산 상태
type LiveAsset = AssetDef & { price: number | null; changePct: number | null };

type Alert = {
  id: number;
  assetKey: string;
  cond: Cond;
  value: number; // 절대 가격 임계값
  channels: Channel[];
  on: boolean;
};

type Bubble = {
  id: number;
  text: string;
  time: string; // HH:MM — 핸들러/인터벌에서만 생성
  channels: Channel[];
};

function fmt(n: number | null, unit: AssetDef["unit"]): string {
  if (n == null) return "—";
  if (unit === "KRW") {
    const digits = n < 10000 ? 2 : 0;
    return "₩" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v: number | null): string {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

// 초기값: 임계값 입력 프리필용 합리적 라운딩
function roundThreshold(price: number, unit: AssetDef["unit"]): number {
  if (unit === "USD") return Math.round(price * 100) / 100;
  if (price >= 1_000_000) return Math.round(price / 100_000) * 100_000;
  if (price >= 10_000) return Math.round(price / 1000) * 1000;
  return Math.round(price);
}

// 초기 예시 버블 (Date 미사용 — 고정 문자열)
const SEED_BUBBLES: Bubble[] = [
  {
    id: -1,
    text: "🔔 실시간 감시를 시작했습니다. 임계값을 설정하면 실제 가격이 교차될 때 알려드립니다.",
    time: "09:00",
    channels: ["telegram"],
  },
];

const SEED_ALERTS: Alert[] = [];

export default function Demo() {
  const [assets, setAssets] = useState<LiveAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<string>("");
  const [pulse, setPulse] = useState(0);

  // 알림 설정 폼
  const [formAsset, setFormAsset] = useState<string>(ASSET_DEFS[0].key);
  const [formCond, setFormCond] = useState<Cond>("gte");
  const [formValue, setFormValue] = useState<string>("");
  const [formTouched, setFormTouched] = useState(false); // 사용자가 임계값을 직접 수정했는지
  const [formChannels, setFormChannels] = useState<Record<Channel, boolean>>({ telegram: true, kakao: false });

  const [alerts, setAlerts] = useState<Alert[]>(SEED_ALERTS);
  const [feed, setFeed] = useState<Bubble[]>(SEED_BUBBLES);

  const idRef = useRef(1);
  const mounted = useRef(true);
  const firedRef = useRef<Set<number>>(new Set()); // 중복 발화 방지 (alert.id)
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  // 최신 시세를 트리거 로직에서 참조 (effect 의존성 최소화)
  const priceRef = useRef<Map<string, number>>(new Map());
  const alertsRef = useRef<Alert[]>(SEED_ALERTS);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const nowHM = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // ---- REAL 트리거 검사: 최신 시세 vs 활성 알림 ----
  const checkTriggers = useCallback((priceMap: Map<string, number>) => {
    const fired: Bubble[] = [];
    for (const al of alertsRef.current) {
      const def = ASSET_DEFS.find((d) => d.key === al.assetKey);
      if (!def) continue;
      const cur = priceMap.get(al.assetKey);
      if (cur == null) continue;

      const hit = al.cond === "gte" ? cur >= al.value : cur <= al.value;

      if (!al.on) {
        firedRef.current.delete(al.id);
        continue;
      }

      if (hit && !firedRef.current.has(al.id)) {
        firedRef.current.add(al.id);
        const emoji = al.cond === "gte" ? "🚨" : "📉";
        const verb = al.cond === "gte" ? "돌파" : "하회";
        fired.push({
          id: idRef.current++,
          text: `${emoji} ${def.name}(${def.symbol})가 ${fmt(al.value, def.unit)}(임계값)을 ${verb}했습니다 · 현재 ${fmt(cur, def.unit)}`,
          time: nowHM(),
          channels: al.channels,
        });
      } else if (!hit && firedRef.current.has(al.id)) {
        // 가격이 임계값 반대편으로 복귀 → 재발화 가능하도록 리셋
        firedRef.current.delete(al.id);
      }
    }
    if (fired.length && mounted.current) {
      setFeed((prev) => [...prev, ...fired]);
    }
  }, []);

  // ---- REAL 시세 로드 ----
  const loadPrices = useCallback(async () => {
    try {
      const [crypto, fx, quotes] = await Promise.all([
        fetch("/api/market?crypto=1").then((r) => r.json()),
        fetch("/api/market?fx=1").then((r) => r.json()),
        fetch("/api/market?quotes=1").then((r) => r.json()),
      ]);
      if (!mounted.current) return;

      const cryptoArr: { symbol: string; krw: number; usd: number; changePct: number }[] = crypto.crypto ?? [];
      const fxArr: { pair: string; rate: number }[] = fx.fx ?? [];
      const quotesArr: { symbol: string; price: number; changePct: number }[] = quotes.quotes ?? [];

      const priceMap = new Map<string, number>();
      const next: LiveAsset[] = ASSET_DEFS.map((def) => {
        let price: number | null = null;
        let changePct: number | null = null;
        if (def.source === "crypto") {
          const row = cryptoArr.find((c) => c.symbol === def.match);
          if (row) {
            price = def.unit === "KRW" ? row.krw : row.usd;
            changePct = row.changePct;
          }
        } else if (def.source === "fx") {
          const row = fxArr.find((f) => f.pair === def.match);
          if (row) price = row.rate; // fx 는 변동률 미제공
        } else {
          const row = quotesArr.find((q) => q.symbol === def.match);
          if (row) {
            price = row.price;
            changePct = row.changePct;
          }
        }
        if (price != null) priceMap.set(def.key, price);
        return { ...def, price, changePct };
      });

      priceRef.current = priceMap;
      setAssets(next);
      setError(null);
      setLoading(false);
      setUpdated(new Date().toLocaleTimeString("ko-KR"));
      setPulse((p) => p + 1);

      // REAL 트리거 검사
      checkTriggers(priceMap);
    } catch {
      if (mounted.current) {
        setError("시세 데이터를 불러오지 못했습니다. 잠시 후 다시 시도됩니다.");
        // 로딩 상태는 유지하지 않고 폴링은 계속
        setLoading((l) => (assets.length ? false : l));
      }
    }
  }, [checkTriggers, assets.length]);

  // 최초 로드 + 18초 폴링
  useEffect(() => {
    loadPrices();
    const id = setInterval(loadPrices, 18000);
    return () => clearInterval(id);
    // loadPrices 는 assets.length 에 의존하지만 폴링 재설정을 원치 않으므로 최초 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // alerts 최신값을 ref 에 동기화 + 알림 추가/토글 시 즉시 재검사
  useEffect(() => {
    alertsRef.current = alerts;
    if (priceRef.current.size) checkTriggers(priceRef.current);
  }, [alerts, checkTriggers]);

  // 새 버블 시 하단 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed.length]);

  // 폼 자산/조건 변경 시 현재가로 임계값 프리필 (사용자가 직접 수정하기 전까지)
  const selected = assets.find((a) => a.key === formAsset);
  useEffect(() => {
    if (formTouched) return;
    if (selected?.price != null) {
      setFormValue(String(roundThreshold(selected.price, selected.unit)));
    }
  }, [formAsset, selected?.price, selected?.unit, formTouched]);

  const addAlert = () => {
    const raw = parseFloat(formValue.replace(/,/g, ""));
    if (!isFinite(raw)) return;
    const chans = (Object.keys(formChannels) as Channel[]).filter((k) => formChannels[k]);
    if (chans.length === 0) return;
    const nid = idRef.current++;
    setAlerts((prev) => [...prev, { id: nid, assetKey: formAsset, cond: formCond, value: raw, channels: chans, on: true }]);
    setFormTouched(false); // 다음 자산 선택 시 다시 프리필
  };

  const removeAlert = (id: number) => {
    firedRef.current.delete(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleAlert = (id: number) => {
    firedRef.current.delete(id); // 재활성화 시 다시 감시
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, on: !a.on } : a)));
  };

  const unitLabel = selected?.unit === "USD" ? "USD" : "KRW";
  const activeCount = alerts.filter((a) => a.on).length;

  return (
    <div className="lx-win palb-win">
      {/* 앱 툴바 — 좌: 아이콘/타이틀, 우: LIVE · 최근 업데이트 · 새로고침 */}
      <div className="lx-win__bar palb-bar">
        <div className="lx-win__title palb-brand">
          <span className="palb-logo">🔔</span>
          <span className="palb-brand__text">
            <span className="palb-brand__name">실시간 알림 봇</span>
            <span className="palb-brand__sub">Price Alert Ops</span>
          </span>
        </div>
        <div className="palb-toolbar">
          <span key={pulse} className="palb-live">
            <span className="palb-live__dot" />
            LIVE
          </span>
          <span className="palb-toolbar__sep" />
          <span className="palb-updated">
            {updated ? (
              <>
                <span className="palb-updated__label">최근 업데이트</span>
                <span className="palb-updated__time lx-mono">{updated}</span>
              </>
            ) : (
              "연결 중…"
            )}
          </span>
          <button
            type="button"
            className="palb-refresh"
            onClick={() => loadPrices()}
            title="지금 새로고침"
            aria-label="지금 새로고침"
          >
            <span className={`palb-refresh__icon${loading ? " is-spinning" : ""}`}>↻</span>
            새로고침
          </button>
        </div>
      </div>

      <div className="lx-win__body palb-body">
        {error && (
          <div className="palb-error">
            <span className="palb-error__icon">⚠</span>
            {error}
          </div>
        )}

        {/* 시세 타일 — 풀폭 LIVE 시세 보드 */}
        <div className="palb-board">
          <div className="palb-board__head">
            <span className="palb-board__title">실시간 시세 보드</span>
            <span className="palb-board__meta">
              <span className="palb-live__dot palb-live__dot--sm" />
              CoinGecko · 환율 · Yahoo Finance 실데이터 · 18초 주기
            </span>
          </div>
          <div className="lx-grid palb-tiles">
            {(loading ? Array.from({ length: 6 }) : assets).map((_, i) => {
              const a = loading ? null : assets[i];
              if (!a) return <div key={i} className="lx-stat palb-tile"><div className="lx-skel" style={{ height: 20, width: "58%", marginBottom: 10 }} /><div className="lx-skel" style={{ height: 22, width: "80%", marginBottom: 8 }} /><div className="lx-skel" style={{ height: 14, width: "42%" }} /></div>;
              const up = (a.changePct ?? 0) >= 0;
              return (
                <div key={a.key} className="lx-stat palb-tile">
                  <span className="lx-stat__label palb-tile__label">
                    {a.name} <span className="lx-sub">· {a.symbol}</span>
                  </span>
                  <span className="lx-stat__value lx-mono palb-tile__value">{fmt(a.price, a.unit)}</span>
                  {a.changePct != null ? (
                    <span className={`lx-stat__delta palb-tile__delta ${up ? "lx-up" : "lx-down"}`}>
                      {up ? "▲" : "▼"} {Math.abs(a.changePct).toFixed(2)}% <span className="lx-sub" style={{ fontWeight: 400 }}>24h</span>
                    </span>
                  ) : (
                    <span className="lx-stat__delta lx-sub palb-tile__delta">실시간</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lx-split palb-split">
          {/* 좌: 알림 설정 + 활성 알림 */}
          <div className="palb-col">
            {/* 알림 설정 폼 */}
            <div className="lx-panel palb-panel">
              <div className="lx-h palb-panel__head">
                <span className="palb-panel__title"><span className="palb-panel__ic">⚙</span> 알림 설정</span>
              </div>

              <div className="lx-grid lx-grid-2" style={{ marginBottom: 12 }}>
                <div>
                  <label className="lx-label">자산</label>
                  <select
                    className="lx-select"
                    value={formAsset}
                    onChange={(e) => {
                      setFormAsset(e.target.value);
                      setFormTouched(false);
                    }}
                    disabled={loading}
                  >
                    {ASSET_DEFS.map((a) => (
                      <option key={a.key} value={a.key}>{a.name} ({a.symbol})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="lx-label">임계값 ({unitLabel})</label>
                  <input
                    className="lx-input"
                    inputMode="decimal"
                    value={formValue}
                    onChange={(e) => {
                      setFormValue(e.target.value);
                      setFormTouched(true);
                    }}
                    placeholder="예: 90000000"
                  />
                </div>
              </div>

              <label className="lx-label">조건</label>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
                {(Object.keys(COND_LABEL) as Cond[]).map((c) => (
                  <button key={c} type="button" className={`lx-toggle${formCond === c ? " is-on" : ""}`} onClick={() => setFormCond(c)}>
                    {COND_LABEL[c]}
                  </button>
                ))}
              </div>

              <label className="lx-label">알림 채널</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {CHANNELS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={`lx-toggle${formChannels[c.key] ? " is-on" : ""}`}
                    onClick={() => setFormChannels((s) => ({ ...s, [c.key]: !s[c.key] }))}
                  >
                    <span style={{ display: "inline-flex", width: 18, height: 18, borderRadius: 5, background: c.color, color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 11, marginRight: 6, verticalAlign: "middle" }}>{c.glyph}</span>
                    {c.name}
                  </button>
                ))}
              </div>

              <button type="button" className="lx-btn lx-btn--primary" style={{ width: "100%" }} onClick={addAlert} disabled={loading}>
                ＋ 알림 추가
              </button>
            </div>

            {/* 활성 알림 목록 */}
            <div className="lx-panel palb-panel palb-panel--flex">
              <div className="lx-h palb-panel__head">
                <span className="palb-panel__title"><span className="palb-panel__ic">📡</span> 활성 알림</span>
                <span className="palb-count"><b>{activeCount}</b> / {alerts.length} 감시 중</span>
              </div>
              {alerts.length === 0 && (
                <div className="palb-empty">
                  <span className="palb-empty__ic">🔕</span>
                  <p className="palb-empty__title">설정된 알림이 없습니다</p>
                  <p className="palb-empty__sub">위에서 자산·임계값을 선택하고 알림을 추가하세요.</p>
                </div>
              )}
              <div className="palb-alerts">
                {alerts.map((al) => {
                  const def = ASSET_DEFS.find((d) => d.key === al.assetKey)!;
                  const live = assets.find((a) => a.key === al.assetKey);
                  const cur = live?.price ?? null;
                  const distPct = cur != null && al.value ? ((cur - al.value) / al.value) * 100 : null;
                  const met = cur != null ? (al.cond === "gte" ? cur >= al.value : cur <= al.value) : false;
                  return (
                    <div
                      key={al.id}
                      className={`lx-card lx-card--tint palb-alert${met && al.on ? " palb-alert--met" : ""}`}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 12px", opacity: al.on ? 1 : 0.6 }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-ink)", fontFamily: "var(--font-geist)" }}>
                          {def.name} <span className="lx-mono" style={{ fontWeight: 800 }}>{COND_LABEL[al.cond]} {fmt(al.value, def.unit)}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--color-slate)", marginTop: 3 }} className="lx-mono">
                          현재 {fmt(cur, def.unit)}
                          {distPct != null && (
                            <span style={{ color: met ? "#1f9d57" : "var(--color-slate)", marginLeft: 6 }}>
                              ({distPct >= 0 ? "+" : ""}{distPct.toFixed(2)}% {met ? "· 도달" : ""})
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                          {al.channels.map((ck) => {
                            const c = CHANNELS.find((x) => x.key === ck)!;
                            return <span key={ck} className="lx-pill lx-pill--info" style={{ fontSize: 10.5 }}>{c.name}</span>;
                          })}
                          <span className={`lx-pill ${al.on ? "lx-pill--ok" : "lx-pill--muted"}`} style={{ fontSize: 10.5 }}>{al.on ? "감시 중" : "꺼짐"}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}>
                        <button
                          type="button"
                          className="lx-toggle"
                          style={al.on ? { background: "var(--color-violet-soft)", color: "var(--color-dusk-violet)", borderColor: "rgba(107,98,242,0.5)", padding: "5px 10px" } : { padding: "5px 10px" }}
                          onClick={() => toggleAlert(al.id)}
                          aria-label="알림 켜기/끄기"
                        >
                          {al.on ? "ON" : "OFF"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAlert(al.id)}
                          aria-label="알림 삭제"
                          style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--color-hairline-strong)", background: "#fff", color: "var(--color-slate)", cursor: "pointer", fontSize: 13, lineHeight: 1 }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 우: 텔레그램 채팅 피드 */}
          <div className="palb-chat">
            {/* 챗 헤더 */}
            <div className="palb-chat__head">
              <span className="palb-chat__avatar">🤖</span>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-geist)" }}>AXONE 알림봇</div>
                <div style={{ fontSize: 11, opacity: 0.85, display: "flex", alignItems: "center", gap: 5 }}>
                  <span className="palb-chat__online" /> bot · 온라인
                </div>
              </div>
              <span className="palb-chat__badge">트리거 피드</span>
            </div>

            {/* 메시지 영역 */}
            <div className="palb-chat__scroll">
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 11, color: "#5f6b76", background: "rgba(255,255,255,0.6)", borderRadius: 10, padding: "3px 10px" }}>오늘</span>
              </div>
              {feed.map((b) => (
                <div key={b.id} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#229ED9", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flex: "0 0 auto" }}>🤖</span>
                  <div style={{ maxWidth: "84%", background: "#fff", borderRadius: "2px 14px 14px 14px", padding: "9px 12px", boxShadow: "0 1px 1px rgba(0,0,0,0.08)" }}>
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: "#1c1c2a" }}>{b.text}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 4 }}>
                      {b.channels.map((ck) => {
                        const c = CHANNELS.find((x) => x.key === ck)!;
                        return (
                          <span key={ck} style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: c.color, borderRadius: 8, padding: "1px 6px" }}>{c.name}</span>
                        );
                      })}
                      <span style={{ fontSize: 10.5, color: "#8a95a0" }} className="lx-mono">{b.time}</span>
                      <span style={{ fontSize: 11, color: "#4fae4f" }}>✓✓</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* 입력창 (표시용) */}
            <div className="palb-chat__input">
              <div className="palb-chat__box">알림봇에게 메시지…</div>
              <span className="palb-chat__send">➤</span>
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="palb-hint">
          <span style={{ fontSize: 18 }}>💡</span>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--color-ash)", lineHeight: 1.55 }}>
            이 데모는 <b style={{ color: "var(--color-ink)" }}>실제 시세</b>를 15~20초마다 폴링하여 임계값 교차 시 앱 내에서 알림을 발화합니다. 실제 Telegram / KakaoTalk 발송은 봇 토큰만 연결하면 그대로 전송됩니다.
          </p>
        </div>
      </div>

      <style>{`
        /* ---- 셸/툴바 ---- */
        .palb-win { box-shadow: 0 22px 60px -34px rgba(20,20,60,0.4); }
        .palb-bar {
          min-height: 56px;
          background: linear-gradient(180deg, #ffffff, #fbfbff);
          border-bottom: 1px solid var(--color-hairline);
        }
        .palb-brand { gap: 11px; }
        .palb-logo {
          width: 34px; height: 34px; border-radius: 10px; flex: 0 0 auto;
          display: inline-flex; align-items: center; justify-content: center; font-size: 17px;
          background: var(--color-violet-soft); border: 1px solid rgba(107,98,242,0.28);
        }
        .palb-brand__text { display: flex; flex-direction: column; line-height: 1.15; }
        .palb-brand__name { font-family: var(--font-geist); font-weight: 800; font-size: 14.5px; color: var(--color-ink); }
        .palb-brand__sub { font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em; color: var(--color-slate); text-transform: uppercase; }

        .palb-toolbar { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
        .palb-toolbar__sep { width: 1px; height: 20px; background: var(--color-hairline-strong); }
        .palb-live {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: #1f9d57;
          background: #e7f7ee; border: 1px solid rgba(31,157,87,0.24); border-radius: 20px; padding: 4px 10px;
        }
        .palb-live__dot { width: 7px; height: 7px; border-radius: 50%; background: #22c07a; box-shadow: 0 0 0 0 rgba(34,192,122,0.5); animation: palbPulse 1.8s infinite; }
        .palb-live__dot--sm { width: 6px; height: 6px; box-shadow: none; animation: palbPulse 1.8s infinite; }
        @keyframes palbPulse { 0% { box-shadow: 0 0 0 0 rgba(34,192,122,0.45); } 70% { box-shadow: 0 0 0 6px rgba(34,192,122,0); } 100% { box-shadow: 0 0 0 0 rgba(34,192,122,0); } }
        .palb-updated { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--color-slate); }
        .palb-updated__label { color: var(--color-slate); }
        .palb-updated__time { color: var(--color-ash); font-weight: 700; }
        .palb-refresh {
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
          font-family: var(--font-geist); font-size: 12.5px; font-weight: 700; color: var(--color-ash);
          background: #fff; border: 1px solid var(--color-hairline-strong); border-radius: 20px; padding: 6px 13px;
          transition: background .15s ease, border-color .15s ease, color .15s ease;
        }
        .palb-refresh:hover { background: var(--color-violet-soft); border-color: rgba(107,98,242,0.5); color: var(--color-dusk-violet); }
        .palb-refresh__icon { font-size: 14px; line-height: 1; display: inline-block; }
        .palb-refresh__icon.is-spinning { animation: palbSpin 0.9s linear infinite; }
        @keyframes palbSpin { to { transform: rotate(360deg); } }

        /* ---- 본문 ---- */
        .palb-body { padding: 18px; }
        .palb-error {
          display: flex; align-items: center; gap: 9px; margin-bottom: 14px; font-size: 13px;
          padding: 11px 14px; border-radius: 12px; color: #b23b3b;
          background: #fdeaea; border: 1px solid rgba(214,69,69,0.4);
        }
        .palb-error__icon { font-size: 15px; }

        /* ---- 시세 보드 ---- */
        .palb-board {
          margin-bottom: 18px; padding: 14px 14px 16px; border-radius: 16px;
          background: linear-gradient(180deg, #fbfbff, #f6f7fc);
          border: 1px solid var(--color-hairline);
        }
        .palb-board__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; padding: 0 2px; }
        .palb-board__title { font-family: var(--font-geist); font-size: 13.5px; font-weight: 800; color: var(--color-ink); }
        .palb-board__meta { display: inline-flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--color-slate); }

        .palb-tiles { grid-template-columns: repeat(6, 1fr); gap: 12px; }
        .palb-tile { transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
        .palb-tile:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -16px rgba(20,20,60,0.4); border-color: var(--color-hairline-strong); }
        .palb-tile__label { font-weight: 600; }
        .palb-tile__value { font-size: 17px; }
        .palb-tile__delta { margin-top: 1px; }
        @media (max-width: 1000px) { .palb-tiles { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 560px) { .palb-tiles { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 360px) { .palb-tiles { grid-template-columns: 1fr; } }

        /* ---- 스플릿 / 컬럼 ---- */
        .palb-split { align-items: stretch; }
        .palb-col { display: flex; flex-direction: column; gap: 16px; }
        .palb-panel { border-radius: 14px; }
        .palb-panel--flex { flex: 1; display: flex; flex-direction: column; }
        .palb-panel__head { margin-bottom: 14px; }
        .palb-panel__title { display: inline-flex; align-items: center; gap: 8px; }
        .palb-panel__ic {
          width: 24px; height: 24px; border-radius: 7px; flex: 0 0 auto;
          display: inline-flex; align-items: center; justify-content: center; font-size: 13px;
          background: var(--color-tint); border: 1px solid var(--color-hairline);
        }
        .palb-count { font-size: 12px; font-weight: 600; color: var(--color-slate); }
        .palb-count b { color: #1f9d57; font-weight: 800; }

        /* ---- 활성 알림 ---- */
        .palb-alerts { display: flex; flex-direction: column; gap: 8px; }
        .palb-alert { transition: border-color .15s ease, box-shadow .15s ease, background .15s ease; border: 1px solid var(--color-hairline); }
        .palb-alert:hover { border-color: var(--color-hairline-strong); box-shadow: 0 6px 16px -14px rgba(20,20,60,0.4); }
        .palb-alert--met { background: #eefaf2; border-color: rgba(31,157,87,0.4); }
        .palb-empty {
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 3px;
          padding: 26px 14px; border: 1px dashed var(--color-hairline-strong); border-radius: 12px; background: var(--color-tint);
        }
        .palb-empty__ic { font-size: 26px; margin-bottom: 4px; opacity: 0.8; }
        .palb-empty__title { margin: 0; font-size: 13.5px; font-weight: 700; color: var(--color-ash); font-family: var(--font-geist); }
        .palb-empty__sub { margin: 0; font-size: 12px; color: var(--color-slate); }

        /* ---- 채팅 피드 ---- */
        .palb-chat {
          border: 1px solid var(--color-hairline-strong); border-radius: 14px; overflow: hidden;
          display: flex; flex-direction: column; background: #e6ebf0; min-height: 480px;
          box-shadow: 0 14px 34px -26px rgba(20,20,60,0.4);
        }
        .palb-chat__head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: linear-gradient(180deg, #5a86ab, #517da2); color: #fff; }
        .palb-chat__avatar { width: 34px; height: 34px; border-radius: 50%; background: #fff; color: #229ED9; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; flex: 0 0 auto; }
        .palb-chat__online { width: 7px; height: 7px; border-radius: 50%; background: #7fe0a1; display: inline-block; }
        .palb-chat__badge { margin-left: auto; font-size: 10.5px; font-weight: 700; color: #fff; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 3px 10px; }
        .palb-chat__scroll { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; max-height: 560px; }
        .palb-chat__input { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #fff; border-top: 1px solid var(--color-hairline); }
        .palb-chat__box { flex: 1; background: var(--color-tint); border-radius: 20px; padding: 9px 14px; font-size: 13px; color: var(--color-slate); }
        .palb-chat__send { width: 34px; height: 34px; border-radius: 50%; background: #229ED9; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; flex: 0 0 auto; }

        /* ---- 안내 힌트 ---- */
        .palb-hint { margin-top: 16px; display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px dashed var(--color-hairline-strong); border-radius: 12px; background: var(--color-tint); }
      `}</style>
    </div>
  );
}
