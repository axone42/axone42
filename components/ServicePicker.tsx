import { PRICE_GROUPS, priceItems, formatKRW } from "@/lib/pricing";
export default function ServicePicker({ ids, onToggle, showScope = false }: { ids: string[]; onToggle: (id: string) => void; showScope?: boolean }) {
  return <div className="contact-picker">{PRICE_GROUPS.map((group) => <div className="pricing__group" key={group}>
    <h3 className="pricing__group-title">{group}</h3>
    <div className="pricing__items">{priceItems.filter((p) => p.group === group).map((p) => <div key={p.id}>
      <button type="button" className={`price-item${ids.includes(p.id) ? " is-on" : ""}`} aria-pressed={ids.includes(p.id)} onClick={() => onToggle(p.id)}>
        <span className="price-item__check" aria-hidden>{ids.includes(p.id) ? "✓" : ""}</span>
        <span className="price-item__body"><span className="price-item__name">{p.name}</span>{p.note && <span className="price-item__note">{p.note}</span>}</span>
        <span className="price-item__price"><b>{formatKRW(p.from)}원{p.exact ? "" : "~"}</b><span>{p.unit}</span></span>
      </button>
      {showScope && <details className="price-scope"><summary>제공 내용과 견적 기준</summary><p>{p.scope}</p><p><b>상담에서 확정할 범위</b><br />{p.confirm}</p></details>}
    </div>)}</div>
  </div>)}</div>;
}
