"use client";

import { useState } from "react";
import { faqs } from "@/lib/faq";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="faq">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div className={`faq__item${isOpen ? " is-open" : ""}`} key={f.q}>
            <button
              type="button"
              className="faq__q"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span>{f.q}</span>
              <span className="faq__icon" aria-hidden>{isOpen ? "−" : "+"}</span>
            </button>
            <div className="faq__a" hidden={!isOpen}>
              <p>{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
