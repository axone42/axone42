import { services, type Service } from "@/lib/services";
import { priceItems, serviceIntents, formatKRW, type PriceItem } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/seo";

export function servicePrice(service: Service) { return priceItems.find(p => p.id === serviceIntents[service.id]?.item); }
export function priceLabel(price: PriceItem) {
  return `${price.billing === "monthly" ? "월 " : ""}${formatKRW(price.from)}원${price.exact ? " 기준" : "부터"}${price.monthlyFrom ? `, 운영 월 ${formatKRW(price.monthlyFrom)}원 별도` : ""}`;
}
export function serviceSchema(service: Service) {
  const price = servicePrice(service);
  return {
    "@type": "Service", "@id": `${absoluteUrl(`/services/${service.id}`)}#service`,
    name: service.title, description: service.description, url: absoluteUrl(`/services/${service.id}`),
    provider: { "@id": absoluteUrl("/#organization") }, areaServed: "KR",
    ...(price && { offers: {
      "@type": "Offer", url: absoluteUrl(`/services/${service.id}`), description: `${priceLabel(price)}. ${price.unit}. ${price.scope}. ${price.confirm}에 따라 견적을 확정합니다.`,
      priceSpecification: [
        { "@type": price.billing === "monthly" ? "UnitPriceSpecification" : "PriceSpecification", priceCurrency: "KRW", ...(price.billing === "monthly" ? { unitText: "월" } : {}), ...(price.exact ? { price: price.from } : { minPrice: price.from }), description: `${price.unit} ${price.exact ? "기준 금액" : "시작가"}` },
        ...(price.monthlyFrom ? [{ "@type": "UnitPriceSpecification", priceCurrency: "KRW", price: price.monthlyFrom, unitText: "월", description: "구축비와 별도인 월 운영 기준 금액" }] : []),
      ],
    } }),
  };
}
export const serviceCatalogSchema = {
  "@type": "ItemList", name: "에이엑스원 서비스", itemListElement: services.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.title, url: absoluteUrl(`/services/${s.id}`) })),
};
