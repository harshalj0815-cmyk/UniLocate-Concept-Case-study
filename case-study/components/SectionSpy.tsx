"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "thumbnail", label: "Thumbnail" },
  { id: "brief", label: "Project Brief" },
  { id: "research", label: "Problem Exploration" },
  { id: "users", label: "Target users" },
  { id: "problem", label: "Problem Statement" },
  { id: "ideation", label: "Ideation" },
  { id: "journey", label: "Journey Mapping" },
  { id: "decisions", label: "Decisions" },
  { id: "prototype", label: "Prototype" },
  { id: "tradeoffs", label: "Trade-offs" },
  { id: "edge", label: "Edge cases" },
  { id: "iterations", label: "Design iterations" },
  { id: "outcome", label: "Outcome" },
] as const;

export function SectionSpy({ activeId }: { activeId?: string }) {
  const [current, setCurrent] = useState(activeId ?? "thumbnail");

  useEffect(() => {
    if (activeId) setCurrent(activeId);
  }, [activeId]);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      // Reading line: a section is current once its top has passed this line.
      const line = window.innerHeight * 0.35;
      let active: string = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        // Skip anchors that are not rendered yet (hidden placeholders).
        if (!el || el.hidden || el.getClientRects().length === 0) continue;
        if (el.getBoundingClientRect().top <= line) active = s.id;
        else break;
      }
      setCurrent(active);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <nav className="section-spy" aria-label="Section map">
      {SECTIONS.map((section) => {
        const isActive = section.id === current;
        return (
          <div key={section.id} className="section-spy__item">
            <a
              href={`#${section.id}`}
              className="section-spy__btn"
              aria-label={section.label}
              aria-current={isActive ? "true" : undefined}
            >
              <span className="section-spy__tick" />
            </a>
            <div className="section-spy__tip" role="tooltip" aria-hidden="true">
              <p className="section-spy__tip-label">{section.label}</p>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
