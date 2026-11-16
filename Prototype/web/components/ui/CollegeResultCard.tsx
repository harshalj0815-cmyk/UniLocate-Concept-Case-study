"use client";

import type { CollegeResult } from "@/lib/collegeResults";
import { paperSquircleClip, paperSquirclePath } from "@/lib/continuousCorner";
import { useSquircleClip } from "@/hooks/useSquircleClip";
import { useSquirclePath } from "@/hooks/useSquirclePath";

const CARD_W = 360;
const CARD_R = 16;
const MEDIA_W = 344; /* 360 − 8 − 8 */
const MEDIA_H = 168;
const MEDIA_R = 12;
const MEDIA_PATH = paperSquirclePath(MEDIA_W, MEDIA_H, MEDIA_R);
const MEDIA_CLIP = paperSquircleClip(MEDIA_W, MEDIA_H, MEDIA_R);

type Props = {
  result: CollegeResult;
  className?: string;
};

function ResultChip({
  label,
  fill,
  border,
}: {
  label: string;
  fill: string;
  border: string;
}) {
  /* Clip on the face only — shadow stays on the outer shell (no bleed) */
  const { ref, style } = useSquircleClip<HTMLSpanElement>(8);
  return (
    <span className="cr-chip">
      <span
        ref={ref}
        className="cr-chip__face"
        style={{
          ...style,
          backgroundImage: fill,
          borderColor: border,
        }}
      >
        {label}
      </span>
    </span>
  );
}

/** Paper CollegeResultCard — SVG squircle shell (same approach as search) */
export default function CollegeResultCard({
  result,
  className = "",
}: Props) {
  const { ref, path, height } = useSquirclePath<HTMLElement>(CARD_W, CARD_R);

  return (
    <article
      ref={ref}
      className={`cr-card ${className}`.trim()}
    >
      <svg
        className="cr-card__shape"
        viewBox={`0 0 ${CARD_W} ${height}`}
        width={CARD_W}
        height={height}
        aria-hidden
      >
        <path
          d={path}
          fill="#ffffff"
          stroke="#eaeaea"
          strokeWidth={1}
        />
      </svg>

      <div className="cr-card__body">
        <div
          className="cr-card__media"
          style={{ clipPath: MEDIA_CLIP, borderRadius: 0 }}
        >
          <svg
            className="cr-card__media-shape"
            viewBox={`0 0 ${MEDIA_W} ${MEDIA_H}`}
            width={MEDIA_W}
            height={MEDIA_H}
            aria-hidden
          >
            <path
              d={MEDIA_PATH}
              fill="#dddddd"
              stroke="#eaeaea"
              strokeWidth={1}
            />
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.image} alt="" draggable={false} />
        </div>
        <div className="cr-card__info">
          <h2 className="cr-card__name">{result.name}</h2>
          <div className="cr-card__chips">
            {result.chips.map((chip) => (
              <ResultChip
                key={chip.label}
                label={chip.label}
                fill={chip.fill}
                border={chip.border}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
