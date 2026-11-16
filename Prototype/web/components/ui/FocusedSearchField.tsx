"use client";

import type { CSSProperties } from "react";
import { paperSquirclePath } from "@/lib/continuousCorner";
import { UL, UL_ASSETS } from "@/lib/uniLocateTokens";

const PATH = paperSquirclePath(UL.control.w, UL.control.h, UL.control.radius);

type FocusedSearchFieldProps = {
  query?: string;
  className?: string;
  style?: CSSProperties;
  onClear?: () => void;
  /** Tap empty → type; tap filled → restore suggestions */
  onActivate?: () => void;
  /** Blinking caret — hide on results */
  showCaret?: boolean;
};

/** Focused search control — Paper SearchBar-Focused (black query + caret + Cross.svg) */
export default function FocusedSearchField({
  query = "Pillai College",
  className = "",
  style,
  onClear,
  onActivate,
  showCaret = true,
}: FocusedSearchFieldProps) {
  return (
    <div
      className={`ul-search ul-search--focused ${onActivate ? "ul-search--tappable" : ""} ${className}`.trim()}
      role="search"
      style={style}
      onClick={onActivate}
    >
      <svg
        className="ul-search__shape"
        viewBox={`0 0 ${UL.control.w} ${UL.control.h}`}
        width={UL.control.w}
        height={UL.control.h}
        aria-hidden
      >
        <path
          d={PATH}
          fill={UL.search.fill}
          stroke={UL.search.stroke}
          strokeWidth="1"
        />
      </svg>
      <div className="ul-search__row ul-search__row--focused">
        <div className="ul-search__value">
          {query ? (
            <span className="ul-search__query">{query}</span>
          ) : null}
          {showCaret ? (
            <span className="ul-search__caret" aria-hidden />
          ) : null}
        </div>
        {query ? (
          <button
            type="button"
            className="ul-search__clear"
            aria-label="Clear search"
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={UL_ASSETS.clearIcon} alt="" width={29} height={29} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
