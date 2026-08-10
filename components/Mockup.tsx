// 외부 이미지 없이 자체 렌더링하는 제품 목업 (SVG + CSS)

function WindowChrome({ label }: { label: string }) {
  return (
    <div className="mock__bar">
      <span className="mock__dot" style={{ background: "#e6a05f" }} />
      <span className="mock__dot" style={{ background: "#c85c68" }} />
      <span className="mock__dot" style={{ background: "#6b62f2" }} />
      <span className="mock__label">{label}</span>
    </div>
  );
}

export function WorkflowMockup() {
  return (
    <div className="mock">
      <WindowChrome label="AXONE · n8n workflow" />
      <div className="mock__body">
        <svg viewBox="0 0 520 260" width="100%" role="img" aria-label="자동화 워크플로우 다이어그램">
          <defs>
            <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6b62f2" stopOpacity="0.2" />
              <stop offset="1" stopColor="#6b62f2" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* edges */}
          <path d="M110 70 H180" stroke="url(#edge)" strokeWidth="2" fill="none" />
          <path d="M290 70 H360" stroke="url(#edge)" strokeWidth="2" fill="none" />
          <path d="M235 100 C235 150 235 150 235 168 M235 168 H110 V190" stroke="url(#edge)" strokeWidth="2" fill="none" />
          <path d="M235 168 H410 V190" stroke="url(#edge)" strokeWidth="2" fill="none" />

          {/* nodes */}
          {node(40, 52, "Webhook", "리드 수신", "#e6a05f")}
          {node(180, 52, "AI 분류", "GPT", "#6b62f2")}
          {node(360, 52, "CRM 등록", "Notion", "#3a6bd6")}
          {node(40, 190, "Slack 알림", "담당자", "#6b62f2")}
          {node(340, 190, "Google Sheet", "기록", "#3a6bd6")}
        </svg>
      </div>
    </div>
  );
}

function node(x: number, y: number, title: string, sub: string, color: string) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="140" height="48" rx="10" fill="rgba(212,212,212,0.06)" stroke="rgba(229,229,229,0.18)" />
      <circle cx="20" cy="24" r="6" fill={color} />
      <text x="38" y="20" fill="#ededed" fontSize="13" fontFamily="system-ui" fontWeight="500">{title}</text>
      <text x="38" y="36" fill="#8a8a8a" fontSize="11" fontFamily="system-ui">{sub}</text>
    </g>
  );
}

export function DashboardMockup() {
  const bars = [42, 68, 55, 80, 62, 91, 74];
  return (
    <div className="mock">
      <WindowChrome label="AXONE · dashboard" />
      <div className="mock__body">
        <div className="dash">
          <div className="dash__row">
            <div className="dash__kpi"><span>절감 시간</span><strong>1,240h</strong></div>
            <div className="dash__kpi"><span>자동 처리</span><strong>98.2%</strong></div>
            <div className="dash__kpi"><span>오류</span><strong>0.3%</strong></div>
          </div>
          <div className="dash__chart" aria-hidden>
            {bars.map((h, i) => (
              <span key={i} className="dash__bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatMockup() {
  return (
    <div className="mock">
      <WindowChrome label="AXONE · AI chatbot" />
      <div className="mock__body">
        <div className="chat">
          <div className="chat__bubble chat__bubble--in">환불 규정이 어떻게 되나요?</div>
          <div className="chat__bubble chat__bubble--out">
            구매 후 7일 이내 미개봉 상품은 전액 환불됩니다. 주문번호를 알려주시면 바로 처리해 드릴게요. 🤖
          </div>
          <div className="chat__bubble chat__bubble--in">주문번호 10482요</div>
          <div className="chat__bubble chat__bubble--out">확인했습니다. 환불 접수 완료 — 2~3일 내 입금됩니다.</div>
        </div>
      </div>
    </div>
  );
}
