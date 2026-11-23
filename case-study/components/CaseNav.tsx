"use client";

import { useEffect, useState } from "react";

export function CaseNav() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;

        if (y < 24) {
          setHidden(false);
        } else if (delta > 6) {
          setHidden(true);
        } else if (delta < -6) {
          setHidden(false);
        }

        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`case-nav${hidden ? " case-nav--hidden" : ""}`}
      aria-hidden={hidden || undefined}
    >
      <a className="case-nav__brand" href="#thumbnail">
        UniLocate
      </a>
      <p className="case-nav__meta">Concept case study</p>
      <a className="case-nav__cta" href="#prototype">
        Prototype
      </a>
    </header>
  );
}
