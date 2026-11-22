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
  { id: "edge", label: "Edge cases" },
  { id: "outcome", label: "Outcome" },
] as const;

export function SectionSpy({ activeId }: { activeId?: string }) {
  const [current, setCurrent] = useState(activeId ?? "thumbnail");

  useEffect(() => {
    if (activeId) setCurrent(activeId);
  }, [activeId]);

  useEffect(() => {
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setCurrent(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
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
