import { estimateItems, formatKRW } from "@/lib/pricing";
export default function EstimateSummary({ ids }: { ids: string[] }) {
  const e = estimateItems(ids);
  if (!e.items.length) return <p className="pricing__empty">서비스를 정하지 않아도 무료 상담을 신청할 수 있습니다.</p>;
  return <div className="estimate-breakdown" aria-live="polite" aria-atomic="true">
    {e.hasInitial && <div><span>초기 비용{e.initialVariable ? " · 시작가" : " · 기준 금액"}</span><strong>{formatKRW(e.initial)}원{e.initialVariable ? "~" : ""}</strong></div>}
    {e.hasMonthly && <div><span>월 운영·대행료</span><strong>{formatKRW(e.monthly)}원{e.monthlyVariable ? "~" : ""}<small> / 월</small></strong></div>}
    {!e.hasMonthly && <p>월 운영이 필요한 경우 별도 견적을 안내합니다.</p>}
    <p>범위에 따라 최종 금액을 확정합니다. API·호스팅·광고 매체비 등 외부 사용료와 부가세 포함 여부는 견적서에서 구분해 안내합니다.</p>
  </div>;
}
