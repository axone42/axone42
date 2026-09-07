import { site } from "@/lib/site";
import { services } from "@/lib/services";

export default function JsonLd() {
  const base = site.url.replace(/\/$/, "");

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: `${site.name}(${site.nameEn})`,
        alternateName: site.nameEn,
        url: base,
        logo: { "@type": "ImageObject", url: `${base}/icon.svg` },
        email: site.email,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: site.email,
          areaServed: "KR",
          availableLanguage: ["Korean"],
        },
        founder: { "@type": "Person", name: site.ceo },
        foundingDate: site.established,
        address: {
          "@type": "PostalAddress",
          addressCountry: "KR",
          addressLocality: "부천시",
          addressRegion: "경기도",
          streetAddress: "원미구 부천로3번길 48, 7층 725호",
        },
        description: site.description,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: `${site.name}(${site.nameEn})`,
        publisher: { "@id": `${base}/#organization` },
        inLanguage: "ko-KR",
      },
      ...services.map((s) => ({
        "@type": "Service",
        name: s.title,
        description: s.summary,
        provider: { "@id": `${base}/#organization` },
        areaServed: "KR",
        url: `${base}/services#${s.id}`,
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
