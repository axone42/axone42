"use client";

import * as React from "react";
import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
};

export default function Reveal({ children, className, delay = 0, as = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 이미 화면 안(첫 화면)에 있으면 즉시 표시해 깜빡임 방지
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh * 0.9 && rect.bottom > 0) {
      el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as keyof React.JSX.IntrinsicElements;
  return (
    // @ts-expect-error dynamic tag ref typing
    <Tag ref={ref} className={className} data-reveal style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
