"use client";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { selectedItems, resolveIntent } from "@/lib/pricing";
import ServicePicker from "./ServicePicker";
import EstimateSummary from "./EstimateSummary";
import { trackConversion } from "@/lib/analytics";
function PricingSelection({ onChange }: { onChange: (query: string) => void }) {
  const params = useSearchParams();
  const query = params.toString();
  useEffect(() => onChange(query), [query, onChange]);
  return null;
}
export default function PricingCalculator() {
  const [query, setQuery] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  const syncSelection = useCallback((next: string) => {
    setQuery(next); setIds(resolveIntent(new URLSearchParams(next)).ids);
  }, []);
  const selectionParams = (selected: string[]) => {
    const next = new URLSearchParams(query);
    next.set("items", selected.join(","));
    const intent = resolveIntent(next);
    if (intent.serviceId) next.set("service", intent.serviceId); else next.delete("service");
    return next;
  };
  const toggle = (id: string) => {
    trackConversion(ids.includes(id) ? "service_deselect" : "service_select", { service_id: id, source: "pricing" });
    const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
    setIds(next);
    window.history.replaceState(null, "", `/pricing?${selectionParams(next)}${window.location.hash}`);
  };
  const chosen = selectedItems(ids);
  const href = `/contact?${new URLSearchParams([...selectionParams(ids)].filter(([key]) => ["items", "service", "project"].includes(key)))}`;
  return <>
    <Suspense fallback={null}><PricingSelection onChange={syncSelection} /></Suspense>
    <div className="pricing">
      <ServicePicker ids={ids} onToggle={toggle} showScope />
      <aside className="pricing__summary" id="estimate"><div className="pricing__summary-inner">
        <h2 className="estimate-title">선택한 서비스 {chosen.length > 0 && <span>{chosen.length}개</span>}</h2>
        <ul className="pricing__chosen">{chosen.map((p) => <li key={p.id}><span>{p.name}</span><button type="button" className="text-button" onClick={() => toggle(p.id)} aria-label={`${p.name} 선택 해제`}>해제</button></li>)}</ul>
        <EstimateSummary ids={ids} />
        <Link href={href} className="btn btn--primary estimate-cta">{ids.length ? "이 내용으로 무료 상담" : "서비스 선택 없이 무료 상담"}</Link>
        <p className="pricing__disclaimer">여러 서비스의 중복 작업과 조정 가능한 비용은 상담 후 개별 견적으로 안내합니다.</p>
      </div></aside>
    </div>
    {ids.length > 0 && <div className="mobile-estimate"><a href="#estimate">{ids.length}개 선택 · 비용 확인 ↓</a><Link href={href} className="btn btn--primary">무료 상담</Link></div>}
  </>;
}
