"use client";

import { useMemo, useState } from "react";

/* ============================================================
   경쟁사 가격·재고 모니터링 스크래퍼 — 데모용, 모든 데이터 클라이언트 목업.
   초기 렌더는 고정 시드만 사용(하이드레이션 불일치 방지).
   시간/토글은 useEffect·핸들러 안에서만 사용.
   ============================================================ */

type Mall = "네이버" | "쿠팡" | "11번가";

const MALL_STYLE: Record<Mall, { bg: string; color: string }> = {
  네이버: { bg: "#e7f7ee", color: "#1f9d57" },
  쿠팡: { bg: "#fdeaea", color: "#d64545" },
  "11번가": { bg: "#fdf3e0", color: "#c98a12" },
};

type Product = {
  id: string;
  name: string;
  mall: Mall;
  target: number; // 목표가
  // 최근 가격 시계열 (고정 시드). 마지막 값이 현재가.
  series: number[];
  inStock: boolean;
};

/** 최근 가격 시계열 시드 (원 단위, 결정적) */
const INITIAL: Product[] = [
  { id: "p1", name: "무선 이어폰 Pro", mall: "쿠팡", target: 159000, inStock: true, series: [189000, 185000, 182000, 179000, 176000, 172000, 168000, 165000] },
  { id: "p2", name: "로봇청소기 X20", mall: "네이버", target: 499000, inStock: true, series: [559000, 552000, 548000, 545000, 539000, 532000, 528000, 519000] },
  { id: "p3", name: "캡슐커피 머신", mall: "11번가", target: 129000, inStock: false, series: [149000, 148000, 145000, 142000, 139000, 138000, 135000, 132000] },
  { id: "p4", name: "게이밍 모니터 27", mall: "쿠팡", target: 289000, inStock: true, series: [329000, 325000, 322000, 318000, 315000, 312000, 309000, 305000] },
  { id: "p5", name: "블루투스 키보드", mall: "네이버", target: 79000, inStock: true, series: [95000, 93000, 92000, 90000, 89000, 88000, 86000, 84000] },
];

function won(n: number): string {
  return "₩" + Math.round(n).toLocaleString("en-US");
}

/** 현재가 = 시계열 마지막 값 */
function cur(p: Product): number {
  return p.series[p.series.length - 1];
}

/** 변동률(직전 대비, %) */
function deltaPct(p: Product): number {
  const s = p.series;
  const prev = s[s.length - 2];
  const now = s[s.length - 1];
  return Math.round(((now - prev) / prev) * 10000) / 100;
}

/** 스캔 시 적용할 결정적 프리셋 사이클 (상품별 가격/재고 변화) */
const SCAN_STEPS: { drop: Record<string, number>; stock: Record<string, boolean> }[] = [
  { drop: { p1: 3000, p4: 4000 }, stock: { p3: true } }, // 이어폰·모니터 하락, 캡슐커피 재입고
  { drop: { p2: 6000, p5: 2000 }, stock: { p1: false } }, // 로봇청소기·키보드 하락, 이어폰 품절
  { drop: { p3: 2500, p1: 1500 }, stock: { p1: true, p3: false } }, // 캡슐커피·이어폰 하락, 재고 토글
];

type Alert = { id: number; tone: "ok" | "info" | "danger"; icon: string; text: string; time: string };

/** 하이드레이션 안전: 초기엔 고정 시각, 스캔 시 실제 시각 부여 */
function nowHM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const SEED_ALERTS: Alert[] = [
  { id: 3, tone: "danger", icon: "🚫", text: "캡슐커피 머신 · 11번가 품절 감지", time: "09:41" },
  { id: 2, tone: "ok", icon: "🎯", text: "무선 이어폰 Pro 목표가 근접 (₩165,000)", time: "09:32" },
  { id: 1, tone: "info", icon: "📉", text: "로봇청소기 X20 최저가 갱신 (₩519,000)", time: "09:18" },
];

