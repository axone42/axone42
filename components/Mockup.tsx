// 외부 이미지 없이 자체 렌더링하는 제품 목업 (Windows 창 + SVG/CSS)

/* ---------- Windows 11 스타일 창 프레임 ---------- */
function Win({
  label,
  icon,
  bodyClass,
  children,
}: {
  label: string;
  icon: string;
  bodyClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="win">
      <div className="win__bar">
        <div className="win__title">
          <span className="win__ico" aria-hidden>{icon}</span>
          <span className="win__name">{label}</span>
        </div>
        <div className="win__ctls" aria-hidden>
          <span className="win__ctl" title="최소화">
            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="5" width="8" height="1" fill="currentColor" /></svg>
          </span>
          <span className="win__ctl" title="최대화">
            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
          </span>
          <span className="win__ctl win__ctl--close" title="닫기">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" strokeWidth="1.2" /></svg>
          </span>
        </div>
      </div>
      <div className={`win__body${bodyClass ? " " + bodyClass : ""}`}>{children}</div>
    </div>
  );
}

/* =========================================================
   1) n8n 워크플로우 — 실제 에디터 스크린샷
   ========================================================= */
export function WorkflowMockup() {
  return (
    <Win label="n8n · 워크플로우 자동화" icon="🔗" bodyClass="win__body--flat">
      <figure className="n8nshot">
        <img
          className="n8nshot__img"
          src="/n8n-workflow.png"
          alt="n8n 워크플로우 에디터 캔버스 — Schedule Trigger에서 API 호출·분기·전송까지 이어지는 자동화"
          width={1259}
          height={742}
          loading="lazy"
        />
        <figcaption className="n8nshot__cap">실제 n8n 에디터 화면 · 출처: n8n 공식 문서 예시 워크플로우</figcaption>
      </figure>
    </Win>
  );
}

/* =========================================================
   2) ERP 대시보드
   ========================================================= */
const erpNav = [
  { icon: "▦", label: "대시보드", active: true },
  { icon: "🧾", label: "주문" },
  { icon: "📦", label: "재고" },
  { icon: "👥", label: "고객" },
  { icon: "📈", label: "리포트" },
  { icon: "⚙", label: "설정" },
];

const erpKpis = [
  { label: "오늘 매출", value: "₩12,480,000", delta: "▲ 12.4%", up: true },
  { label: "신규 주문", value: "342", delta: "▲ 8.1%", up: true },
  { label: "자동 처리율", value: "98.2%", delta: "▲ 2.3%", up: true },
  { label: "처리 대기", value: "7", delta: "▼ 15%", up: true },
];

const erpChannels = [
  { name: "자사몰", pct: 46, color: "#6b62f2" },
  { name: "네이버", pct: 28, color: "#22a565" },
  { name: "쿠팡", pct: 18, color: "#f2a641" },
  { name: "카카오", pct: 8, color: "#f2c14e" },
];

const erpOrders = [
  { id: "#10482", name: "김서연", amount: "₩128,000", status: "완료", cls: "ok" },
  { id: "#10481", name: "이준호", amount: "₩64,500", status: "배송중", cls: "ship" },
  { id: "#10480", name: "박민지", amount: "₩312,000", status: "완료", cls: "ok" },
  { id: "#10479", name: "정하늘", amount: "₩24,900", status: "결제대기", cls: "wait" },
];

// 월별 매출 area chart 좌표 (0~100 스케일)
const revPts = [28, 42, 38, 55, 49, 68, 62, 80, 74, 88];

