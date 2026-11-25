"use client";

import FocusedSearchField from "@/components/ui/FocusedSearchField";
import IosKeyboard from "@/components/ui/IosKeyboard";
import PolaroidCard, {
  type PolaroidFrom,
} from "@/components/ui/PolaroidCard";
import RecommendationList from "@/components/ui/RecommendationList";
import { UL_ASSETS } from "@/lib/uniLocateTokens";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useCallback } from "react";

/* Paper PolaroidCards frame left:-140 top:-137 → screen coords */
const POLAROIDS: {
  src: string;
  left: number;
  top: number;
  rotate: number;
  from: PolaroidFrom;
  imageStyle?: CSSProperties;
}[] = [
  {
    src: "/images/image-7.webp",
    left: 54,
    top: -110.34,
    rotate: -12.22,
    from: "top",
    imageStyle: {
      width: "115px",
      height: "153px",
      maxWidth: "none",
      position: "absolute",
      left: "-1.69px",
      top: "-36.69px",
    },
  },
  {
    src: "/images/image-6.webp",
    left: 378,
    top: 104.44,
    rotate: -18.24,
    from: "right",
    imageStyle: {
      width: "112px",
      height: "199px",
      maxWidth: "none",
      position: "absolute",
      left: "0.31px",
      top: "-54.69px",
    },
  },
  {
    src: "/images/image-5.webp",
    left: -99.64,
    top: 145,
    rotate: 11.27,
    from: "left",
    imageStyle: {
      width: "112px",
      height: "167px",
      maxWidth: "none",
      position: "absolute",
      left: "-0.32px",
      top: "-12.32px",
    },
  },
  {
    src: "/images/image-2.webp",
    left: 403.36,
    top: 574,
    rotate: 10.44,
    from: "right",
    imageStyle: {
      width: "117px",
      height: "156px",
      maxWidth: "none",
      position: "absolute",
      left: "-3px",
      top: "-29px",
    },
  },
  {
    src: "/images/image-3.webp",
    left: -140,
    top: 647.76,
    rotate: -18.4,
    from: "left",
    imageStyle: {
      width: "142px",
      height: "189px",
      maxWidth: "none",
      position: "absolute",
      left: "-0.32px",
      top: "-31.32px",
    },
  },
  {
    src: "/images/image-7.webp",
    left: 184,
    top: 866.66,
    rotate: -12.22,
    from: "bottom",
    imageStyle: {
      width: "115px",
      height: "153px",
      maxWidth: "none",
      position: "absolute",
      left: "-1.69px",
      top: "-36.69px",
    },
  },
];

type Props = {
  onClose?: () => void;
  hideSearch?: boolean;
  hideTitle?: boolean;
  hideKeyboard?: boolean;
  hideRecs?: boolean;
  hideMap?: boolean;
  /** Muted polaroids only — chrome owned by flow */
  shellOnly?: boolean;
  exiting?: boolean;
  query?: string;
  showRecs?: boolean;
  onClear?: () => void;
};

export default function SearchCollegeOnClickFirstTime({
  onClose,
  hideSearch = false,
  hideTitle = false,
  hideKeyboard = false,
  hideRecs = false,
  hideMap = false,
  shellOnly = false,
  exiting = false,
  query = "Pillai College",
  showRecs = true,
  onClear,
}: Props) {
  const dismissOutside = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (shellOnly || exiting || !onClose) return;
      const target = e.target as Element | null;
      if (!target?.closest) return;
      if (target.closest(".ul-search, .sco-recs, .sco-kb, .ul-shared-search"))
        return;
      onClose();
    },
    [exiting, onClose, shellOnly],
  );

  return (
    <div
      className={[
        "sco",
        shellOnly ? "sco--shell" : exiting ? "sco--exit" : "sco--enter",
        hideSearch ? "sco--shared-search" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Search College — focused"
      onClick={dismissOutside}
    >
      {hideMap ? null : (
        <div className="sco__map-wrap" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sco__map" src={UL_ASSETS.backgroundMap} alt="" />
        </div>
      )}

      {POLAROIDS.map((card, i) => (
        <PolaroidCard
          key={`${card.src}-${i}`}
          src={card.src}
          left={card.left}
          top={card.top}
          rotate={card.rotate}
          from={card.from}
          enterIndex={i}
          imageStyle={card.imageStyle}
          muted
        />
      ))}

      {hideTitle ? null : <h1 className="sco__title">Search College</h1>}

      {hideSearch ? null : (
        <FocusedSearchField
          className="sco__search"
          query={query}
          onClear={onClear}
        />
      )}

      {!hideRecs && showRecs ? (
        <RecommendationList className="sco__recs" />
      ) : null}

      {hideKeyboard ? null : <IosKeyboard className="sco__keyboard" />}
    </div>
  );
}
