import type { CSSProperties } from "react";
import type { PolaroidFrom } from "@/components/ui/PolaroidCard";

export type ScenePolaroid = {
  id: string;
  src: string;
  rotate: number;
  from: PolaroidFrom;
  home: { left: number; top: number };
  focus: { left: number; top: number };
  imageStyle?: CSSProperties;
};

/** Same six cards — home → focused poses (Paper FirstTime / OnClick) */
export const SCENE_POLAROIDS: ScenePolaroid[] = [
  {
    id: "p0",
    src: "/images/image-7.webp",
    rotate: -12.22,
    from: "top",
    home: { left: 54, top: -48.34 },
    focus: { left: 54, top: -128 },
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
    id: "p1",
    src: "/images/image-6.webp",
    rotate: -18.24,
    from: "right",
    home: { left: 324, top: 104.44 },
    focus: { left: 396, top: 104.44 },
    imageStyle: {
      objectPosition: "0% 62.86%",
      objectFit: "cover",
      width: "100%",
      height: "177.7%",
    },
  },
  {
    id: "p2",
    src: "/images/image-5.webp",
    rotate: 11.27,
    from: "left",
    home: { left: -34.37, top: 145 },
    focus: { left: -118, top: 145 },
    imageStyle: {
      objectPosition: "50.02% 22.39%",
      objectFit: "cover",
      width: "100.04%",
      height: "149.18%",
    },
  },
  {
    id: "p3",
    src: "/images/image-2.webp",
    rotate: 10.44,
    from: "right",
    home: { left: 338.83, top: 574 },
    focus: { left: 422, top: 574 },
    imageStyle: {
      objectPosition: "61.19% 100%",
      objectFit: "cover",
      width: "104.5%",
      height: "122.83%",
    },
  },
  {
    id: "p4",
    src: "/images/image-3.webp",
    rotate: -18.4,
    from: "left",
    home: { left: -58, top: 646.76 },
    focus: { left: -158, top: 647.76 },
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
    id: "p5",
    src: "/images/image-7.webp",
    rotate: -12.22,
    from: "bottom",
    home: { left: 138, top: 804.66 },
    focus: { left: 198, top: 888 },
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

/* Warm the photos at load so the home entrance never waits on the network */
if (typeof window !== "undefined") {
  for (const card of SCENE_POLAROIDS) {
    const img = new Image();
    img.src = card.src;
  }
}
