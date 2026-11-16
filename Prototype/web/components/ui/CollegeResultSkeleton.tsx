"use client";

import { paperSquircleClip } from "@/lib/continuousCorner";
import { useSquircleClip } from "@/hooks/useSquircleClip";
import { useSquirclePath } from "@/hooks/useSquirclePath";

const CARD_W = 360;
const CARD_R = 16;
const MEDIA_W = 344;
const MEDIA_H = 168;
const MEDIA_CLIP = paperSquircleClip(MEDIA_W, MEDIA_H, 12);
const CHIP_CLIP = paperSquircleClip(134, 27, 8);

type Props = {
  className?: string;
};

/** Paper CollegeResultCard-Skeleton — SVG squircle shell matches live cards */
export default function CollegeResultSkeleton({ className = "" }: Props) {
  const { ref, path, height } = useSquirclePath<HTMLElement>(CARD_W, CARD_R);
  const lineFull = useSquircleClip<HTMLDivElement>(18);
  const lineMid = useSquircleClip<HTMLDivElement>(18);

  return (
    <article
      ref={ref}
      className={`cr-skel ${className}`.trim()}
      aria-hidden
    >
      <svg
        className="cr-skel__shape"
        viewBox={`0 0 ${CARD_W} ${height}`}
        width={CARD_W}
        height={height}
      >
        <path
          d={path}
          fill="#ffffff"
          stroke="#eaeaea"
          strokeWidth={1}
        />
      </svg>

      <div className="cr-skel__body">
        <div
          className="cr-skel__media cr-skel__bone"
          style={{ clipPath: MEDIA_CLIP, borderRadius: 0 }}
        />
        <div className="cr-skel__lines">
          <div
            ref={lineFull.ref}
            className="cr-skel__line cr-skel__line--full cr-skel__bone"
            style={lineFull.style}
          />
          <div
            ref={lineMid.ref}
            className="cr-skel__line cr-skel__line--mid cr-skel__bone"
            style={lineMid.style}
          />
        </div>
        <div className="cr-skel__chips">
          <div
            className="cr-skel__chip cr-skel__bone"
            style={{ clipPath: CHIP_CLIP, borderRadius: 0 }}
          />
        </div>
      </div>
    </article>
  );
}
