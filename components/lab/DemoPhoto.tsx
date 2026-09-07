"use client";

import { useState, type ReactNode } from "react";

export default function DemoPhoto({ src, alt, className, fallback, eager = false }: {
  src: string; alt: string; className?: string; fallback?: ReactNode; eager?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} loading={eager ? "eager" : "lazy"}
    decoding="async" fetchPriority={eager ? "high" : "auto"} onError={() => setFailed(src)} />;
}
