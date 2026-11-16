"use client";

import type { CSSProperties } from "react";
import { paperSquirclePath } from "@/lib/continuousCorner";
import { UL } from "@/lib/uniLocateTokens";

const PATH = paperSquirclePath(UL.control.w, UL.control.h, UL.control.radius);

type SecondaryCtaProps = {
  label: string;
  iconSrc: string;
  iconWidth?: number;
  iconHeight?: number;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

/** White secondary auth CTA — Paper SignUp CTA Secondary */
export default function SecondaryCta({
  label,
  iconSrc,
  iconWidth = 30,
  iconHeight = 30,
  className = "",
  style,
  onClick,
}: SecondaryCtaProps) {
  return (
    <button
      type="button"
      className={`ul-sec-cta ${className}`.trim()}
      style={style}
      onClick={onClick}
    >
      <svg
        className="ul-sec-cta__shape"
        viewBox={`0 0 ${UL.control.w} ${UL.control.h}`}
        width={UL.control.w}
        height={UL.control.h}
        aria-hidden
      >
        <path
          d={PATH}
          fill="#FFFFFF"
          stroke="#EAEAEA"
          strokeWidth="1"
        />
      </svg>
      <span className="ul-sec-cta__row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="ul-sec-cta__icon"
          src={iconSrc}
          alt=""
          width={iconWidth}
          height={iconHeight}
          draggable={false}
        />
        <span className="ul-sec-cta__label">{label}</span>
      </span>
    </button>
  );
}
