"use client";

import type { AnimationEvent, CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import CtaDash from "@/components/ui/CtaDash";
import { paperSquircleClip } from "@/lib/continuousCorner";
import { UL } from "@/lib/uniLocateTokens";

type PrimaryCtaProps = {
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** Override default 360 control width (e.g. stair confirm 112) */
  width?: number;
  height?: number;
  /** Entrance blur→sharp — skip when returning to home */
  animate?: boolean;
  onClick?: () => void;
};

/** Shared UniLocate primary CTA — Paper gradient + #76C6FF dash */
export default function PrimaryCta({
  label = "Get Started",
  className = "",
  style,
  width = UL.control.w,
  height = UL.control.h,
  animate = true,
  onClick,
}: PrimaryCtaProps) {
  const [crisp, setCrisp] = useState(!animate);
  const clip = paperSquircleClip(width, height, UL.control.radius);
  const narrow = width !== UL.control.w;

  const markCrisp = useCallback(() => setCrisp(true), []);

  const onAnimEnd = useCallback(
    (e: AnimationEvent<HTMLButtonElement>) => {
      if (
        e.animationName === "scf-cta-enter" ||
        e.animationName === "scf-fade-in"
      ) {
        markCrisp();
      }
    },
    [markCrisp],
  );

  /* Fallback — delay 1620 + duration 260 */
  useEffect(() => {
    if (!animate) return;
    const t = window.setTimeout(markCrisp, 1980);
    return () => window.clearTimeout(t);
  }, [animate, markCrisp]);

  return (
    <button
      type="button"
      className={`ul-cta ${crisp ? "ul-cta--crisp" : ""} ${narrow ? "ul-cta--narrow" : ""} ${className}`.trim()}
      style={{
        clipPath: clip,
        width,
        height,
        backgroundImage: UL.ctaGradient,
        ...(narrow ? { left: "auto", marginLeft: 0 } : null),
        ...style,
      }}
      onAnimationEnd={onAnimEnd}
      onClick={onClick}
    >
      <span className="ul-cta__fill" aria-hidden style={{ backgroundImage: UL.ctaGradient }} />
      <CtaDash width={width} height={height} />
      <span className="ul-cta__label">{label}</span>
    </button>
  );
}
