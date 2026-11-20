"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { paperSquirclePath } from "@/lib/continuousCorner";

type Props = {
  children: ReactNode;
  className?: string;
  /** Continuous corner radius — matches app controls (16) / cards (20) */
  radius?: number;
  /** Seed size before measure — avoids first-paint flash */
  seedWidth?: number;
  seedHeight?: number;
  "aria-label"?: string;
};

/**
 * White squircle sticker shell — same SVG + drop-shadow approach as
 * CollegeResultCard (shadow follows the continuous corner).
 */
export default function ProtoSquircle({
  children,
  className = "",
  radius = 20,
  seedWidth = 280,
  seedHeight = 48,
  "aria-label": ariaLabel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(seedWidth);
  const [h, setH] = useState(seedHeight);
  const path = paperSquirclePath(w, h, radius);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      setW(Math.max(1, Math.round(el.offsetWidth)));
      setH(Math.max(1, Math.round(el.offsetHeight)));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`proto-squircle ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <svg
        className="proto-squircle__shape"
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        aria-hidden
      >
        <path d={path} fill="#ffffff" stroke="#eaeaea" strokeWidth={1} />
      </svg>
      <div className="proto-squircle__body">{children}</div>
    </div>
  );
}
