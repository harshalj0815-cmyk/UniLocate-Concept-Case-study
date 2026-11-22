"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type ExpandableBodyProps = {
  children: ReactNode;
  /** Collapsed line count on phone; Matiks uses 4 */
  lines?: number;
};

export function ExpandableBody({ children, lines = 4 }: ExpandableBodyProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => {
      setMobile(mq.matches);
      if (!mq.matches) setExpanded(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!mobile) {
      setNeedsToggle(false);
      return;
    }
    const el = bodyRef.current;
    if (!el) return;

    // Measure full height while expanded (no clamp)
    const wasCollapsed = el.classList.contains("is-collapsed");
    el.classList.remove("is-collapsed");
    const full = el.scrollHeight;
    if (wasCollapsed) el.classList.add("is-collapsed");

    const fontSize = parseFloat(getComputedStyle(el).fontSize) || 17;
    const lineHeight = 1.7 * fontSize;
    const limit = lineHeight * lines;
    setNeedsToggle(full > limit + 4);
  }, [mobile, children, lines, expanded]);

  const collapsed = mobile && needsToggle && !expanded;

  return (
    <div
      className={`expandable${collapsed ? " expandable--collapsed" : ""}${
        mobile && needsToggle ? " expandable--mobile" : ""
      }`}
    >
      <div
        ref={bodyRef}
        className={`expandable__body${collapsed ? " is-collapsed" : ""}`}
        style={
          collapsed
            ? ({ ["--expandable-lines" as string]: lines } as CSSProperties)
            : undefined
        }
      >
        {children}
      </div>
      {mobile && needsToggle ? (
        <button
          type="button"
          className="expandable__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
