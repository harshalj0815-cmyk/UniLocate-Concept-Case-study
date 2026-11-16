"use client";

import PolaroidCard, {
  type PolaroidFrom,
} from "@/components/ui/PolaroidCard";
import PrimaryCta from "@/components/ui/PrimaryCta";
import SearchField from "@/components/ui/SearchField";
import ScfLogo from "@/components/ui/ScfLogo";
import { UL_ASSETS } from "@/lib/uniLocateTokens";
import type { CSSProperties } from "react";

const POLAROIDS: {
  src: string;
  left: number;
  top: number;
  rotate: number;
  from: PolaroidFrom;
  imageStyle?: CSSProperties;
}[] = [
  {
    src: "/images/image-7.jpg",
    left: 54,
    top: -48.34,
    rotate: -12.22,
    from: "top",
  },
  {
    src: "/images/image-6.jpg",
    left: 324,
    top: 104.44,
    rotate: -18.24,
    from: "right",
    imageStyle: {
      objectPosition: "0% 62.86%",
      objectFit: "cover",
      width: "100%",
      height: "177.7%",
    },
  },
  {
    src: "/images/image-5.jpg",
    left: -34.37,
    top: 145,
    rotate: 11.27,
    from: "left",
    imageStyle: {
      objectPosition: "50.02% 22.39%",
      objectFit: "cover",
      width: "100.04%",
      height: "149.18%",
    },
  },
  {
    src: "/images/image-2.jpg",
    left: 338.83,
    top: 574,
    rotate: 10.44,
    from: "right",
    imageStyle: {
      objectPosition: "61.19% 100%",
      objectFit: "cover",
      width: "104.5%",
      height: "122.83%",
    },
  },
  {
    src: "/images/image-3.jpg",
    left: -58,
    top: 646.76,
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
    src: "/images/image-7.jpg",
    left: 138,
    top: 804.66,
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
  /** Entrance motion — only on the very first visit */
  animate?: boolean;
  hideSearch?: boolean;
  hideTitle?: boolean;
  hideMap?: boolean;
  hidePolaroids?: boolean;
  dimmed?: boolean;
  onSearchActivate?: () => void;
  onGetStarted?: () => void;
};

export default function SearchCollegeFirstTime({
  animate = true,
  hideSearch = false,
  hideTitle = false,
  hideMap = false,
  hidePolaroids = false,
  dimmed = false,
  onSearchActivate,
  onGetStarted,
}: Props) {
  return (
    <div
      className={[
        "scf",
        animate ? "scf--enter" : "scf--settled",
        dimmed ? "scf--dimmed" : "",
        hideMap ? "scf--no-map" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Search College — first time"
    >
      {hideMap ? null : (
        <div className="scf__map-wrap" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="scf__map" src={UL_ASSETS.backgroundMap} alt="" />
        </div>
      )}

      {hidePolaroids
        ? null
        : POLAROIDS.map((card, i) => (
            <PolaroidCard
              key={`${card.src}-${i}`}
              src={card.src}
              left={card.left}
              top={card.top}
              rotate={card.rotate}
              from={card.from}
              enterIndex={i}
              imageStyle={card.imageStyle}
              animate={animate}
            />
          ))}

      <ScfLogo animate={animate} />

      {hideTitle ? null : (
        <h1 className="scf__title">
          New here? Let’s find
          <br />
          your campus
        </h1>
      )}

      {hideSearch ? null : (
        <SearchField
          className="scf__search"
          animate={animate}
          onActivate={onSearchActivate}
        />
      )}

      <div className="scf__divider" aria-hidden>
        <hr className="scf__divider-line scf__divider-line--left" />
        <span className="scf__divider-label">Or</span>
        <hr className="scf__divider-line scf__divider-line--right" />
      </div>

      <PrimaryCta
        className="scf__cta"
        animate={animate}
        onClick={onGetStarted}
      />
    </div>
  );
}
