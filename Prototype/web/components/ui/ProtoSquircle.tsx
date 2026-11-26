"use client";

import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Corner radius of the inner surface */
  radius?: number;
  "aria-label"?: string;
};

/**
 * Case-study sticker shell: thick white rim, squircle corners, soft shadow.
 * Same recipe as `.sticker` / `.stat-sticker` on the case study page.
 */
export default function ProtoSquircle({
  children,
  className = "",
  radius = 20,
  "aria-label": ariaLabel,
}: Props) {
  return (
    <div
      className={`proto-squircle ${className}`.trim()}
      style={{ "--proto-r": `${radius + 6}px` } as CSSProperties}
      aria-label={ariaLabel}
    >
      <div className="proto-squircle__body">{children}</div>
    </div>
  );
}
