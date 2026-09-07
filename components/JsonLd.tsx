import { site } from "@/lib/site";
import StructuredData from "@/components/StructuredData";

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
        logo: { "@type": "ImageObject", url: `${base}/icon-512.png`, width: 512, height: 512 },
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
          addressLocality: "영등포구",
          addressRegion: "서울특별시",
          streetAddress: "국회대로66길 17, 10층",
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
    ],
  };

  return <StructuredData data={data} />;
}