/** 미니 스파크라인 SVG */
function Spark({ data, down }: { data: number[]; down: boolean }) {
  const W = 96;
  const H = 34;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => 4 + (1 - (v - min) / span) * (H - 8);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const color = down ? "#1f9d57" : "#d64545";
  const gid = `spk-${data[0]}-${data[data.length - 1]}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="2.6" fill={color} />
    </svg>
  );
}

export default function Demo() {
  const [products, setProducts] = useState<Product[]>(INITIAL);
  const [scanning, setScanning] = useState(false);
  const [scanIdx, setScanIdx] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>(SEED_ALERTS);
  const [nextId, setNextId] = useState(100);

  // 신규 감시 상품 폼
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const addProduct = () => {
    const name = newName.trim();
    const target = parseInt(newTarget.replace(/[^\d]/g, ""), 10);
    if (!name || !target) return;
    const base = target > 0 ? Math.round(target * 1.18) : 100000;
    const series = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => Math.round(base - (base - target * 1.02) * (i / 7)));
    const malls: Mall[] = ["네이버", "쿠팡", "11번가"];
    const mall = malls[name.length % 3];
    setProducts((ps) => [
      ...ps,
      { id: `u${nextId}`, name, mall, target, inStock: true, series },
    ]);
    setNextId((n) => n + 1);
    setNewName("");
    setNewTarget("");
  };

  const scan = () => {
    if (scanning) return;
    setScanning(true);
    const step = SCAN_STEPS[scanIdx % SCAN_STEPS.length];
    window.setTimeout(() => {
      const t = nowHM();
      const newAlerts: Alert[] = [];
      let idCounter = nextId;

      setProducts((ps) =>
        ps.map((p) => {
          let series = p.series;
          let inStock = p.inStock;
          if (step.drop[p.id] != null) {
            const next = Math.max(Math.round(cur(p) * 0.6), cur(p) - step.drop[p.id]);
            series = [...p.series.slice(1), next];
            newAlerts.push({
              id: idCounter++,
              tone: next <= p.target ? "ok" : "info",
              icon: next <= p.target ? "🎯" : "📉",
              text:
                next <= p.target
                  ? `${p.name} · ${p.mall} 목표가 달성 (${won(next)})`
                  : `${p.name} · ${p.mall} 최저가 갱신 (${won(next)})`,
              time: t,
            });
          }
          if (step.stock[p.id] != null) {
            inStock = step.stock[p.id];
            newAlerts.push({
              id: idCounter++,
              tone: inStock ? "ok" : "danger",
              icon: inStock ? "📦" : "🚫",
              text: inStock ? `${p.name} · ${p.mall} 재입고 감지` : `${p.name} · ${p.mall} 품절 감지`,
              time: t,
            });
          }
          return { ...p, series, inStock };
        })
      );

      if (newAlerts.length > 0) {
        setNextId(idCounter);
        setAlerts((a) => [...newAlerts.reverse(), ...a].slice(0, 8));
      }
      setScanIdx((i) => i + 1);
      setScanning(false);
    }, 800);
  };

  // 통계 (파생값)
  const stats = useMemo(() => {
    const total = products.length;
    const drops = products.filter((p) => deltaPct(p) < 0).length;
    const soldOut = products.filter((p) => !p.inStock).length;
    const atLow = products.filter((p) => cur(p) === Math.min(...p.series)).length;
    return { total, drops, soldOut, atLow };
  }, [products]);

  return (
    <div className="lx-win pm">
      {/* 앱 툴바 */}
      <div className="lx-win__bar pm-bar">
        <div className="pm-bar__brand">
          <span className="pm-bar__glyph" aria-hidden="true">📉</span>
          <div className="pm-bar__id">
            <span className="pm-bar__name">가격 모니터</span>
            <span className="pm-bar__live">
              <i className="pm-bar__dot" aria-hidden="true" />
              실시간 감시 중
            </span>
          </div>
        </div>
        <div className="pm-bar__actions">
          <span className="pm-bar__count">
            <b>{stats.total}</b> 상품 추적
          </span>
          <button
            type="button"
            className="lx-btn lx-btn--ghost pm-bar__btn"
            onClick={scan}
            disabled={scanning}
            title="감시 목록 새로고침"
          >
            새로고침
          </button>
          <button
            type="button"
            className="lx-btn lx-btn--primary pm-bar__btn"
            onClick={scan}
            disabled={scanning}
          >
            {scanning ? (
              <span className="pm-bar__scanning">
                <span className="pm-spin" aria-hidden="true" />
                스캔 중…
              </span>
            ) : (
              "🔄 지금 스캔"
            )}
          </button>
        </div>
      </div>

      <div className="lx-win__body pm-body">
        {/* 상단 통계 */}
        <div className="lx-grid lx-grid-4 pm-stats">
          <div className="lx-stat pm-stat">
            <span className="lx-stat__label">모니터링 상품 수</span>
            <span className="lx-stat__value lx-mono">{stats.total}</span>
            <span className="lx-stat__delta lx-muted">실시간 추적 중</span>
          </div>
          <div className="lx-stat pm-stat">
            <span className="lx-stat__label">가격 하락</span>
            <span className="lx-stat__value lx-mono lx-up">{stats.drops}</span>
            <span className="lx-stat__delta lx-up">▼ 최근 스캔 기준</span>
          </div>
          <div className="lx-stat pm-stat">
            <span className="lx-stat__label">품절 감지</span>
            <span className="lx-stat__value lx-mono lx-down">{stats.soldOut}</span>
            <span className="lx-stat__delta lx-down">재고 부족 알림</span>
          </div>
          <div className="lx-stat pm-stat">
            <span className="lx-stat__label">최저가 갱신</span>
            <span className="lx-stat__value lx-mono">{stats.atLow}</span>
            <span className="lx-stat__delta lx-muted">신저가 도달</span>
          </div>
        </div>

        <div className="pm-main">
          {/* 감시 목록 + 컨트롤 */}
          <div className="lx-card pm-card pm-watch">
            <div className="lx-h pm-h">
              <span className="pm-h__label">
                감시 상품
                <span className="pm-h__count">{stats.total}</span>
              </span>
              <button
                type="button"
                className="lx-btn lx-btn--primary pm-scan-inline"
                onClick={scan}
                disabled={scanning}
              >
                {scanning ? "스캔 중…" : "🔄 지금 스캔"}
              </button>
            </div>

            <div className="pm-tablewrap">
              <table className="lx-table pm-table">
                <thead>
                  <tr>
                    <th>상품명</th>
                    <th>쇼핑몰</th>
                    <th style={{ textAlign: "right" }}>현재가</th>
                    <th style={{ textAlign: "right" }}>목표가</th>
                    <th style={{ textAlign: "center" }}>변동</th>
                    <th style={{ textAlign: "center" }}>재고</th>
                    <th style={{ textAlign: "right" }}>추이</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const price = cur(p);
                    const dp = deltaPct(p);
                    const down = dp < 0;
                    const hit = price <= p.target;
                    const ms = MALL_STYLE[p.mall];
                    return (
                      <tr key={p.id} className={hit ? "pm-row pm-row--hit" : "pm-row"}>
                        <td className="lx-strong pm-name">
                          <span className="pm-name__text">{p.name}</span>
                          {hit && (
                            <span className="lx-pill lx-pill--ok pm-tag">목표가 달성</span>
                          )}
                        </td>
                        <td>
                          <span
                            className="lx-pill pm-mall"
                            style={{ background: ms.bg, color: ms.color }}
                          >
                            {p.mall}
                          </span>
                        </td>
                        <td className="lx-mono lx-strong pm-price" style={{ textAlign: "right", color: "var(--color-ink)" }}>{won(price)}</td>
                        <td className="lx-mono pm-target" style={{ textAlign: "right" }}>{won(p.target)}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`lx-pill ${down ? "lx-pill--ok" : "lx-pill--danger"} pm-delta`}>
                            {down ? "▼" : "▲"} {Math.abs(dp)}%
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`lx-pill ${p.inStock ? "lx-pill--ok" : "lx-pill--danger"}`}>
                            {p.inStock ? "재고있음" : "품절"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="pm-spark">
                            <Spark data={p.series} down={down} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 감시 상품 추가 폼 */}
            <div className="pm-add">
              <div className="pm-add__field pm-add__field--name">
                <label className="lx-label">상품명</label>
                <input
                  className="lx-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예) 스마트워치 5"
                  onKeyDown={(e) => e.key === "Enter" && addProduct()}
                />
              </div>
              <div className="pm-add__field pm-add__field--target">
                <label className="lx-label">목표가 (원)</label>
                <input
                  className="lx-input"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="예) 199000"
                  inputMode="numeric"
                  onKeyDown={(e) => e.key === "Enter" && addProduct()}
                />
              </div>
              <button type="button" className="lx-btn lx-btn--ghost pm-add__btn" onClick={addProduct}>
                ＋ 감시 상품 추가
              </button>
            </div>
          </div>

          {/* 변동/알림 피드 */}
          <div className="lx-card pm-card pm-feed">
            <div className="lx-h pm-h">
              <span className="pm-h__label">변동 알림</span>
              <span className="lx-sub">최근 {alerts.length}건</span>
            </div>
            {alerts.length === 0 ? (
              <div className="pm-empty">
                <span className="pm-empty__icon" aria-hidden="true">🔔</span>
                <p className="pm-empty__text">아직 감지된 변동이 없습니다.<br />스캔을 실행하면 여기에 표시됩니다.</p>
              </div>
            ) : (
              <div className="pm-alerts">
                {alerts.map((a) => (
                  <div key={a.id} className="pm-alert">
                    <span className={`pm-alert__icon pm-alert__icon--${a.tone}`} aria-hidden="true">{a.icon}</span>
                    <div className="pm-alert__body">
                      <div className="pm-alert__text">{a.text}</div>
                      <span className={`lx-pill lx-pill--${a.tone} pm-alert__time`}>{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="pm-channels">
              <span className="pm-channels__label">자동 발송 채널</span>
              <div className="pm-channels__row">
                <span className="pm-channel">Slack</span>
                <span className="pm-channel">이메일</span>
                <span className="pm-channel">문자</span>
              </div>
              <p className="pm-channels__note">가격 하락·품절·최저가 감지 시 즉시 자동 알림됩니다.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pm { display: flex; flex-direction: column; }

        /* ---- 앱 툴바 ---- */
        .pm-bar {
          background: linear-gradient(180deg, #ffffff, #fbfbff);
          min-height: 56px;
          padding: 0 18px;
        }
        .pm-bar__brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
        .pm-bar__glyph {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 10px; font-size: 17px;
          background: var(--color-violet-soft); border: 1px solid rgba(107,98,242,0.18);
        }
        .pm-bar__id { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .pm-bar__name {
          font-family: var(--font-geist); font-weight: 800; font-size: 15px;
          color: var(--color-ink); line-height: 1.2;
        }
        .pm-bar__live {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 600; color: #1f9d57;
        }
        .pm-bar__dot {
          width: 7px; height: 7px; border-radius: 50%; background: #1f9d57;
          box-shadow: 0 0 0 0 rgba(31,157,87,0.5); animation: pmpulse 2s infinite;
        }
        @keyframes pmpulse {
          0% { box-shadow: 0 0 0 0 rgba(31,157,87,0.45); }
          70% { box-shadow: 0 0 0 6px rgba(31,157,87,0); }
          100% { box-shadow: 0 0 0 0 rgba(31,157,87,0); }
        }
        .pm-bar__actions { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
        .pm-bar__count {
          font-size: 12.5px; color: var(--color-slate); white-space: nowrap;
          padding-right: 10px; border-right: 1px solid var(--color-hairline);
        }
        .pm-bar__count b { color: var(--color-ink); font-family: var(--font-geist); font-weight: 800; }
        .pm-bar__btn { padding: 8px 15px; font-size: 13px; border-radius: 9px; }
        .pm-bar__scanning { display: inline-flex; align-items: center; gap: 7px; }
        .pm-spin {
          width: 13px; height: 13px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
          animation: pmspin .7s linear infinite;
        }
        @keyframes pmspin { to { transform: rotate(360deg); } }

        /* ---- 본문 ---- */
        .pm-body { padding: 20px; }
        .pm-stats { margin-bottom: 18px; }
        .pm-stat { transition: border-color .15s ease, box-shadow .15s ease; }
        .pm-stat:hover { border-color: var(--color-hairline-strong); box-shadow: 0 6px 18px -14px rgba(20,20,50,0.3); }

        .pm-main {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 340px);
          gap: 18px;
          align-items: start;
        }
        .pm-card { padding: 16px 18px; }

        /* 섹션 헤더 */
        .pm-h { margin-bottom: 14px; }
        .pm-h__label { display: inline-flex; align-items: center; gap: 8px; }
        .pm-h__count {
          font-family: var(--font-geist); font-size: 11.5px; font-weight: 800;
          color: var(--color-dusk-violet); background: var(--color-violet-soft);
          border-radius: 20px; padding: 2px 9px; line-height: 1.6;
        }
        .pm-scan-inline { display: none; padding: 8px 14px; font-size: 13px; }

        /* 테이블 */
        .pm-tablewrap {
          overflow-x: auto; margin: 0 -18px;
          border-top: 1px solid var(--color-hairline);
        }
        .pm-table { min-width: 760px; }
        .pm-table th { padding: 10px 12px; background: #fbfbfe; }
        .pm-table th:first-child { padding-left: 18px; }
        .pm-table th:last-child { padding-right: 18px; }
        .pm-table td { padding: 13px 12px; vertical-align: middle; }
        .pm-table td:first-child { padding-left: 18px; }
        .pm-table td:last-child { padding-right: 18px; }
        .pm-row td { transition: background .12s ease; }
        .pm-row:hover td { background: #f7f7ff; }
        .pm-row--hit td:first-child { box-shadow: inset 3px 0 0 #1f9d57; }
        .pm-name { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .pm-name__text { font-size: 13.5px; }
        .pm-tag { font-size: 10.5px !important; padding: 2px 8px !important; }
        .pm-mall { font-size: 11px !important; }
        .pm-price { font-size: 13.5px; }
        .pm-target { color: var(--color-slate); }
        .pm-delta { font-size: 10.5px !important; }
        .pm-spark {
          display: inline-flex; padding: 4px 6px; border-radius: 8px;
          background: #fafaff; border: 1px solid var(--color-tint);
        }

        /* 추가 폼 */
        .pm-add {
          display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;
          margin-top: 16px; padding: 16px; border-radius: 12px;
          background: var(--color-tint); border: 1px solid var(--color-hairline);
        }
        .pm-add__field { min-width: 0; }
        .pm-add__field--name { flex: 2 1 200px; }
        .pm-add__field--target { flex: 1 1 140px; }
        .pm-add__btn { flex: 0 0 auto; }

        /* 알림 피드 */
        .pm-feed { position: sticky; top: 68px; }
        .pm-alerts { display: flex; flex-direction: column; }
        .pm-alert {
          display: flex; align-items: flex-start; gap: 11px;
          padding: 11px 0; border-top: 1px solid var(--color-tint);
        }
        .pm-alert:first-child { border-top: none; padding-top: 2px; }
        .pm-alert__icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 9px; font-size: 15px; flex: 0 0 auto;
        }
        .pm-alert__icon--ok { background: #e7f7ee; }
        .pm-alert__icon--info { background: #e8f0fd; }
        .pm-alert__icon--danger { background: #fdeaea; }
        .pm-alert__body { min-width: 0; flex: 1; }
        .pm-alert__text { font-size: 13px; color: var(--color-ink); line-height: 1.45; }
        .pm-alert__time { margin-top: 5px; font-size: 10.5px !important; }

        /* 빈 상태 */
        .pm-empty { text-align: center; padding: 28px 10px; }
        .pm-empty__icon { font-size: 26px; opacity: 0.6; }
        .pm-empty__text { margin: 10px 0 0; font-size: 12.5px; color: var(--color-slate); line-height: 1.55; }

        /* 발송 채널 */
        .pm-channels {
          margin-top: 14px; padding-top: 14px;
          border-top: 1px dashed var(--color-hairline-strong);
        }
        .pm-channels__label { font-size: 11px; font-weight: 700; color: var(--color-slate); letter-spacing: 0.02em; }
        .pm-channels__row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .pm-channel {
          font-size: 11.5px; font-weight: 600; color: var(--color-ash);
          background: var(--color-tint); border: 1px solid var(--color-hairline);
          border-radius: 8px; padding: 4px 10px;
        }
        .pm-channels__note { margin: 10px 0 0; font-size: 11.5px; color: var(--color-slate); line-height: 1.5; }

        @media (max-width: 900px) {
          .pm-main { grid-template-columns: 1fr; }
          .pm-feed { position: static; }
        }
        @media (max-width: 620px) {
          .pm-bar__count { display: none; }
          .pm-bar__actions .pm-bar__btn:first-of-type { display: none; }
          .pm-body { padding: 14px; }
        }
      `}</style>
    </div>
  );
}