export function DashboardMockup() {
  const W = 300;
  const H = 96;
  const step = W / (revPts.length - 1);
  const line = revPts.map((p, i) => `${i * step},${H - (p / 100) * H}`).join(" ");
  const area = `0,${H} ${line} ${W},${H}`;

  return (
    <Win label="AXONE ERP — 대시보드" icon="◆" bodyClass="win__body--flat">
      <div className="erp">
        <aside className="erp__side">
          <div className="erp__brand"><span>◆</span> AXONE ERP</div>
          <nav className="erp__nav">
            {erpNav.map((n) => (
              <div key={n.label} className={`erp__navitem${n.active ? " is-active" : ""}`}>
                <span className="erp__navico" aria-hidden>{n.icon}</span>
                {n.label}
              </div>
            ))}
          </nav>
        </aside>

        <div className="erp__main">
          <div className="erp__top">
            <div className="erp__crumb">대시보드 <span>· 2026년 8월 11일</span></div>
            <div className="erp__topright">
              <span className="erp__search">🔍 검색</span>
              <span className="erp__bell">🔔</span>
              <span className="erp__avatar">A</span>
            </div>
          </div>

          <div className="erp__kpis">
            {erpKpis.map((k) => (
              <div key={k.label} className="erp__kpi">
                <span className="erp__kpi-label">{k.label}</span>
                <strong className="erp__kpi-value">{k.value}</strong>
                <span className={`erp__kpi-delta${k.up ? " up" : " down"}`}>{k.delta}</span>
              </div>
            ))}
          </div>

          <div className="erp__grid">
            <div className="erp__card">
              <div className="erp__card-head">
                <span>매출 추이</span>
                <span className="erp__chip">최근 10일</span>
              </div>
              <svg className="erp__chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="erpfill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#6b62f2" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#6b62f2" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((g) => (
                  <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke="#ecebf5" strokeWidth="1" />
                ))}
                <polygon points={area} fill="url(#erpfill)" />
                <polyline points={line} fill="none" stroke="#6b62f2" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </div>

            <div className="erp__card">
              <div className="erp__card-head"><span>채널별 매출</span></div>
              <div className="erp__channels">
                {erpChannels.map((c) => (
                  <div key={c.name} className="erp__ch">
                    <div className="erp__ch-top">
                      <span>{c.name}</span>
                      <b>{c.pct}%</b>
                    </div>
                    <div className="erp__ch-track">
                      <span className="erp__ch-fill" style={{ width: `${c.pct}%`, background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="erp__card erp__tablecard">
            <div className="erp__card-head"><span>최근 주문</span><span className="erp__chip">실시간</span></div>
            <table className="erp__table">
              <thead>
                <tr><th>주문번호</th><th>고객</th><th>금액</th><th>상태</th></tr>
              </thead>
              <tbody>
                {erpOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.name}</td>
                    <td>{o.amount}</td>
                    <td><span className={`epill epill--${o.cls}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Win>
  );
}

/* =========================================================
   3) AI 챗봇
   ========================================================= */
export function ChatMockup() {
  return (
    <Win label="AXONE 상담봇" icon="🤖" bodyClass="win__body--flat">
      <div className="cw">
        <div className="cw__head">
          <span className="cw__ava">🤖</span>
          <div className="cw__id">
            <b>AXONE 상담봇</b>
            <span className="cw__status"><i /> 온라인 · 평균 응답 2초</span>
          </div>
          <span className="cw__more">⋯</span>
        </div>

        <div className="cw__body">
          <div className="cw__day">오늘</div>

          <div className="cw__row cw__row--in">
            <span className="cw__avatar">🤖</span>
            <div className="cw__bubble cw__bubble--in">
              안녕하세요, AXONE 상담봇입니다. 무엇을 도와드릴까요?
              <span className="cw__time">오후 2:14</span>
            </div>
          </div>

          <div className="cw__row cw__row--out">
            <div className="cw__bubble cw__bubble--out">
              환불 규정이 어떻게 되나요?
              <span className="cw__time">오후 2:14</span>
            </div>
          </div>

          <div className="cw__row cw__row--in">
            <span className="cw__avatar">🤖</span>
            <div className="cw__bubble cw__bubble--in">
              구매 후 7일 이내 미개봉 상품은 전액 환불됩니다. 주문번호를 알려주시면 바로 조회해 드릴게요.
              <span className="cw__time">오후 2:14</span>
            </div>
          </div>

          <div className="cw__row cw__row--out">
            <div className="cw__bubble cw__bubble--out">
              주문번호 10482요
              <span className="cw__time">오후 2:15</span>
            </div>
          </div>

          <div className="cw__row cw__row--in">
            <span className="cw__avatar">🤖</span>
            <div className="cw__bubble cw__bubble--typing" aria-label="입력 중">
              <i /><i /><i />
            </div>
          </div>

          <div className="cw__quick">
            <span className="cw__chip">환불 문의</span>
            <span className="cw__chip">배송 조회</span>
            <span className="cw__chip">상담원 연결</span>
          </div>
        </div>

        <div className="cw__input">
          <span className="cw__field">메시지를 입력하세요…</span>
          <span className="cw__send" aria-hidden>➤</span>
        </div>
      </div>
    </Win>
  );
}
