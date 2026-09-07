"use client";

import { useState, type ReactNode } from "react";
import imageSizes from "@/lib/demo-image-sizes.json";

export default function DemoPhoto({ src, alt, className, fallback, eager = false }: {
  src: string; alt: string; className?: string; fallback?: ReactNode; eager?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src) return <>{fallback}</>;
  const size = (imageSizes as Record<string, { width: number; height: number }>)[src];
  return <img src={src} alt={alt} className={className} loading={eager ? "eager" : "lazy"}
    width={size?.width} height={size?.height}
    decoding="async" fetchPriority={eager ? "high" : "auto"} onError={() => setFailed(src)} />;
}
