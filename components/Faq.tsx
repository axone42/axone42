import { faqs, type Faq as FaqItem } from "@/lib/faq";
import StructuredData from "@/components/StructuredData";
import { absoluteUrl } from "@/lib/seo";

export default function Faq({ items = faqs, path = "/" }: { items?: FaqItem[]; path?: string }) {
  return <>
    <StructuredData data={{ "@context": "https://schema.org", "@type": "FAQPage", "@id": `${absoluteUrl(path)}#faq`, mainEntity: items.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
    <div className="faq">{items.map((f, i) => <details className="faq__item" key={f.q} name={`faq-${path}`} open={i === 0}>
      <summary className="faq__q"><h3>{f.q}</h3><span className="faq__icon" aria-hidden /></summary>
      <div className="faq__a"><p>{f.a}</p></div>
    </details>)}</div>
  </>;
}
