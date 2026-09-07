import Link from "next/link";
import StructuredData from "@/components/StructuredData";
import { absoluteUrl } from "@/lib/seo";

export default function PageSeo({ path, title, description, type = "WebPage", parent, entities = [] }: {
  path: string; title: string; description?: string; type?: string;
  parent?: { path: string; title: string }; entities?: Record<string, unknown>[];
}) {
  const crumbs = [{ path: "/", title: "홈" }, ...(parent ? [parent] : []), { path, title }];
  const url = absoluteUrl(path);
  return <>
    <StructuredData data={{ "@context": "https://schema.org", "@graph": [
      { "@type": type, "@id": `${url}#webpage`, url, name: title, description, inLanguage: "ko-KR", isPartOf: { "@id": absoluteUrl("/#website") }, about: { "@id": absoluteUrl("/#organization") }, breadcrumb: { "@id": `${url}#breadcrumb` } },
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.title, item: absoluteUrl(c.path) })) },
      ...entities,
    ] }} />
    <nav className="seo-breadcrumb" aria-label="현재 위치"><ol>{crumbs.map((c, i) => <li key={c.path}>{i === crumbs.length - 1 ? <span aria-current="page">{c.title}</span> : <Link href={c.path}>{c.title}</Link>}</li>)}</ol></nav>
  </>;
}
