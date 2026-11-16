"use client";

import type { AnimationEvent, CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import CtaDash from "@/components/ui/CtaDash";
import { paperSquircleClip } from "@/lib/continuousCorner";
import { UL } from "@/lib/uniLocateTokens";

const CLIP = paperSquircleClip(UL.control.w, UL.control.h, UL.control.radius);

type PrimaryCtaProps = {
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** Entrance blur→sharp — skip when returning to home */
  animate?: boolean;
  onClick?: () => void;
};

/** Shared UniLocate primary CTA — Paper gradient + #76C6FF dash */
export default function PrimaryCta({
  label = "Get Started",
  className = "",
  style,
  animate = true,
  onClick,
}: PrimaryCtaProps) {
  const [crisp, setCrisp] = useState(!animate);

  const markCrisp = useCallback(() => setCrisp(true), []);

  const onAnimEnd = useCallback(
    (e: AnimationEvent<HTMLDivElement>) => {
      if (
        e.animationName === "scf-cta-enter" ||
        e.animationName === "scf-fade-in"
      ) {
        markCrisp();
      }
    },
    [markCrisp],
  );

  /* Fallback — delay 1340 + duration 260 */
  useEffect(() => {
    if (!animate) return;
    const t = window.setTimeout(markCrisp, 1700);
    return () => window.clearTimeout(t);
  }, [animate, markCrisp]);

  return (
    <button
      type="button"
      className={`ul-cta ${crisp ? "ul-cta--crisp" : ""} ${className}`.trim()}
      style={{ clipPath: CLIP, ...style }}
      onAnimationEnd={onAnimEnd}
      onClick={onClick}
    >
      <CtaDash />
      <span className="ul-cta__label">{label}</span>
    </button>
  );
}
