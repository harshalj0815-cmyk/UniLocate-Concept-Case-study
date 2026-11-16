"use client";

import { paperSquircleClip } from "@/lib/continuousCorner";

const RECS = [
  {
    label: "Pillai College of Art Commerce and Science, New Panvel",
    nearest: true,
  },
  { label: "Pillai College of Engineering, New Panvevl" },
  { label: "Pillai HOC" },
  { label: "Pillai of Management, Panvel" },
  { label: "Pillai of Architecture" },
] as const;

/** Fixed Paper Recommendation panel 360×240, r16 */
const RECS_CLIP = paperSquircleClip(360, 240, 16);
/** Fixed Paper Nearest chip 64×27, r8 */
const NEAREST_CLIP = paperSquircleClip(64, 27, 8);

type RecommendationListProps = {
  className?: string;
};

/** Paper Recommendation Card — 360×240 under focused search */
export default function RecommendationList({
  className = "",
}: RecommendationListProps) {
  return (
    <div
      className={`sco-recs ${className}`.trim()}
      role="listbox"
      style={{ clipPath: RECS_CLIP, borderRadius: 0 }}
    >
      {RECS.map((row, i) => (
        <div
          key={row.label}
          className="sco-recs__row"
          role="option"
          style={{ ["--row-i" as string]: i }}
        >
          <span className="sco-recs__label">{row.label}</span>
          {"nearest" in row && row.nearest ? (
            <div className="sco-recs__nearest-fade" aria-hidden>
              <span
                className="sco-recs__nearest"
                style={{ clipPath: NEAREST_CLIP, borderRadius: 0 }}
              >
                Nearest
              </span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
