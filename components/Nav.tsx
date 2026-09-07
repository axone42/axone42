"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { site } from "@/lib/site";

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="nav-wrap">
      <nav className="nav">
        <Link href="/" className="nav__brand" onClick={() => setOpen(false)}>
          <span className="nav__logo" aria-hidden>AX</span>
          {site.nameEn}
        </Link>

        <ul className={`nav__links${open ? " is-open" : ""}`}>
          {site.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`nav__link${pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ? " is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/contact" className="btn btn--primary nav__cta" onClick={() => setOpen(false)}>
              상담 신청
            </Link>
          </li>
        </ul>

        <button
          className="nav__toggle"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>
    </div>
  );
}
