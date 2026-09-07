"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gaId, trackConversion } from "@/lib/analytics";

export default function SiteAnalytics() {
  const pathname = usePathname();
  const previousPath = useRef("");
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (gaId && !window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer!.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", gaId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: window.location.origin + pathname, page_referrer: "" });
    }
    if (previousPath.current !== pathname) {
      if (gaId) {
        window.gtag?.("set", { page_location: window.location.origin + pathname, page_referrer: "" });
        window.gtag?.("event", "page_view", { page_location: window.location.origin + pathname, page_title: document.title, page_referrer: "" });
      }
      if (pathname.startsWith("/lab/")) trackConversion("demo_view", { project_id: pathname.split("/")[2] });
      previousPath.current = pathname;
    }
    let interacted = false;
    const onInteraction = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      if (!interacted && pathname.startsWith("/lab/") && event.target.closest(".labx__stage button, .labx__stage input, .labx__stage select, .labx__stage textarea")) {
        interacted = true;
        trackConversion("demo_interaction", { project_id: pathname.split("/")[2] });
      }
      const link = event.target.closest("a[href]");
      if (event.type === "click" && link) {
        const url = new URL(link.getAttribute("href")!, window.location.origin);
        if (url.origin === window.location.origin && url.pathname === "/contact") trackConversion("contact_click", { source: "navigation" });
        if (pathname === "/contact" && url.protocol === "mailto:") trackConversion("email_click", { source: "contact" });
      }
    };
    document.addEventListener("click", onInteraction);
    document.addEventListener("change", onInteraction);
    return () => { document.removeEventListener("click", onInteraction); document.removeEventListener("change", onInteraction); };
  }, [pathname]);
  return gaId && !pathname.startsWith("/admin") ? <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" /> : null;
}
