export type ConversionEvent = "service_select" | "service_deselect" | "demo_view" | "demo_interaction" | "contact_click" | "contact_start" | "contact_submit" | "contact_error" | "generate_lead" | "email_draft" | "email_click";
type EventDetails = { service_id?: string; project_id?: string; source?: "home" | "services" | "pricing" | "contact" | "navigation"; reason?: "validation" | "server" | "network" };

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; }
}
export const gaId = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_ID ?? "") ? process.env.NEXT_PUBLIC_GA_ID : undefined;

export function trackConversion(event: ConversionEvent, details: EventDetails = {}) {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) return;
  // Only fixed event identifiers are collected. Never send form values or full query strings.
  const params: Record<string, string> = { page_path: window.location.pathname };
  for (const key of ["service_id", "project_id", "source", "reason"] as const) {
    const value = details[key];
    if (value && /^[a-z0-9-]{1,64}$/.test(value)) params[key] = value;
  }
  window.dispatchEvent(new CustomEvent("axone:conversion", { detail: { event, params } }));
  // Analytics must never interrupt pricing or inquiry submission.
  try { if (gaId) window.gtag?.("event", event, params); } catch { /* Best-effort measurement. */ }
}
