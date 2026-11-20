"use client";

const SECTIONS = [
  { id: "thumbnail", label: "Thumbnail" },
  { id: "brief", label: "Project Brief" },
  { id: "research", label: "Research" },
  { id: "users", label: "Target users" },
  { id: "problem", label: "Problem Statement" },
  { id: "ideation", label: "Ideation" },
  { id: "decisions", label: "Decisions" },
  { id: "prototype", label: "Prototype" },
  { id: "edge", label: "Edge cases" },
  { id: "outcome", label: "Outcome" },
] as const;

export function SectionSpy({ activeId = "thumbnail" }: { activeId?: string }) {
  return (
    <nav className="section-spy" aria-label="Section map">
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="section-spy__btn"
          aria-label={section.label}
          aria-current={section.id === activeId ? "true" : undefined}
          title={section.label}
        />
      ))}
    </nav>
  );
}
